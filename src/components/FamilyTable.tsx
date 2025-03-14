import React, { useState, useEffect, useMemo } from "react";
import { Table } from "antd";
import type { TableColumnsType } from "antd";
import { Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

// Function to generate mock family data
const generateMockFamilyData = (count: number): FamilyTableData[] => {
  const stages = [
    "Application",
    "Family Interview",
    "Admission Offered",
    "Closed Won",
    "Closed Lost",
    "Education Review"
  ];
  
  const campuses = [
    "Atlanta",
    "Miami",
    "New York",
    "Birmingham",
    "Chicago"
  ];
  
  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", 
    "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin"
  ];
  
  const mockData: FamilyTableData[] = [];
  
  for (let i = 0; i < count; i++) {
    const familyId = `00A${Math.random().toString(36).substring(2, 8)}${Math.random().toString(36).substring(2, 8)}`;
    const familyName = `${lastNames[i % lastNames.length]} Family`;
    const campusName = campuses[i % campuses.length];
    const stage = stages[i % stages.length];
    
    mockData.push({
      key: i.toString(),
      id: familyId,
      name: familyName,
      campus: campusName,
      stage: stage,
      familyIds: {
        standard_id: familyId,
        family_id: familyId,
        alternate_id: null,
      },
    });
  }
  
  return mockData;
};

/**
 * FamilyTable component
 * Standalone table component for displaying family records
 */
const FamilyTable: React.FC = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState<FamilyTableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get campus data
  const { campuses, isLoading: isLoadingCampuses } = useCampuses();

  // Define stage options for filtering
  const stageOptions = ["Application", "Family Interview", "Admission Offered", "Closed Won", "Closed Lost", "Education Review"];

  // Fetch family data
  useEffect(() => {
    const fetchFamilyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate a short network delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Generate 20 mock family records
        const mockData = generateMockFamilyData(20);
        setTableData(mockData);
      } catch (err) {
        setError("An error occurred while fetching family data");
        console.error("Exception fetching family data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, []);

  // Handle row click to navigate to family detail
  const handleRowClick = (record: FamilyTableData) => {
    if (!record.id) {
      console.error("Cannot navigate - missing family ID", record);
      return;
    }

    // Log for debugging
    console.log(`Table: Navigating to family detail with ID: ${record.id}`);

    // Navigate to the mock family detail page
    navigate(`/family-mock/${record.id}`);
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
      filters: campusOptions.map(campus => ({ text: campus, value: campus })),
      onFilter: (value, record) => record.campus === value,
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      filters: stageOptions.map(stage => ({ text: stage, value: stage })),
      onFilter: (value, record) => record.stage === value,
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