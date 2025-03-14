import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SearchBox from "../components/SearchBox";
import { Table, Select, Button } from "antd";
import type { TableColumnsType } from "antd";
import { Search as SearchIcon, Building, Filter, X } from "lucide-react";
import { supabase } from "../integrations/supabase-client";

// Define interface for campus data returned from RPC
interface CampusData {
  id: string;
  campus_name: string;
}

// Define interface for table data
interface DataType {
  key: string;
  id: string;
  name: string;
  student_name: string;
  stage: string;
  grade: string;
  school_year: string;
  campus: string;
  tuition: number | null;
  familyIds: {
    family_id: string;
  };
  account_id: string;
  account_name: string;
}

// Define interface for search result
interface SearchResult {
  id: string;
  name: string;
  type: string;
  campus?: string;
  grade?: string;
  stage?: string;
  school_year?: string;
  family_id?: string;
  student_id?: string;
  opportunity_id?: string;
  campus_id?: string;
}

const Search = () => {
  const navigate = useNavigate();
  const [campusMap, setCampusMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [campuses, setCampuses] = useState<CampusData[]>([]);
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [selectedOpportunityStatus, setSelectedOpportunityStatus] = useState<string>("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [familySearchResults, setFamilySearchResults] = useState<any[]>([]);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [campusFilter, setCampusFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [availableCampuses, setAvailableCampuses] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  const schoolYearOptions = ["23/24", "24/25", "25/26"];
  const opportunityStatusOptions = [
    { value: "active", label: "Active Families" },
    { value: "all", label: "All Families" },
  ];
  const stageOptions = ["Application", "Interviewed", "Offered", "Enrolled", "Declined"];

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const resetFamilyFilters = () => {
    setSelectedCampus("");
    setSelectedSchoolYear("");
    setSelectedOpportunityStatus("");
  };

  const searchFamilies = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.searchFamilies(query);
      if (error) {
        setSearchError(error);
        setFamilySearchResults([]);
      } else if (data) {
        setFamilySearchResults(data);
        setSearchError(null);
      }
    } catch (err) {
      console.error("Error searching families:", err);
      setSearchError("An unexpected error occurred");
      setFamilySearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchCampuses = async () => {
      setIsLoadingCampuses(true);
      try {
        const { data, error } = await supabase.regular.rpc("execute_sql_query", {
          query_text: `
            SELECT id, name as campus_name
            FROM fivetran_views.campus_c
            ORDER BY name
          `,
        });

        if (error) {
          console.error("Error fetching campuses:", error);
        } else if (data && Array.isArray(data)) {
          setCampuses(data);

          // Create a map of campus IDs to names for easy lookup
          const campusMapData: Record<string, string> = {};
          data.forEach((campus) => {
            campusMapData[campus.id] = campus.campus_name;
          });
          setCampusMap(campusMapData);
        }
      } catch (err) {
        console.error("Failed to fetch campuses:", err);
      } finally {
        setIsLoadingCampuses(false);
      }
    };

    fetchCampuses();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 3) {
      searchFamilies(query);
    } else {
      setFamilySearchResults([]);
    }
  };

  const handleSearchResultSelect = (result: SearchResult) => {
    console.log("Selected search result:", result);

    // Determine the best ID to use for navigation
    const bestId = result.family_id || result.id;

    // Navigate based on the result type
    switch (result.type) {
      case "Family":
        // Navigate to the mock family detail page with the best available ID
        navigate(`/family-mock/${bestId}`);
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

  const campusOptions = useMemo(() => {
    return campuses?.map((campus) => campus.campus_name) || [];
  }, [campuses]);

  const resetFilters = () => {
    setCampusFilter(null);
    setStageFilter(null);
    setGradeFilter(null);
  };

  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoadingOpportunities(true);

      try {
        // Build WHERE clause with filters
        let whereClause = "o.is_deleted = false AND o.school_year_c = '25/26'";

        if (campusFilter) {
          whereClause += ` AND cc.name = '${campusFilter}'`;
        }

        if (stageFilter) {
          whereClause += ` AND o.stage_name = '${stageFilter}'`;
        }

        if (gradeFilter) {
          whereClause += ` AND o.grade_c = '${gradeFilter}'`;
        }

        // Direct SQL query to get the opportunities with required fields and filters
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
            a.id as account_id,
            o.tuition_c as tuition
          FROM 
            fivetran_views.opportunity o
          LEFT JOIN 
            fivetran_views.campus_c cc ON o.campus_c = cc.id
          LEFT JOIN
            fivetran_views.account a ON o.account_id = a.id
          WHERE 
            ${whereClause}
          ORDER BY 
            o.created_date DESC
          LIMIT 100
        `;

        console.log("Executing opportunity query:", query);

        // Execute the query using the regular client
        const { data, error } = await supabase.regular.rpc("execute_sql_query", {
          query_text: query,
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
        } else if (data && typeof data === "object") {
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
          tuition: typeof opp.tuition === "number" ? opp.tuition : 0,
          account_id: opp.account_id || "",
          account_name: opp.account_name || "",
          familyIds: {
            family_id: opp.account_id || "",
          },
        }));

        console.log("Mapped table data:", mappedData);
        setTableData(mappedData);

        // Extract unique stages and campuses for filters
        const uniqueCampuses = Array.from(
          new Set(opportunityData.map((item) => item.campus_name).filter(Boolean))
        );
        setAvailableCampuses(uniqueCampuses);

        const uniqueStages = Array.from(
          new Set(opportunityData.map((item) => item.stage).filter(Boolean))
        );
        setAvailableStages(uniqueStages);

        const uniqueGrades = Array.from(
          new Set(opportunityData.map((item) => item.grade).filter(Boolean))
        );
        setAvailableGrades(uniqueGrades);
      } catch (err) {
        console.error("Failed to fetch opportunities:", err);
        setTableData([]);
      } finally {
        setLoadingOpportunities(false);
      }
    };

    // Load opportunities on component mount
    fetchOpportunities();
  }, [campusFilter, stageFilter, gradeFilter]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Query to get distinct campuses
        const campusesQuery = `
          SELECT DISTINCT cc.name
          FROM fivetran_views.opportunity o
          JOIN fivetran_views.campus_c cc ON o.campus_c = cc.id
          WHERE cc.name IS NOT NULL
          ORDER BY cc.name
        `;

        // Query to get distinct stages
        const stagesQuery = `
          SELECT DISTINCT stage_name
          FROM fivetran_views.opportunity
          WHERE stage_name IS NOT NULL
          ORDER BY stage_name
        `;

        // Query to get distinct grades
        const gradesQuery = `
          SELECT DISTINCT grade_c
          FROM fivetran_views.opportunity
          WHERE grade_c IS NOT NULL
          ORDER BY grade_c
        `;

        // Execute all queries
        const [campusesResult, stagesResult, gradesResult] = await Promise.all([
          supabase.regular.rpc("execute_sql_query", { query_text: campusesQuery }),
          supabase.regular.rpc("execute_sql_query", { query_text: stagesQuery }),
          supabase.regular.rpc("execute_sql_query", { query_text: gradesQuery }),
        ]);

        // Process campuses
        if (campusesResult.data && Array.isArray(campusesResult.data)) {
          const campuses = campusesResult.data.map((row) => row.name).filter(Boolean);
          setAvailableCampuses(campuses);
        }

        // Process stages
        if (stagesResult.data && Array.isArray(stagesResult.data)) {
          const stages = stagesResult.data.map((row) => row.stage_name).filter(Boolean);
          setAvailableStages(stages);
        }

        // Process grades
        if (gradesResult.data && Array.isArray(gradesResult.data)) {
          const grades = gradesResult.data.map((row) => row.grade_c).filter(Boolean);
          setAvailableGrades(grades);
        }
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleRowClick = (record: DataType) => {
    if (!record.account_id) {
      console.error("Cannot navigate - missing family ID", record);
      return;
    }

    // Log for debugging
    console.log(`Table: Navigating to mock family detail with ID: ${record.account_id}`);

    // Navigate to the mock family detail page using the account_id (family ID)
    navigate(`/family-mock/${record.account_id}`);
  };

  const tableColumns: TableColumnsType<DataType> = [
    {
      title: "Opportunity",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Campus",
      dataIndex: "campus",
      key: "campus",
    },
    {
      title: "Student",
      dataIndex: "student_name",
      key: "student_name",
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      render: (stage) => {
        // Define badge colors based on stage
        let badgeColor = "";

        if (stage === "Closed Won") {
          badgeColor = "bg-green-100 text-green-800 border-green-200";
        } else if (
          [
            "Awaiting Documents",
            "Family Interview",
            "Admission Offered",
            "Education Review",
            "Preparing Offer",
          ].includes(stage)
        ) {
          badgeColor = "bg-orange-100 text-orange-800 border-orange-200";
        } else if (stage === "Closed Lost") {
          badgeColor = "bg-red-100 text-red-800 border-red-200";
        } else {
          badgeColor = "bg-gray-100 text-gray-800 border-gray-200";
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}
          >
            {stage}
          </span>
        );
      },
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
    },
    {
      title: "Tuition",
      dataIndex: "tuition",
      key: "tuition",
      render: (value) => {
        // Ensure value is a number before formatting
        const numValue = typeof value === "number" ? value : 0;
        return `$${numValue.toLocaleString()}`;
      },
    },
    {
      title: "Family Profile",
      key: "family_profile",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click from triggering
            navigate(`/family-mock/${record.account_id}`);
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          View Family
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-outer-space">Search</h1>
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg shadow-sm text-slate-600">
            <SearchIcon className="h-4 w-4 text-slate-400" />
            <span>Press</span>
            <kbd className="px-2 py-0.5 bg-gray-50 border border-slate-200 rounded text-xs font-mono">
              k
            </kbd>
            <span>to search families</span>
          </div>
        </div>

        {/* Only the hover state SearchBox Component is used from App.tsx */}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4"></div>

        {/* Opportunity Table Component */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 mb-6">
          <h2 className="text-2xl font-semibold text-outer-space mb-4">25/26 Opportunities</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
              <Select
                placeholder="Select campus"
                style={{ width: 200 }}
                allowClear
                value={campusFilter}
                onChange={(value) => setCampusFilter(value)}
                options={availableCampuses.map((campus) => ({ label: campus, value: campus }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <Select
                placeholder="Select stage"
                style={{ width: 200 }}
                allowClear
                value={stageFilter}
                onChange={(value) => setStageFilter(value)}
                options={availableStages.map((stage) => ({ label: stage, value: stage }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <Select
                placeholder="Select grade"
                style={{ width: 200 }}
                allowClear
                value={gradeFilter}
                onChange={(value) => setGradeFilter(value)}
                options={availableGrades.map((grade) => ({ label: grade, value: grade }))}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={resetFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4">
            <span className="text-sm text-gray-600">
              {loadingOpportunities
                ? "Loading..."
                : `Showing ${tableData.length} opportunities for 25/26 school year`}
              {campusFilter && ` at ${campusFilter}`}
              {stageFilter && ` in ${stageFilter} stage`}
              {gradeFilter && ` for grade ${gradeFilter}`}
            </span>
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
              pagination={{ pageSize: 10 }}
              bordered
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: "pointer" },
              })}
            />
          ) : (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-slate-gray">No opportunity records available</p>
              <p className="text-slate-400 text-sm mt-1">
                Press <kbd className="px-1 py-0.5 rounded border shadow-sm text-xs">k</kbd> to
                search for a family
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
