
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyLeadCount } from '@/hooks/salesforce/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Campus } from '@/hooks/salesforce/types';

interface WeeklyLeadTrendsByCampusProps {
  weeklyLeadCounts: WeeklyLeadCount[];
  campuses: Campus[];
  selectedCampusName: string | null;
}

export const WeeklyLeadTrendsByCampus = ({
  weeklyLeadCounts,
  campuses,
  selectedCampusName
}: WeeklyLeadTrendsByCampusProps) => {
  // Format the data for the chart
  const chartData = weeklyLeadCounts && weeklyLeadCounts.length > 0 
    ? weeklyLeadCounts.map(item => ({
        ...item,
        formattedWeek: format(parseISO(item.week), 'MMM d'),
        campus: selectedCampusName || 'All Campuses'
      }))
    : [];

  // Color constants based on custom instructions
  const PRIMARY_COLOR = "#1F77B4"; // Blue
  const GRID_COLOR = "#dee2e6"; // Platinum
  const BACKGROUND_COLOR = "#f8f9fa"; // Seasalt

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">
          Weekly Lead Trends {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 10, right: 30, left: 20, bottom: 25 }}
                style={{ backgroundColor: BACKGROUND_COLOR, borderRadius: "8px" }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis 
                  dataKey="formattedWeek" 
                  label={{ 
                    value: 'Week Starting', 
                    position: 'insideBottom', 
                    offset: -15, 
                    style: { textAnchor: 'middle', fill: '#495057' }
                  }}
                  tickMargin={10}
                  tick={{ fill: '#495057' }}
                />
                <YAxis 
                  allowDecimals={false}
                  label={{ 
                    value: 'Lead Count', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#495057' } 
                  }}
                  tickMargin={10}
                  tick={{ fill: '#495057' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} leads`, 'Count']}
                  labelFormatter={(label) => `Week of ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name={selectedCampusName || "All Campuses"} 
                  stroke={PRIMARY_COLOR} 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: PRIMARY_COLOR, stroke: PRIMARY_COLOR }} 
                  activeDot={{ r: 6, fill: PRIMARY_COLOR, stroke: 'white', strokeWidth: 2 }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50 rounded-md">
              <p>No lead data available for this period</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
