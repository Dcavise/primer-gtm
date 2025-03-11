import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router-dom";
import SearchBox from "../components/SearchBox";
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
} from "lucide-react";
import { useFamilyData } from "@/hooks/useFamilyData";
import { FamilySearchResult, supabase } from "@/integrations/supabase-client";
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

/**
 * Search page component
 * Provides functionality to search across different data entities
 */
const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  // Removed tabs functionality to focus solely on family search
  // Removed search box toggle since it's now always visible
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
          name: "North Campus",
          details: "85 Students Enrolled",
        },
      ],
    }),
    []
  );

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      setSearchQuery(query);

      // Always search for families
      await searchFamilies(query);
    },
    [searchFamilies]
  );

  // Effect to perform search when search query changes from SearchBox
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  }, [searchQuery, handleSearch]);

  // Fetch campus data from fivetran_views.campus_c
  useEffect(() => {
    const fetchCampusData = async () => {
      try {
        // Use the RPC function to access the fivetran_views schema
        // Call the function directly without schema qualification as per user memories
        const { data, error } = await supabase.rpc("query_campus_data");

        if (error) {
          console.error("Error fetching campus data:", error);
          return;
        }

        if (data && Array.isArray(data)) {
          // Create a map of campus IDs to campus names
          const campusMapping: Record<string, string> = {};
          // With the new function, data is now a simpler array of objects with id and name
          (data as CampusData[]).forEach((campus) => {
            if (campus && campus.id && campus.name) {
              campusMapping[campus.id] = campus.name;
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
  }, []);

  // Removed tab-change effect as we now only focus on family search

  // Removed keyboard shortcut listener since search is now always visible

  // Removed tab change handler as we now only focus on family search

  const handleResultClick = (result: SearchResultItem) => {
    // Navigate based on result type
    switch (result.type) {
      case "Family":
        // Using the new comprehensive family detail page with the standardized ID
        // Log detailed information to help diagnose any ID format issues
        console.log("Navigating to family detail with:", {
          id: result.id,
          allIds: result.familyIds,
        });

        if (!result.id) {
          console.error("Cannot navigate - missing family ID", result);
          alert("Error: Could not find a valid ID for this family");
          return;
        }

        navigate(`/family-detail/${result.id}`);
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-outer-space">Search</h1>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-slate-gray" />
              <span className="text-xl font-semibold text-outer-space">Find Families</span>
            </div>
          </div>

          {/* Inline SearchBox Component */}
          <SearchBox
            isOpen={true}
            onClose={() => {}}
            onSearch={setSearchQuery}
            initialQuery={searchQuery}
            inline={true}
            hideResults={true}
          />

          {/* Filters section */}
          {filtersVisible && (
            <div className="p-4 border rounded-md bg-gray-50 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-outer-space">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-sm text-slate-gray hover:text-red-600"
                >
                  Reset
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Campus filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-gray">Campus</label>
                  <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Campuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Campuses</SelectItem>
                      {campuses?.map((campus) => (
                        <SelectItem key={campus.campus_id} value={campus.campus_name}>
                          {campus.campus_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* School Year filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-gray">School Year</label>
                  <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All School Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All School Years</SelectItem>
                      {schoolYearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opportunity Status filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-gray">Opportunity Status</label>
                  <Select
                    value={selectedOpportunityStatus}
                    onValueChange={setSelectedOpportunityStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {opportunityStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters display */}
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCampus && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" /> Campus: {selectedCampus}
                    <button className="ml-1" onClick={() => setSelectedCampus("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedSchoolYear && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${getSchoolYearClasses(selectedSchoolYear)}`}
                  >
                    <Calendar className="h-3 w-3" /> School Year: {selectedSchoolYear}
                    <button
                      className="ml-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedSchoolYear("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedOpportunityStatus && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 flex items-center gap-1"
                  >
                    {selectedOpportunityStatus === "active" ? (
                      <>
                        <Award className="h-3 w-3" /> Active Families Only
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3" /> All Families
                      </>
                    )}
                    <button className="ml-1" onClick={() => setSelectedOpportunityStatus("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {searchQuery.trim() && (
          <div className="grid gap-4">
            {isSearching ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-outer-space"></div>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => (
                <Card
                  key={result.id}
                  className={`p-4 bg-white hover:shadow-lg cursor-pointer transition-all duration-200 border border-gray-100 rounded-lg ${result.hasWonOpportunities ? "border-l-4 border-l-green-500" : ""} mb-2 shadow-sm`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {result.type === "Family" ? (
                        <div className="bg-blue-100 p-3 rounded-full shadow-sm">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                      ) : result.type === "Student" ? (
                        <div className="bg-green-100 p-3 rounded-full shadow-sm">
                          <Briefcase className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="bg-purple-100 p-3 rounded-full shadow-sm">
                          <Building className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {/* Campus badge row */}
                      <div className="flex items-center mb-1">
                        {result.hasWonOpportunities && (
                          <Badge
                            variant="outline"
                            className="mr-2 px-3 py-1 bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1"
                          >
                            <Award className="h-3 w-3" /> Active
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />{" "}
                          {result.details.replace("Campus:", "").trim()}
                        </Badge>
                      </div>

                      {/* Enhanced household name - increased size and weight */}
                      <h3 className="text-2xl font-semibold text-outer-space">{result.name}</h3>

                      {/* Removed the School Year Information section as requested */}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start mt-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      View
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-gray">No results found for "{searchQuery}"</p>
                <p className="text-sm text-slate-gray mt-1">
                  Try a different search term or category
                </p>
                {searchError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-600 text-sm">
                    Error: {searchError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
