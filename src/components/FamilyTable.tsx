import React, { useState, useEffect, useMemo } from "react";
import { Table } from "antd";
import type { TableColumnsType } from "antd";
import { Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase-client";
import { useCampuses } from "@/hooks/useCampuses";

// Define data type for table rows
export interface FamilyTableData {
  key: React.Key;
  id: string;
  name: string;
  campus: string;
  stage: string;
  familyIds?: {
    standard_id?: string;
    family_id?: string;
    alternate_id?: string;
  };
}

/**
 * FamilyTable component
 * Standalone table component for displaying family records
 */
const FamilyTable: React.FC = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState<FamilyTableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campusMap, setCampusMap] = useState<Record<string, string>>({});

  // Get campus data
  const { data: campuses = [], isLoading: isLoadingCampuses } = useCampuses();

  // Define stage options for filtering
  const stageOptions = ["Application", "Interviewed", "Offered", "Enrolled", "Declined"];

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

  // Fetch family data
  useEffect(() => {
    const fetchFamilyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch families using getAllFamilies first
        let result = await supabase.getAllFamilies();

        // If that fails, fall back to using searchFamilies with an empty string
        // which should return all families or at least a subset
        if (!result.success || !result.data || result.data.length === 0) {
          console.log("getAllFamilies failed or returned no data, falling back to searchFamilies");
          result = await supabase.searchFamilies("");
        }

        if (result.success && result.data) {
          // Process the data for the table
          const processedData = result.data.map((family, index) => {
            // Extract IDs for consistent navigation
            const standardId = family.standard_id || "";
            const familyId = family.family_id || "";
            const alternateId = family.alternate_id || "";
            const bestId = standardId || familyId || alternateId;

            // Get campus name from campus map, don't display raw IDs
            const campusId = family.current_campus_c || "";
            const campusName = campusId ? campusMap[campusId] || "Unknown Campus" : "None";

            // Try to determine stage - this is an example, adjust based on your data structure
            let stage = "Unknown";
            if (family.opportunity_stages && family.opportunity_stages.length > 0) {
              // Use the most recent stage if multiple exist
              stage = family.opportunity_stages[0] || "Unknown";
            }

            return {
              key: index.toString(),
              id: bestId,
              name: family.family_name || "Unnamed Family",
              campus: campusName,
              stage: stage,
              familyIds: {
                standard_id: standardId,
                family_id: familyId,
                alternate_id: alternateId,
              },
            };
          });

          setTableData(processedData);
        } else {
          setError(result.error || "Failed to fetch family data");
          console.error("Error fetching family data:", result.error);
        }
      } catch (err) {
        setError("An error occurred while fetching family data");
        console.error("Exception fetching family data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, [campusMap]);

  // Handle row click to navigate to family detail
  const handleRowClick = (record: FamilyTableData) => {
    if (!record.id) {
      console.error("Cannot navigate - missing family ID", record);
      return;
    }

    // Log for debugging
    console.log(`Table: Navigating to family detail with ID: ${record.id}`);

    // Navigate to the family detail page
    navigate(`/family-detail/${record.id}`);
  };

  // Define our available campus options for filtering
  const campusOptions = useMemo(() => {
    return campuses?.map((campus) => campus.campus_name) || [];
  }, [campuses]);

  // Table column definitions with filters
  const tableColumns: TableColumnsType<FamilyTableData> = [
    {
      title: "Family Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Campus",
      dataIndex: "campus",
      key: "campus",
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Building className="h-5 w-5 text-slate-gray" />
        <span className="text-xl font-semibold text-outer-space">Family Records</span>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-slate-gray">Loading family records...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 border rounded-lg bg-red-50">
          <p className="text-red-600">Error: {error}</p>
        </div>
      ) : tableData.length > 0 ? (
        <Table
          columns={tableColumns}
          dataSource={tableData}
          pagination={{ pageSize: 5 }}
          bordered
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" },
          })}
        />
      ) : (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-slate-gray">No family records available</p>
        </div>
      )}
    </div>
  );
};

export default FamilyTable;
