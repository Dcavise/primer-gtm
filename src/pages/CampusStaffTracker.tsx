import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ChevronDown, Plus, UserRound, Search } from "lucide-react";
import { supabase } from "../integrations/supabase-client";
import { logger } from "@/utils/logger";
import { format } from "date-fns";

// Define a type for the fellow data we'll be fetching
interface FellowData {
  id: string;
  fellow_name: string;
  grade_band: string | null;
  applied_date: string | null;
  hiring_stage: string;
  cohort: string | null;
  campus_id: string | null;
  campus_name?: string | null;
  status: string;
}

const CampusStaffTracker: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>("riverdale");
  const [stages, setStages] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fellows, setFellows] = useState<FellowData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fetchingFellows, setFetchingFellows] = useState<boolean>(true);

  // Format date helper function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  // Campus data
  const campuses = [
    { id: "riverdale", name: "Riverdale Campus" },
    { id: "brooklyn", name: "Brooklyn Campus" },
    { id: "queens", name: "Queens Campus" },
    { id: "bronx", name: "Bronx Campus" },
    { id: "manhattan", name: "Manhattan Campus" },
  ];

  // Fetch the distinct stage values from fivetran_views.fellows
  useEffect(() => {
    const fetchStages = async () => {
      setLoading(true);
      try {
        const { success, data, error } = await supabase.getFellowStages();
        
        if (success && data && data.length > 0) {
          setStages(data);
          setSelectedStage(data[0]); // Select the first stage by default
        } else {
          // Fallback to default stages if the API call fails
          const defaultStages = ["Applied", "Interviewing", "Fellowship", "Made Offer", "Hired"];
          setStages(defaultStages);
          setSelectedStage(defaultStages[0]);
          if (error) {
            console.error("Error fetching fellow stages:", error);
            setError(`Failed to fetch stages: ${error}`);
          }
        }
      } catch (err) {
        console.error("Exception fetching fellow stages:", err);
        // Fallback to default stages
        const defaultStages = ["Applied", "Interviewing", "Fellowship", "Made Offer", "Hired"];
        setStages(defaultStages);
        setSelectedStage(defaultStages[0]);
        setError("An error occurred while fetching stages");
      } finally {
        setLoading(false);
      }
    };

    fetchStages();
  }, []);

  // Handle stage selection
  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
  };
  
  // Fetch fellows data directly from the database
  useEffect(() => {
    const fetchFellows = async () => {
      setFetchingFellows(true);
      try {
        logger.info("Starting to fetch fellows data");
        
        // Direct SQL query to get fellow data with the required fields
        const query = `
          SELECT 
            id,
            fellow_name,
            grade_band,
            applied_date,
            hiring_stage,
            cohort,
            campus_id,
            status
          FROM 
            fivetran_views.fellows
          ${selectedStage ? `WHERE hiring_stage = '${selectedStage}'` : ''}
          ORDER BY 
            fellow_name ASC
        `;
        
        logger.debug(`Executing fellows query: ${query}`);
        
        const { data, error } = await supabase.regular.rpc("execute_sql_query", {
          query_text: query
        });
        
        if (error) {
          logger.error("Error fetching fellows data:", error);
          setError(`Failed to load fellows: ${error.message}`);
          setFellows([]);
        } else {
          // Extract fellows data from the response
          const fellowsData = Array.isArray(data?.rows) ? data.rows : [];
          logger.info(`Received ${fellowsData.length} fellow records`);
          
          if (fellowsData.length === 0) {
            logger.warn("No fellow records were returned despite successful query");
          } else {
            logger.debug("Sample fellow record:", fellowsData[0]);
          }
          
          setFellows(fellowsData);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error("Exception fetching fellows:", err);
        setError(`Failed to load fellows: ${errorMessage}`);
        setFellows([]);
      } finally {
        setFetchingFellows(false);
        logger.info("Finished fellows data fetch attempt");
      }
    };
    
    fetchFellows();
  }, [selectedStage]); // Re-fetch when selected stage changes
  
  // Filter fellows based on search query
  const filteredFellows = fellows.filter(fellow => 
    searchQuery === "" || 
    fellow.fellow_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fellow.grade_band && fellow.grade_band.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-4 mb-6">
        {/* Campus Selector Header - similar to the wireframe */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Select value={selectedCampus} onValueChange={setSelectedCampus}>
              <SelectTrigger className="min-w-[220px] bg-white border-gray-300">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <SelectValue placeholder="Select campus" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">{/* Filter button removed */}</div>
        </div>

        {/* Descriptive paragraph removed */}
      </div>

      {/* Pipeline Stages Tabs */}
      {loading ? (
        <div className="border-b mb-6">
          <div className="py-3 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mx-auto"></div>
            <p className="text-sm text-gray-500 mt-1">Loading stages...</p>
          </div>
        </div>
      ) : error ? (
        <div className="border-b mb-6">
          <div className="py-3 text-center text-red-500">
            <p>Error loading stages. Using default values.</p>
          </div>
        </div>
      ) : (
        <div className="border-b mb-6">
          <div className={`grid grid-cols-${Math.min(stages.length, 5)} w-full`}>
            {stages.map((stage, index) => (
              <button
                key={index}
                className={`py-3 text-center ${
                  selectedStage === stage
                    ? "border-b-2 border-black font-medium text-black"
                    : "text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-300"
                }`}
                onClick={() => handleStageSelect(stage)}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name or grade band"
          className="w-full p-3 pl-10 border border-gray-300 rounded-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {fetchingFellows && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Fellows List */}
      <div className="space-y-4">
        {!fetchingFellows && filteredFellows.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No fellows found matching your search. Try adjusting your search term or stage filter.
          </p>
        )}
        
        {filteredFellows.map((fellow) => (
          <Card key={fellow.id} className="border hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-lg font-medium">
                  {fellow.fellow_name.charAt(0)}
                </div>
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <h3 className="font-medium">{fellow.fellow_name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {fellow.grade_band || "No grade band specified"}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {fellow.cohort && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                      >
                        Cohort {fellow.cohort}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                    >
                      {fellow.hiring_stage || "Unknown stage"}
                    </Badge>
                    {fellow.status && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                      >
                        {fellow.status}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center mt-3 text-xs text-gray-500">
                    <span>Applied: {formatDate(fellow.applied_date)}</span>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>

      {/* Tabs UI for different view modes */}
      <Tabs defaultValue="cards" className="w-full mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="cards">Cards View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">{/* Card view is already implemented above */}</TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Grade Band</th>
                    <th className="text-left py-2">Campus</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Applied Date</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!fetchingFellows && filteredFellows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No fellows found matching your search. Try adjusting your search term or stage filter.
                      </td>
                    </tr>
                  )}
                  
                  {filteredFellows.map((fellow) => (
                    <tr key={fellow.id} className="border-b">
                      <td className="py-2">{fellow.fellow_name}</td>
                      <td className="py-2">{fellow.grade_band || "N/A"}</td>
                      <td className="py-2">{fellow.campus_id || "N/A"}</td>
                      <td className="py-2">{fellow.hiring_stage}</td>
                      <td className="py-2">{formatDate(fellow.applied_date)}</td>
                      <td className="py-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampusStaffTracker;
