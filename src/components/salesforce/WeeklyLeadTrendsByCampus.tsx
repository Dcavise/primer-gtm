
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyLeadCount } from '@/hooks/salesforce/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Campus } from '@/hooks/salesforce/types';
import { TREND_COLORS } from '@/utils/chartColors';

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

  // Pick a color for the campus line
  const getCampusColor = (index: number) => {
    const colorOptions = [
      TREND_COLORS.primary,
      TREND_COLORS.secondary,
      '#2CA02C', // Green
      '#D62728', // Red
      '#9467BD', // Purple
      '#8C564B', // Brown
      '#E377C2', // Pink
      '#7F7F7F', // Gray
    ];
    return colorOptions[index % colorOptions.length];
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl">
          Weekly Lead Trends {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedWeek" 
                  label={{ value: 'Week Starting', position: 'insideBottom', offset: -15 }}
                  tickMargin={10}
                />
                <YAxis 
                  allowDecimals={false}
                  label={{ value: 'Lead Count', angle: -90, position: 'insideLeft' }}
                  tickMargin={10}
                />
                <Tooltip 
                  formatter={(value) => [`${value} leads`, 'Count']}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name={selectedCampusName || "All Campuses"} 
                  stroke={TREND_COLORS.primary} 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No lead data available for this period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
