
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
import { WeeklyLeadCount } from '@/hooks/salesforce/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

interface LeadsChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeklyLeadCounts: WeeklyLeadCount[];
  selectedCampusName: string | null;
}

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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

        <div className="h-[300px] mt-4">
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
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No lead data available for this period
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
