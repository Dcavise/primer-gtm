
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tables } from '@/integrations/supabase/types';

type RealEstateProperty = Tables<'real_estate_pipeline'>;

interface PropertyStateChartProps {
  properties: RealEstateProperty[];
}

export const PropertyStateChart: React.FC<PropertyStateChartProps> = ({ properties }) => {
  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    properties.forEach(property => {
      const state = property.state || 'Unknown';
      counts[state] = (counts[state] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ 
        name, 
        value,
      }))
      .sort((a, b) => b.value - a.value); // Sort by count (descending)
  }, [properties]);

  if (stateData.length === 0) {
    return <div className="flex justify-center items-center h-48 text-muted-foreground">No data available</div>;
  }

  // Limit to top 10 states for better visualization
  const chartData = stateData.slice(0, 10);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`${value} properties`, 'Count']}
            labelFormatter={(name) => `State: ${name}`}
          />
          <Bar 
            dataKey="value" 
            name="Properties" 
            fill="#1F77B4" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PropertyStateChart;
