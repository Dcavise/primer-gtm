
import React, { useMemo } from 'react';
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
  // Generate data grouping based on campuses when in "All Campuses" view
  const chartData = useMemo(() => {
    if (!weeklyLeadCounts || weeklyLeadCounts.length === 0) {
      return [];
    }

    // When a specific campus is selected, show only that campus data
    if (selectedCampusName) {
      return weeklyLeadCounts.map(item => ({
        ...item,
        formattedWeek: format(parseISO(item.week), 'MMM d'),
        [selectedCampusName]: item.count
      }));
    } 
    
    // For "All Campuses" view, group by week and show all campuses with data
    // Group by week first to create the base structure
    const weeklyData = weeklyLeadCounts.reduce((acc, item) => {
      const weekKey = format(parseISO(item.week), 'MMM d');
      if (!acc[weekKey]) {
        acc[weekKey] = { 
          week: item.week,
          formattedWeek: weekKey,
          Total: 0
        };
      }
      
      // Get campus name if campus_id is provided in the lead data
      if (item.campus_id && item.campus_name) {
        if (!acc[weekKey][item.campus_name]) {
          acc[weekKey][item.campus_name] = 0;
        }
        acc[weekKey][item.campus_name] += item.count;
      } else {
        // If no campus info in the data, add to 'Uncategorized'
        if (!acc[weekKey]['Uncategorized']) {
          acc[weekKey]['Uncategorized'] = 0;
        }
        acc[weekKey]['Uncategorized'] += item.count;
      }
      
      // Update total
      acc[weekKey].Total += item.count;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array for the chart
    return Object.values(weeklyData).sort((a, b) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    );
  }, [weeklyLeadCounts, selectedCampusName]);

  // Color constants based on custom instructions
  const PRIMARY_COLORS = [
    "#1F77B4", // Blue
    "#FF7F0E", // Orange
    "#2CA02C", // Green
    "#D62728", // Red
    "#9467BD"  // Purple
  ];
  const GRID_COLOR = "#dee2e6"; // Platinum
  const BACKGROUND_COLOR = "#f8f9fa"; // Seasalt

  // Determine which campuses to show in the legend
  const visibleCampuses = useMemo(() => {
    if (selectedCampusName) {
      return [selectedCampusName];
    }

    // For "All Campuses" view, find campuses that actually have data
    if (chartData.length > 0) {
      const firstDataPoint = chartData[0];
      return Object.keys(firstDataPoint)
        .filter(key => !['week', 'formattedWeek'].includes(key))
        .sort((a, b) => {
          // Always put Total at the end if it exists
          if (a === 'Total') return 1;
          if (b === 'Total') return -1;
          return a.localeCompare(b);
        });
    }
    
    return [];
  }, [chartData, selectedCampusName]);

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
                  formatter={(value, name) => [`${value} leads`, name]}
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
                
                {/* Render lines for each campus or just the selected campus */}
                {visibleCampuses.map((campusName, index) => (
                  <Line 
                    key={campusName}
                    type="monotone" 
                    dataKey={campusName} 
                    name={campusName} 
                    stroke={PRIMARY_COLORS[index % PRIMARY_COLORS.length]} 
                    strokeWidth={campusName === 'Total' ? 3 : 2} 
                    dot={{ r: 4, fill: PRIMARY_COLORS[index % PRIMARY_COLORS.length], stroke: PRIMARY_COLORS[index % PRIMARY_COLORS.length] }} 
                    activeDot={{ r: 6, fill: PRIMARY_COLORS[index % PRIMARY_COLORS.length], stroke: 'white', strokeWidth: 2 }} 
                    animationDuration={1500}
                    strokeDasharray={campusName === 'Total' ? '' : ''}
                  />
                ))}
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
