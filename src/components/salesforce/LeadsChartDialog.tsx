
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WeeklyLeadCount } from '@/hooks/salesforce/types';
import { formatDate } from '@/utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LeadsChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: WeeklyLeadCount[];
  campusName: string | null;
}

export const LeadsChartDialog: React.FC<LeadsChartDialogProps> = ({
  open,
  onOpenChange,
  data,
  campusName
}) => {
  // Format dates for better display
  const formattedData = data.map(item => ({
    ...item,
    formattedWeek: formatDate(item.week)
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Weekly Lead Generation</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-4">
          {campusName ? `Data for ${campusName}` : 'Data for all campuses'}
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedWeek" 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} leads`, 'Count']}
                labelFormatter={(value) => `Week of ${value}`}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            This chart shows the number of new leads generated each week for the past 4 weeks.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
