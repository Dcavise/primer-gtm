
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Tables } from '@/integrations/supabase/types';

type RealEstateProperty = Tables<'real_estate_pipeline'>;

interface PropertyMarketChartProps {
  properties: RealEstateProperty[];
}

// Using the blue color scheme from custom instructions for the market chart
const MARKET_COLORS = [
  '#1F77B4', // Blue
  '#6BAED6', // Medium Blue
  '#94A3D3', // Light Blue
  '#D3D3D3', // Light Gray (for "other")
  '#FF7F0E', // Orange (for overflow)
];

export const PropertyMarketChart: React.FC<PropertyMarketChartProps> = ({ properties }) => {
  const marketData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    properties.forEach(property => {
      const market = property.market || 'Unknown';
      counts[market] = (counts[market] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [properties]);
  
  // Only show top 4 markets, group the rest as "Other"
  const chartData = useMemo(() => {
    if (marketData.length <= 4) return marketData;
    
    const topFour = marketData.slice(0, 3);
    const otherCount = marketData.slice(3).reduce((sum, item) => sum + item.value, 0);
    
    return [
      ...topFour, 
      { name: 'Other', value: otherCount }
    ];
  }, [marketData]);

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
              <Cell 
                key={`cell-${index}`} 
                fill={MARKET_COLORS[index % MARKET_COLORS.length]} 
              />
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

export default PropertyMarketChart;
