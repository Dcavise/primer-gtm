
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TimeSeriesData } from '@/hooks/salesforce/types';

interface MetricsChartsProps {
  timeSeriesData: TimeSeriesData[];
  period: 'daily' | 'weekly' | 'monthly';
}

export const MetricsCharts: React.FC<MetricsChartsProps> = ({ 
  timeSeriesData,
  period
}) => {
  // Filter the relevant series for display based on the period
  const displayData = timeSeriesData.slice(0, 2); // Show only the first two metrics for simplicity
  
  // Format date for x-axis based on the period
  const formatXAxis = (value: string) => {
    const date = new Date(value);
    if (period === 'daily') {
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    } else if (period === 'weekly') {
      return `W${getWeekNumber(date)}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };
  
  // Helper function to get week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  // Combine data for all time series for a smoother chart layout
  const combinedData = [];
  if (displayData[0]?.data) {
    for (let i = 0; i < displayData[0].data.length; i++) {
      const dataPoint: any = { date: displayData[0].data[i].date };
      
      displayData.forEach(series => {
        if (series.data[i]) {
          dataPoint[series.id] = series.data[i].value;
        }
      });
      
      combinedData.push(dataPoint);
    }
  }
  
  // Use the recommended color palette for data visualization
  // Primary colors from the custom instructions
  const colors = ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD'];
  
  return (
    <div className="w-full mt-4">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                width={45}
              />
              <Tooltip 
                formatter={(value) => [Number(value).toLocaleString('en-US'), '']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              />
              {displayData.map((series, index) => (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={series.id}
                  name={series.name}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center space-x-6">
          {displayData.map((series, index) => (
            <div key={series.id} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm">{series.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
