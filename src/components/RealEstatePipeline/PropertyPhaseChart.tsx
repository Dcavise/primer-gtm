
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tables } from '@/integrations/supabase/types';

type RealEstateProperty = Tables<'real_estate_pipeline'>;

interface PropertyPhaseChartProps {
  properties: RealEstateProperty[];
}

// Color palette based on design system for categorical data
const PHASE_COLORS = [
  '#1F77B4', // Blue
  '#FF7F0E', // Orange
  '#2CA02C', // Green
  '#D62728', // Red
  '#9467BD'  // Purple
];

export const PropertyPhaseChart: React.FC<PropertyPhaseChartProps> = ({ properties }) => {
  const phaseData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    properties.forEach(property => {
      const phase = property.phase || 'Unknown';
      counts[phase] = (counts[phase] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value], index) => ({ 
        name, 
        value,
        // Assign a color from the palette, cycling if needed
        color: PHASE_COLORS[index % PHASE_COLORS.length] 
      }))
      .sort((a, b) => b.value - a.value);
  }, [properties]);

  if (phaseData.length === 0) {
    return <div className="flex justify-center items-center h-48 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={phaseData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={70} />
          <Tooltip 
            formatter={(value) => [`${value} properties`, 'Count']}
            labelFormatter={(name) => `Phase: ${name}`}
          />
          {/* Use the custom color from our data objects */}
          <Bar 
            dataKey="value" 
            barSize={20} 
            radius={[0, 4, 4, 0]}
            fill="#1F77B4" // Default color
            name="Properties"
          >
            {
              phaseData.map((entry, index) => (
                <rect 
                  key={`rect-${index}`} 
                  fill={entry.color}
                />
              ))
            }
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PropertyPhaseChart;
