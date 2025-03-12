import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router-dom";
import SearchBox from "../components/SearchBox";
import { Table } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import {
  Search as SearchIcon,
  Users,
  Briefcase,
  Building,
  MapPin,
  Phone,
  Calendar,
  Award,
  Filter,
  X,
  User,
} from "lucide-react";
import { useFamilyData } from "@/hooks/useFamilyData";
import { FamilySearchResult, supabase, getEnhancedFamilyRecord } from "@/integrations/supabase-client";
import { EnhancedFamilyRecord, StudentOpportunity } from "@/hooks/useEnhancedFamilyData";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCampuses } from "@/hooks/useCampuses";

// Define interface for campus data returned from RPC
interface CampusData {
  id: string;
  name: string;
}

// Define search result item interface
interface SearchResultItem {
  id: string | number; // Updated to accept both string and number IDs
  type: "Family" | "Student" | "Campus";
  name: string;
  details: string;
  hasWonOpportunities?: boolean; // Flag indicating if family has won opportunities
  wonOpportunityDetails?: {
    schoolYears: string[];
    campuses: string[];
  }; // Details of won opportunities
  familyIds?: {
    // Optional object to store all family ID formats for debugging
    standard_id?: string;
    family_id?: string;
    alternate_id?: string;
  };
}

// Define mock results interface
interface MockResultsData {
  all: SearchResultItem[];
  families: SearchResultItem[];
  students: SearchResultItem[];
  campuses: SearchResultItem[];
  [key: string]: SearchResultItem[];
}

// Helper function to get appropriate CSS classes for school year badges
const getSchoolYearClasses = (year: string): string => {
  switch (year) {
    case "23/24":
      return "bg-orange-100 text-orange-800";
    case "24/25":
      return "bg-green-100 text-green-800";
    case "25/26":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-purple-100 text-purple-800";
  }
};

// Define ant design table types
interface DataType {
  key: React.Key;
  id: string;
  name: string;
  campus: string;
  stage: string;
  grade?: string;
  school_year?: string;
  student_name?: string;
  familyIds?: {
    standard_id?: string;
    family_id?: string;
    alternate_id?: string;
  };
}

/**
 * Search page component
 * Provides functionality to search across different data entities
 */
const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [campusMap, setCampusMap] = useState<Record<string, string>>({});

  // Filter states
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [selectedOpportunityStatus, setSelectedOpportunityStatus] = useState<string>("");
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Get campus data
  const { data: campuses = [], isLoading: isLoadingCampuses } = useCampuses();

  // School year options
  const schoolYearOptions = ["23/24", "24/25", "25/26"];

  // Opportunity status options
  const opportunityStatusOptions = [
    { value: "active", label: "Active Families" },
    { value: "all", label: "All Families" },
  ];

  // Use our custom hook for family data operations
  const {
    loading: isSearching,
    error: searchError,
    searchResults: familySearchResults,
    searchFamilies,
  } = useFamilyData();

  // Toggle filters visibility
  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCampus("");
    setSelectedSchoolYear("");
    setSelectedOpportunityStatus("");
  };

  // Handle search query submission
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchFamilies(query);
  };

  // Transform family search results to match our SearchResultItem interface
  const searchResults = useMemo(() => {
    // Apply filters to the search results
    return (familySearchResults || [])
      .filter((family) => {
        if (!family) return false;

        // Campus filter
        if (selectedCampus && family.current_campus_c) {
          const campusName = campusMap?.[family.current_campus_c] || "Unknown Campus";
          if (campusName !== selectedCampus) return false;
        }

        // School year filter
        if (selectedSchoolYear && Array.isArray(family.opportunity_school_years)) {
          if (!family.opportunity_school_years.includes(selectedSchoolYear)) return false;
        }

        // Opportunity status filter
        if (selectedOpportunityStatus === "active") {
          // Check if family has at least one won opportunity for the 25/26 school year
          if (!family.opportunity_is_won_flags || !family.opportunity_school_years) {
            return false;
          }

          // Check for at least one opportunity that is won AND for school year 25/26
          const hasActiveOpportunity = family.opportunity_is_won_flags.some((isWon, index) => {
            return isWon === true && family.opportunity_school_years[index] === "25/26";
          });

          if (!hasActiveOpportunity) {
            return false;
          }
        }

        return true;
      })
      .map((family) => {
        // Log the available IDs for debugging
        const standardId = family.standard_id || "";
        const familyId = family.family_id || "";
        const alternateId = family.alternate_id || "";

        console.log("Family search result with IDs:", {
          standard_id: standardId,
          family_id: familyId,
          alternate_id: alternateId,
        });

        // Find the indices of active opportunities (won AND in 25/26 school year)
        const activeOpportunityIndices: number[] = [];
        if (
          Array.isArray(family.opportunity_is_won_flags) &&
          Array.isArray(family.opportunity_school_years)
        ) {
          family.opportunity_is_won_flags.forEach((isWon, index) => {
            // Check both conditions: is_won = true AND school_year = '25/26'
            if (isWon === true && family.opportunity_school_years[index] === "25/26") {
              activeOpportunityIndices.push(index);
            }
          });
        }

        // Get details of active opportunities
        const activeSchoolYears: string[] = [];
        const activeCampuses: string[] = [];

        activeOpportunityIndices.forEach((index) => {
          if (
            Array.isArray(family.opportunity_school_years) &&
            family.opportunity_school_years[index]
          ) {
            activeSchoolYears.push(family.opportunity_school_years[index]);
          }
          if (Array.isArray(family.opportunity_campuses) && family.opportunity_campuses[index]) {
            activeCampuses.push(family.opportunity_campuses[index]);
          }
        });

        // Get campus name from campus map, but don't display raw IDs even if name not found
        const campusId = family.current_campus_c || "";
        // Instead of showing the ID, just show 'Unknown Campus' if mapping not found
        const campusName = campusId ? campusMap[campusId] || "Unknown Campus" : "None";

        return {
          // Use the standardized ID as our primary ID for consistent navigation
          id: standardId || familyId || alternateId,
          // Store all IDs for debugging and fallback
          familyIds: {
            standard_id: standardId,
            family_id: familyId,
            alternate_id: alternateId,
          },
          type: "Family" as const,
          name: family.family_name || "Unnamed Family",
          details: `Campus: ${campusName}`,
          hasWonOpportunities: activeOpportunityIndices.length > 0,
          wonOpportunityDetails:
            activeOpportunityIndices.length > 0
              ? {
                  schoolYears: activeSchoolYears,
                  campuses: activeCampuses,
                }
              : undefined,
        };
      });
  }, [
    familySearchResults,
    campusMap,
    selectedCampus,
    selectedSchoolYear,
    selectedOpportunityStatus,
  ]);

  // Mock search results for demonstration using useMemo to avoid re-creation on each render
  const mockResults = useMemo<MockResultsData>(
    () => ({
      all: [
        {
          id: 1,
          type: "Family",
          name: "Smith Family",
          details: "Parents: John & Jane Smith",
        },
        {
          id: 2,
          type: "Student",
          name: "Emily Johnson",
          details: "Grade: 10, Campus: Main",
        },
        {
          id: 3,
          type: "Campus",
          name: "Downtown Campus",
          details: "120 Students Enrolled",
        },
      ],
      families: [
        {
          id: 1,
          type: "Family",
          name: "Smith Family",
          details: "Parents: John & Jane Smith",
        },
        {
          id: 4,
          type: "Family",
          name: "Williams Family",
          details: "Parents: Robert & Sarah Williams",
        },
      ],
      students: [
        {
          id: 2,
          type: "Student",
          name: "Emily Johnson",
          details: "Grade: 10, Campus: Main",
        },
        {
          id: 5,
          type: "Student",
          name: "Michael Brown",
          details: "Grade: 8, Campus: North",
        },
      ],
      campuses: [
        {
          id: 3,
          type: "Campus",
          name: "Downtown Campus",
          details: "120 Students Enrolled",
        },
        {
          id: 6,
          type: "Campus",
          name: "Westside Campus",
          details: "85 Students Enrolled",
        },
      ],
    }),
    []
  );

  // Call the search API when the search query changes
  useEffect(() => {
    // Only search if there's a query
    if (searchQuery) {
      searchFamilies(searchQuery);
    }
  }, [searchQuery, searchFamilies]);

  // Fetch campus data to populate the campus mapping object
  useEffect(() => {
    const fetchCampusData = async () => {
      try {
        if (campuses && campuses.length > 0) {
          const campusMapping: Record<string, string> = {};

          campuses.forEach((campus) => {
            if (campus.campus_id && campus.campus_name) {
              campusMapping[campus.campus_id] = campus.campus_name;
            }
          });
          setCampusMap(campusMapping);
          console.log("Campus mapping loaded:", Object.keys(campusMapping).length, "campuses");
        }
      } catch (error) {
        console.error("Failed to fetch campus data:", error);
      }
    };

    fetchCampusData();
  }, [campuses]);

  // We don't need a keyboard shortcut handler here
  // The global 'k' handler in App.tsx will trigger the hover search

  const handleResultClick = (result: SearchResultItem) => {
    // With the new buttons, card click should default to the standard view
    // But let's keep the code clean with proper type handling

    // Log detailed information to help diagnose any ID format issues
    console.log("Result card clicked:", {
      id: result.id,
      allIds: result.familyIds,
      name: result.name,
      details: result.details,
    });

    if (!result.id) {
      console.error("Cannot navigate - missing family ID", result);
      alert("Error: Could not find a valid ID for this family");
      return;
    }

    // Extract the most reliable ID to use for navigation
    const bestId =
      result.familyIds?.standard_id ||
      result.familyIds?.family_id ||
      result.familyIds?.alternate_id ||
      result.id;

    console.log(`Search: Navigating to family detail with best ID: ${bestId}`);

    // Navigate based on result type
    switch (result.type) {
      case "Family":
        // Navigate to the family detail page with the best available ID
        navigate(`/family-detail/${bestId}`);
        break;
      case "Student":
        // Replace with actual student profile route when available
        navigate(`/student/${result.id}`);
        break;
      case "Campus":
        // Replace with actual campus detail route when available
        navigate(`/campus/${result.id}`);
        break;
      default:
        break;
    }
  };

  // Define our available campus options for filtering
  const campusOptions = useMemo(() => {
    return campuses?.map(campus => campus.campus_name) || [];
  }, [campuses]);
  
  // Define stage options for filtering
  const stageOptions = ["Application", "Interviewed", "Offered", "Enrolled", "Declined"];

  // State for opportunities table data
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);

  // Fetch opportunities directly from fivetran_views.opportunity
  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoadingOpportunities(true);
      
      try {
        // Direct SQL query to get the first 10 opportunities with required fields
        const query = `
          SELECT 
            o.id, 
            o.name, 
            o.stage_name as stage, 
            coalesce(o.grade_c, 'K-8') as grade,
            o.student_first_name_c || ' ' || o.student_last_name_c as student_name,
            o.school_year_c as school_year,
            cc.name as campus_name,
            a.name as account_name,
            a.id as account_id
          FROM 
            fivetran_views.opportunity o
          LEFT JOIN 
            fivetran_views.campus_c cc ON o.campus_c = cc.id
          LEFT JOIN
            fivetran_views.account a ON o.account_id = a.id
          WHERE 
            o.is_deleted = false
          ORDER BY 
            o.created_date DESC
          LIMIT 10
        `;
        
        console.log("Executing opportunity query:", query);
        
        // Execute the query using the regular client
        const { data, error } = await supabase.regular.rpc("execute_sql_query", {
          query_text: query
        });
        
        if (error) {
          console.error("Error fetching opportunities:", error);
          setTableData([]);
          return;
        }
        
        console.log("Opportunity data result:", data);
        
        // Process the data based on its structure
        let opportunityData = [];
        if (Array.isArray(data)) {
          opportunityData = data;
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.rows)) {
            opportunityData = data.rows;
          } else if (data.result && Array.isArray(data.result)) {
            opportunityData = data.result;
          } else {
            // Try to find any array in the response
            for (const key in data) {
              if (Array.isArray(data[key])) {
                opportunityData = data[key];
                break;
              }
            }
          }
        }
        
        console.log("Processed opportunity data:", opportunityData);
        
        // Map to DataType format
        const mappedData = opportunityData.map((opp, index) => ({
          key: index.toString(),
          id: opp.id || "",
          name: opp.name || "Unnamed Opportunity",
          student_name: opp.student_name || "",
          stage: opp.stage || "Unknown",
          grade: opp.grade || "K-8",
          school_year: opp.school_year || "",
          campus: opp.campus_name || "Unknown Campus",
          familyIds: {
            family_id: opp.account_id || "",
          }
        }));
        
        console.log("Mapped table data:", mappedData);
        setTableData(mappedData);
      } catch (err) {
        console.error("Failed to fetch opportunities:", err);
        setTableData([]);
      } finally {
        setLoadingOpportunities(false);
      }
    };
    
    // Load opportunities on component mount
    fetchOpportunities();
  }, []);

  // Handle row click to navigate to family detail
  const handleRowClick = (record: DataType) => {
    if (!record.id) {
      console.error("Cannot navigate - missing family ID", record);
      return;
    }
    
    // Log for debugging
    console.log(`Table: Navigating to family detail with ID: ${record.id}`);
    
    // Navigate to the family detail page
    navigate(`/family-detail/${record.id}`);
  };

  // Table column definitions with the required fields
  const tableColumns: TableColumnsType<DataType> = [
    {
      title: 'Opportunity Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Student',
      dataIndex: 'student_name',
      key: 'student_name',
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
    },
    {
      title: 'School Year',
      dataIndex: 'school_year',
      key: 'school_year',
    },
    {
      title: 'Campus',
      dataIndex: 'campus',
      key: 'campus',
    }
  ];

  // Table is now fixed with the required columns

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-outer-space">Search</h1>
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg shadow-sm text-slate-600">
            <SearchIcon className="h-4 w-4 text-slate-400" />
            <span>Press</span>
            <kbd className="px-2 py-0.5 bg-gray-50 border border-slate-200 rounded text-xs font-mono">k</kbd>
            <span>to search families</span>
          </div>
        </div>

        {/* Only the hover state SearchBox Component is used from App.tsx */}
        
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4"></div>

        {/* Opportunity Table Component */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-slate-gray" />
            <span className="text-xl font-semibold text-outer-space">Opportunities</span>
          </div>
          {loadingOpportunities ? (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-slate-gray">Loading opportunities...</p>
            </div>
          ) : tableData.length > 0 ? (
            <Table 
              columns={tableColumns} 
              dataSource={tableData} 
              pagination={{ pageSize: 5 }}
              bordered
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
            />
          ) : (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-slate-gray">No opportunity records available</p>
              <p className="text-slate-400 text-sm mt-1">
                Press <kbd className="px-1 py-0.5 rounded border shadow-sm text-xs">k</kbd> to search for a family
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
