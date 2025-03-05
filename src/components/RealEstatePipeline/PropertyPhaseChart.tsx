
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tables } from '@/integrations/supabase/types';

type RealEstateProperty = Tables<'real_estate_pipeline'>;

interface PropertyPhaseChartProps {
  properties: RealEstateProperty[];
}

export const PropertyPhaseChart: React.FC<PropertyPhaseChartProps> = ({ properties }) => {
  const phaseData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    properties.forEach(property => {
      const phase = property.phase || 'Unknown';
      counts[phase] = (counts[phase] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
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
          <Tooltip formatter={(value) => [`${value} properties`, 'Count']} />
          <Bar dataKey="value" fill="#1F77B4" barSize={20} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PropertyPhaseChart;
