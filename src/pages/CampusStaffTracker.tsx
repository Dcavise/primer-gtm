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
import { ChevronDown, Plus, UserRound, InfoIcon, AlertCircle } from "lucide-react";
import { supabase } from "../integrations/supabase-client";
import { logger } from "@/utils/logger";
import { format } from "date-fns";
import { Collapse } from "antd";

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

// Define a type for campus data
interface CampusData {
  id: string;
  name: string;
}

const CampusStaffTracker: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fellows, setFellows] = useState<FellowData[]>([]);
  const [fetchingFellows, setFetchingFellows] = useState<boolean>(true);
  const [selectedStage, setSelectedStage] = useState<string>("New");
  const [campuses, setCampuses] = useState<CampusData[]>([]);
  const [fetchingCampuses, setFetchingCampuses] = useState<boolean>(true);

  // Define the ordered stages
  const orderedStages = ["New", "Fellow", "Offer", "Hired", "Rejected/Declined"];

  // Format date helper function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  // Fetch campuses from the database
  useEffect(() => {
    const fetchCampuses = async () => {
      setFetchingCampuses(true);
      try {
        logger.info("Starting to fetch campus data");
        
        // SQL query to get campus data
        const query = `
          SELECT 
            id,
            name
          FROM 
            fivetran_views.campus_c
          ORDER BY 
            name ASC
        `;
        
        logger.debug(`Executing campus query: ${query}`);
        
        const { data, error } = await supabase.regular.rpc("execute_sql_query", {
          query_text: query
        });
        
        if (error) {
          logger.error("Error fetching campus data:", error);
          setError(`Failed to load campuses: ${error.message}`);
          // Set default campuses as fallback
          const defaultCampuses = [
            { id: "all", name: "All Campuses" },
            { id: "riverdale", name: "Riverdale Campus" },
            { id: "brooklyn", name: "Brooklyn Campus" },
          ];
          setCampuses(defaultCampuses);
          setSelectedCampus(defaultCampuses[0].id);
        } else {
          // Handle the response format
          let campusData: CampusData[] = [];
          
          if (Array.isArray(data)) {
            campusData = data;
          } else if (data && typeof data === 'object') {
            if (Array.isArray(data.rows)) {
              campusData = data.rows;
            } else if (data.result && Array.isArray(data.result)) {
              campusData = data.result;
            } else {
              // Try to find any array property in the response
              const arrayProp = Object.entries(data)
                .find(([_, value]) => Array.isArray(value));
              
              if (arrayProp) {
                const [propName, arrayValue] = arrayProp;
                campusData = arrayValue as CampusData[];
              }
            }
          }
          
          // Add "All Campuses" option
          campusData = [{ id: "all", name: "All Campuses" }, ...campusData];
          
          setCampuses(campusData);
          
          // Set the first campus as selected by default
          if (campusData.length > 0) {
            setSelectedCampus(campusData[0].id);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error("Exception fetching campuses:", err);
        setError(`Failed to load campuses: ${errorMessage}`);
        
        // Set default campuses as fallback
        const defaultCampuses = [
          { id: "all", name: "All Campuses" },
          { id: "riverdale", name: "Riverdale Campus" },
          { id: "brooklyn", name: "Brooklyn Campus" },
        ];
        setCampuses(defaultCampuses);
        setSelectedCampus(defaultCampuses[0].id);
      } finally {
        setFetchingCampuses(false);
      }
    };
    
    fetchCampuses();
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
        // Include join with campus_c table to get campus names
        const query = `
          SELECT 
            f.id,
            f.fellow_name,
            f.grade_band,
            f.applied_date,
            f.hiring_stage,
            f.cohort,
            f.campus_id,
            f.status,
            c.name as campus_name
          FROM 
            fivetran_views.fellows f
          LEFT JOIN 
            fivetran_views.campus_c c ON f.campus_id = c.id
          ${selectedCampus && selectedCampus !== "all" ? `WHERE f.campus_id = '${selectedCampus}'` : ''}
          ORDER BY 
            f.fellow_name ASC
        `;
        
        logger.debug(`Executing fellows query: ${query}`);
        
        const { data, error } = await supabase.regular.rpc("execute_sql_query", {
          query_text: query
        });
        
        // Log the raw response for debugging
        logger.debug("Raw response from fellows query:", data);
        
        if (error) {
          logger.error("Error fetching fellows data:", error);
          setError(`Failed to load fellows: ${error.message}`);
          setFellows([]);
        } else {
          // Handle the direct array response format
          let fellowsData: FellowData[] = [];
          
          if (Array.isArray(data)) {
            // Direct array response (expected format based on the function implementation)
            logger.info(`Received ${data.length} fellow records as direct array`);
            fellowsData = data;
          } else if (data && typeof data === 'object') {
            // Handle other possible formats for robustness
            if (Array.isArray(data.rows)) {
              logger.info(`Received ${data.rows.length} fellow records from rows property`);
              fellowsData = data.rows;
            } else if (data.result && Array.isArray(data.result)) {
              logger.info(`Received ${data.result.length} fellow records from result property`);
              fellowsData = data.result;
            } else {
              // Try to find any array property in the response
              const arrayProp = Object.entries(data)
                .find(([_, value]) => Array.isArray(value));
              
              if (arrayProp) {
                const [propName, arrayValue] = arrayProp;
                logger.info(`Found array property ${propName} with ${(arrayValue as any[]).length} records`);
                fellowsData = arrayValue as FellowData[];
              } else {
                logger.warn("No array found in response:", data);
              }
            }
          }
          
          if (fellowsData.length === 0) {
            logger.warn("No fellow records were returned despite successful query");
            logger.debug("Full response object:", JSON.stringify(data));
          } else {
            logger.debug("Sample fellow record:", fellowsData[0]);
          }
          
          // Add this for extra debugging
          console.log("Fellows data:", fellowsData);
          
          // Map database hiring stages to our ordered stages
          fellowsData = fellowsData.map(fellow => {
            let mappedStage = fellow.hiring_stage;
            const stageLC = fellow.hiring_stage ? fellow.hiring_stage.toLowerCase() : '';
            
            // Map database stages to our ordered stages (case-insensitive)
            if (stageLC === "applied" || stageLC === "interviewing") {
              mappedStage = "New";
            } else if (stageLC === "fellowship" || stageLC === "fellow") {
              mappedStage = "Fellow";
            } else if (stageLC === "made offer") {
              mappedStage = "Offer";
            } else if (stageLC === "hired") {
              mappedStage = "Hired";
            } else if (stageLC === "declined" || stageLC === "rejected") {
              mappedStage = "Rejected/Declined";
            }
            
            return {
              ...fellow,
              hiring_stage: mappedStage
            };
          });
          
          setFellows(fellowsData);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error("Exception fetching fellows:", err);
        setError(`Failed to load fellows: ${errorMessage}`);
        setFellows([]);
      } finally {
        setFetchingFellows(false);
        setLoading(false);
        logger.info("Finished fellows data fetch attempt");
      }
    };
    
    if (selectedCampus) {
      fetchFellows();
    }
  }, [selectedCampus]);
  
  // Filter fellows based on selected stage
  const filteredFellows = fellows.filter(fellow => {
    // Check if it matches the selected stage
    return fellow.hiring_stage === selectedStage;
  });
  
  // Unknown fellows (those with hiring_stage not in our ordered stages)
  const unknownFellows = fellows.filter(fellow => {
    return !orderedStages.includes(fellow.hiring_stage);
  });

  // Create fellow card component for reuse
  const FellowCard = ({ fellow }: { fellow: FellowData }) => (
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
            <p className="text-gray-600 text-sm">
              {fellow.campus_name || "No campus assigned"}
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
                className={`text-xs ${
                  fellow.hiring_stage === "Hired"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : fellow.hiring_stage === "Offer"
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      : fellow.hiring_stage === "Fellow"
                        ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                        : fellow.hiring_stage === "New"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          : fellow.hiring_stage === "Rejected/Declined"
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {fellow.hiring_stage}
              </Badge>
              {fellow.applied_date && (
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                >
                  Applied: {formatDate(fellow.applied_date)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Generate unknown fellows content for collapse component
  const generateUnknownFellowsContent = () => {
    if (unknownFellows.length === 0) return null;
    
    return (
      <div className="space-y-4 mt-2">
        {unknownFellows.map((fellow) => (
          <Card key={fellow.id} className="border hover:shadow-md transition-shadow border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-md flex items-center justify-center text-amber-700 text-lg font-medium">
                  {fellow.fellow_name.charAt(0)}
                </div>
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <h3 className="font-medium">{fellow.fellow_name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {fellow.grade_band || "No grade band specified"}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {fellow.campus_name || "No campus assigned"}
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
                      className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100"
                    >
                      Stage: {fellow.hiring_stage || "Unknown"}
                    </Badge>
                    {fellow.applied_date && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                      >
                        Applied: {formatDate(fellow.applied_date)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-4 mb-6">
        {/* Campus Selector Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {fetchingCampuses ? (
              <div className="min-w-[220px] p-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                <span>Loading campuses...</span>
              </div>
            ) : (
              <Select 
                value={selectedCampus} 
                onValueChange={setSelectedCampus}
                disabled={campuses.length === 0}
              >
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
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Stages Tabs - Horizontal Alignment */}
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
          <div className="grid grid-cols-5 w-full">
            {orderedStages.map((stage, index) => (
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
      
      {/* Information for debugging */}
      {!fetchingFellows && fellows.length === 0 && !error && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-md flex items-start">
          <InfoIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Debugging Information</h3>
            <p className="text-sm mt-1">No fellow records were returned from the database query. Please check:</p>
            <ul className="list-disc ml-5 text-sm mt-1">
              <li>Database connection is working properly</li>
              <li>Table 'fivetran_views.fellows' exists and has records</li>
              <li>User has permissions to query this table</li>
              <li>Check browser console for detailed logs</li>
            </ul>
          </div>
        </div>
      )}

      {/* Fellows List */}
      <div className="space-y-4">
        {!fetchingFellows && filteredFellows.length === 0 && fellows.length > 0 && (
          <p className="text-center text-gray-500 py-8">
            No fellows found in the "{selectedStage}" stage. Try selecting a different stage.
          </p>
        )}
        
        {filteredFellows.map((fellow) => (
          <FellowCard key={fellow.id} fellow={fellow} />
        ))}
      </div>
      
      {/* Unknown Fellows Section with Collapse */}
      {!fetchingFellows && unknownFellows.length > 0 && (
        <div className="mt-10">
          <Collapse
            collapsible="header"
            defaultActiveKey={['1']}
            items={[
              {
                key: '1',
                label: (
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="text-lg font-semibold">Unknown Stage Fellows ({unknownFellows.length})</span>
                  </div>
                ),
                children: generateUnknownFellowsContent(),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default CampusStaffTracker;
