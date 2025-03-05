
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
import { OpportunityStageCount } from '@/hooks/salesforce/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface PipelineChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityStageCounts: OpportunityStageCount[];
  selectedCampusName: string | null;
}

export const PipelineChartDialog: React.FC<PipelineChartDialogProps> = ({
  open,
  onOpenChange,
  opportunityStageCounts,
  selectedCampusName
}) => {
  // Following the data visualization color guidelines for bar charts
  // Using the recommended distinct values for categories
  const colors = ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Pipeline Opportunities {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}</span>
            <DialogClose asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>

        <div className="h-[400px] mt-4">
          {opportunityStageCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={opportunityStageCounts}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="stage" 
                  tickMargin={10}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  allowDecimals={false}
                  tickMargin={10}
                />
                <Tooltip 
                  formatter={(value) => [`${value} opportunities`, 'Count']}
                />
                <Bar dataKey="count" name="Opportunities">
                  {opportunityStageCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                  <LabelList dataKey="count" position="top" fill="#374151" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No pipeline data available
            </div>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium mb-2">Pipeline Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {opportunityStageCounts.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500">{item.stage}</div>
                <div className="text-lg font-semibold">{item.count}</div>
                <div 
                  className="w-full h-1 mt-2 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
