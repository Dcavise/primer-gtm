
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WeeklyLeadCount } from '@/hooks/salesforce/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { format, parseISO } from 'date-fns';

interface LeadsChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeklyLeadCounts: WeeklyLeadCount[];
  selectedCampusName: string | null;
}

// Custom label component for data points
const CustomizedLabel = (props: any) => {
  const { x, y, value } = props;
  return (
    <text x={x} y={y - 10} fill="#4f46e5" textAnchor="middle" dominantBaseline="middle">
      {value}
    </text>
  );
};

export const LeadsChartDialog: React.FC<LeadsChartDialogProps> = ({
  open,
  onOpenChange,
  weeklyLeadCounts,
  selectedCampusName
}) => {
  // Format the data for the chart, safely handle undefined or empty data
  const chartData = weeklyLeadCounts && weeklyLeadCounts.length > 0 
    ? weeklyLeadCounts.map(item => ({
        ...item,
        formattedWeek: format(parseISO(item.week), 'MMM d')
      }))
    : [];

  // Calculate week-over-week growth percentages
  const chartDataWithGrowth = chartData.map((item, index) => {
    if (index === 0) {
      return { ...item, growthPercent: null };
    }
    
    const currentCount = item.count;
    const previousCount = chartData[index - 1].count;
    
    let growthPercent = null;
    if (previousCount > 0) {
      growthPercent = ((currentCount - previousCount) / previousCount) * 100;
    }
    
    return { ...item, growthPercent };
  });

  console.log("Weekly lead counts data:", weeklyLeadCounts);
  console.log("Formatted chart data with growth:", chartDataWithGrowth);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Weekly Lead Generation {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}</span>
            <DialogClose asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>

        <div className="h-[400px] mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedWeek" 
                  tickMargin={10}
                />
                <YAxis 
                  allowDecimals={false}
                  tickMargin={10}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  formatter={(value) => [`${value} leads`, 'Count']}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="New Leads" 
                  stroke="#4f46e5" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                  label={<CustomizedLabel />}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No lead data available for this period
            </div>
          )}
        </div>
        
        {chartDataWithGrowth.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">Weekly Lead Counts</h3>
            <div className="grid grid-cols-4 gap-4">
              {chartDataWithGrowth.map((item, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  <div className="text-xs text-gray-500">Week of {item.formattedWeek}</div>
                  <div className="text-lg font-semibold">{item.count} leads</div>
                  
                  {/* Growth percentage badge */}
                  {index > 0 && item.growthPercent !== null && (
                    <div className="mt-1">
                      <Badge 
                        variant={item.growthPercent >= 0 ? "default" : "destructive"}
                        className={item.growthPercent >= 0 ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}
                      >
                        {item.growthPercent >= 0 ? "+" : ""}{item.growthPercent.toFixed(1)}% WoW
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
