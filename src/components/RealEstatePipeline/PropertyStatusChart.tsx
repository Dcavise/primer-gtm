
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Tables } from '@/integrations/supabase/types';

type RealEstateProperty = Tables<'real_estate_pipeline'>;

interface PropertyStatusChartProps {
  properties: RealEstateProperty[];
}

// Following the color scheme specified in custom instructions
const STATUS_COLORS: Record<string, string> = {
  active: '#2CA02C',    // Green (positive)
  approved: '#2CA02C',  // Green (positive)
  pending: '#FF7F0E',   // Orange (warning)
  hold: '#FF7F0E',      // Orange (warning)
  rejected: '#D62728',  // Red (negative)
  dead: '#D62728',      // Red (negative)
  default: '#1F77B4',   // Blue (neutral)
};

export const PropertyStatusChart: React.FC<PropertyStatusChartProps> = ({ properties }) => {
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    properties.forEach(property => {
      const status = property.status?.toLowerCase() || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
      value,
    })).sort((a, b) => b.value - a.value); // Sort by count (descending)
  }, [properties]);
  
  // Only show top 5 statuses, group the rest as "Other"
  const chartData = useMemo(() => {
    if (statusData.length <= 5) return statusData;
    
    const topFive = statusData.slice(0, 4);
    const otherCount = statusData.slice(4).reduce((sum, item) => sum + item.value, 0);
    
    return [
      ...topFive, 
      { name: 'Other', value: otherCount }
    ];
  }, [statusData]);

  // Get color for a given status
  const getStatusColor = (status: string) => {
    const key = status.toLowerCase();
    
    if (key === 'other') return '#D3D3D3'; // Light Gray for "Other"
    
    // Check for partial matches in status names
    for (const [statusKey, color] of Object.entries(STATUS_COLORS)) {
      if (key.includes(statusKey)) {
        return color;
      }
    }
    
    return STATUS_COLORS.default;
  };

  if (chartData.length === 0) {
    return <div className="flex justify-center items-center h-48 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} properties`, 'Count']} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PropertyStatusChart;
