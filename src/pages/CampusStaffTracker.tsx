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

// Generate mock campus data
const generateMockCampusData = (): CampusData[] => {
  return [
    { id: "all", name: "All Campuses" },
    { id: "campus-1", name: "Atlanta" },
    { id: "campus-2", name: "Miami" },
    { id: "campus-3", name: "New York" },
    { id: "campus-4", name: "Birmingham" },
    { id: "campus-5", name: "Chicago" },
  ];
};

// Generate mock fellow data
const generateMockFellowData = (selectedCampus: string): FellowData[] => {
  // Define possible fellow names
  const fellowNames = [
    "Jessica Martinez", "Michael Johnson", "Sarah Williams", "David Brown", "Emily Davis",
    "James Wilson", "Olivia Jackson", "Ethan Thomas", "Sophia Harris", "Benjamin Martin",
    "Charlotte Lee", "Alexander White", "Elizabeth Clark", "Daniel Lewis", "Ava Walker",
    "William Hall", "Mia Robinson", "Joseph Young", "Amelia King", "Andrew Scott"
  ];
  
  // Define grade bands
  const gradeBands = ["K-2", "3-5", "6-8"];
  
  // Define hiring stages
  const hiringStages = ["New", "Fellow", "Offer", "Hired", "Rejected/Declined"];
  
  // Define cohorts
  const cohorts = ["1", "2", "3"];
  
  // Create mock fellow data
  const fellows: FellowData[] = [];
  
  // Generate 20 mock fellows
  for (let i = 0; i < 20; i++) {
    // Create applied date between 1-60 days ago
    const appliedDate = new Date();
    appliedDate.setDate(appliedDate.getDate() - Math.floor(Math.random() * 60) - 1);
    
    // Assign campus
    const campusId = `campus-${Math.floor(Math.random() * 5) + 1}`;
    const campusMap: Record<string, string> = {
      "campus-1": "Atlanta",
      "campus-2": "Miami",
      "campus-3": "New York",
      "campus-4": "Birmingham",
      "campus-5": "Chicago",
    };
    
    // Create fellow
    const fellow: FellowData = {
      id: `fellow-${i}`,
      fellow_name: fellowNames[i % fellowNames.length],
      grade_band: gradeBands[Math.floor(Math.random() * gradeBands.length)],
      applied_date: appliedDate.toISOString(),
      hiring_stage: hiringStages[Math.floor(Math.random() * hiringStages.length)],
      cohort: cohorts[Math.floor(Math.random() * cohorts.length)],
      campus_id: campusId,
      campus_name: campusMap[campusId],
      status: Math.random() > 0.3 ? "active" : "inactive"
    };
    
    fellows.push(fellow);
  }
  
  // Filter by campus if specified
  if (selectedCampus && selectedCampus !== "all") {
    return fellows.filter(fellow => fellow.campus_id === selectedCampus);
  }
  
  return fellows;
};

const CampusStaffTracker: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>("all");
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

  // Fetch campuses (mock data)
  useEffect(() => {
    const fetchCampuses = async () => {
      setFetchingCampuses(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate mock campus data
        const mockCampuses = generateMockCampusData();
        setCampuses(mockCampuses);
        setSelectedCampus(mockCampuses[0].id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error("Exception fetching campuses:", err);
        setError(`Failed to load campuses: ${errorMessage}`);

        // Set default campuses as fallback
        const defaultCampuses = [
          { id: "all", name: "All Campuses" },
          { id: "campus-1", name: "Atlanta" },
          { id: "campus-2", name: "Miami" },
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

  // Fetch fellows data (mock data)
  useEffect(() => {
    const fetchFellows = async () => {
      setFetchingFellows(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate mock fellow data
        const mockFellows = generateMockFellowData(selectedCampus);
        setFellows(mockFellows);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error("Exception fetching fellows:", err);
        setError(`Failed to load fellows: ${errorMessage}`);
        setFellows([]);
      } finally {
        setFetchingFellows(false);
        setLoading(false);
      }
    };

    if (selectedCampus) {
      fetchFellows();
    }
  }, [selectedCampus]);

  // Filter fellows based on selected stage
  const filteredFellows = fellows.filter((fellow) => {
    // Check if it matches the selected stage
    return fellow.hiring_stage === selectedStage;
  });

  // Unknown fellows (those with hiring_stage not in our ordered stages)
  const unknownFellows = fellows.filter((fellow) => {
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
            <p className="text-gray-600 text-sm">{fellow.campus_name || "No campus assigned"}</p>

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
          <FellowCard key={fellow.id} fellow={fellow} />
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
      {error && <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">{error}</div>}

      {/* Loading state */}
      {fetchingFellows && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
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

      {/* Add Fellow Button */}
      <div className="mt-8 flex justify-center">
        <Button className="bg-primary text-white flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add New Fellow</span>
        </Button>
      </div>
    </div>
  );
};

export default CampusStaffTracker;