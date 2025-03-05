
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building, Map, School, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PropertyDataCount {
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface PropertyDataVisualizerProps {
  permitCount: number;
  hasZoning: boolean;
  schoolsCount: number;
}

export const PropertyDataVisualizer: React.FC<PropertyDataVisualizerProps> = ({
  permitCount,
  hasZoning,
  schoolsCount,
}) => {
  const data: PropertyDataCount[] = [
    {
      name: 'Building Permits',
      count: permitCount,
      icon: <FileText className="h-4 w-4" />,
      color: '#1F77B4' // Blue from the color guide
    },
    {
      name: 'Zoning Info',
      count: hasZoning ? 1 : 0,
      icon: <Map className="h-4 w-4" />,
      color: '#FF7F0E' // Orange from the color guide
    },
    {
      name: 'Schools',
      count: schoolsCount,
      icon: <School className="h-4 w-4" />,
      color: '#2CA02C' // Green from the color guide
    }
  ];

  if (data.every(item => item.count === 0)) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-500" />
          Property Data Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [value, 'Count']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
