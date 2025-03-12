import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router-dom";
import SearchBox from "../components/SearchBox";
import { Checkbox, Divider, Table } from "antd";
import type { CheckboxOptionType, TableColumnsType } from "antd";
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

// Define ant design table types
interface DataType {
  key: React.Key;
  name: string;
  age: number;
  address: string;
}

/**
 * Search page component
 * Provides functionality to search across different data entities
 */
const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchBoxOpen, setIsSearchBoxOpen] = useState(false);
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

  // Handle search box open
  const handleOpenSearchBox = () => {
    setIsSearchBoxOpen(true);
  };

  // Handle search box close
  const handleCloseSearchBox = () => {
    setIsSearchBoxOpen(false);
  };

  // Handle search query submission
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearchBoxOpen(false);
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

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Control+K or Command+K (macOS)
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchBoxOpen(true);
      }
      
      // Check for Escape key to close search
      if (event.key === "Escape" && isSearchBoxOpen) {
        event.preventDefault();
        setIsSearchBoxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchBoxOpen]);

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

  // Ant Design Table setup
  const tableColumns: TableColumnsType<DataType> = [
    { title: 'Column 1', dataIndex: 'address', key: '1' },
    { title: 'Column 2', dataIndex: 'address', key: '2' },
    { title: 'Column 3', dataIndex: 'address', key: '3' },
    { title: 'Column 4', dataIndex: 'address', key: '4' },
    { title: 'Column 5', dataIndex: 'address', key: '5' },
    { title: 'Column 6', dataIndex: 'address', key: '6' },
    { title: 'Column 7', dataIndex: 'address', key: '7' },
    { title: 'Column 8', dataIndex: 'address', key: '8' },
  ];

  const tableData: DataType[] = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 40,
      address: 'London Park',
    },
  ];

  const defaultCheckedList = tableColumns.map((item) => item.key);
  const [checkedList, setCheckedList] = useState(defaultCheckedList);

  const options = tableColumns.map(({ key, title }) => ({
    label: title,
    value: key,
  }));

  const newColumns = tableColumns.map((item) => ({
    ...item,
    hidden: !checkedList.includes(item.key as string),
  }));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-outer-space">Search</h1>
          <Button 
            onClick={handleOpenSearchBox} 
            variant="outline" 
            className="flex items-center gap-2 border border-slate-200 rounded-lg shadow-sm"
          >
            <SearchIcon className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">Search families...</span>
            <span className="ml-2 text-xs text-slate-400 border border-slate-200 rounded px-1">
              ⌘K
            </span>
          </Button>
        </div>

        {/* Hovering SearchBox Component */}
        <SearchBox
          isOpen={isSearchBoxOpen}
          onClose={handleCloseSearchBox}
          onSearch={handleSearch}
          initialQuery={searchQuery}
          inline={false}
          hideResults={false}
        />
        
        {/* Ant Design Table Component */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-slate-gray" />
            <span className="text-xl font-semibold text-outer-space">Table Example</span>
          </div>
          <Divider>Columns displayed</Divider>
          <Checkbox.Group
            value={checkedList}
            options={options as CheckboxOptionType[]}
            onChange={(value) => {
              setCheckedList(value as string[]);
            }}
          />
          <Table<DataType> columns={newColumns} dataSource={tableData} style={{ marginTop: 24 }} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-gray" />
              <span className="text-xl font-semibold text-outer-space">Families</span>
              {searchQuery && (
                <span className="text-sm text-slate-500 ml-2">
                  Results for "{searchQuery}"
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFilters}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                {filtersVisible ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </div>

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
                    <button
                      className="ml-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedOpportunityStatus("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Search results */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            {isSearching ? (
              // Loading state
              <div className="flex flex-col items-center justify-center py-8 text-slate-gray">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <p>Searching families...</p>
              </div>
            ) : searchResults.length > 0 ? (
              // Results found
              searchResults.map((result) => (
                <Card
                  key={result.id.toString()}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200 border-slate-200 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 border-l-4 border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 text-blue-800 rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                        {result.type === "Family" ? (
                          <Users className="h-5 w-5" />
                        ) : result.type === "Student" ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Building className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-outer-space">{result.name}</h3>
                          {result.hasWonOpportunities && (
                            <Badge color="green" text="Active" className="font-medium" />
                          )}
                          {/* If we want to add the "Open" badge here, we'd need additional logic */}
                        </div>
                        <p className="text-sm text-slate-gray mt-1">{result.details}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => handleResultClick(result)}
                    >
                      View Family
                    </Button>
                  </div>
                </Card>
              ))
            ) : searchQuery ? (
              // No results found
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-slate-gray">No families found matching "{searchQuery}"</p>
                <p className="text-slate-400 text-sm mt-1">
                  Try a different search term or reset filters
                </p>
              </div>
            ) : (
              // No search performed yet
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-slate-gray">
                  Use the search bar at the top to find families
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  or press <kbd className="px-1 py-0.5 rounded border shadow-sm text-xs">⌘K</kbd> to search
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
