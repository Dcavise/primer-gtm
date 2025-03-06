
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SummaryStats, EmploymentStatusCount, WeeklyLeadCount, OpportunityStageCount } from '@/hooks/salesforce/types';
import { Campus } from '@/hooks/salesforce/types';

interface StatsCardGridProps {
  stats: SummaryStats;
  employmentStatusCounts: EmploymentStatusCount[];
  weeklyLeadCounts: WeeklyLeadCount[];
  opportunityStageCounts: OpportunityStageCount[];
  selectedCampusId: string | null;
  selectedCampusName: string | null;
  campuses?: Campus[];
}

export const StatsCardGrid: React.FC<StatsCardGridProps> = ({ 
  selectedCampusName
}) => {
  return (
    <Card className="mb-8">
      <CardContent className="p-6 mt-2">
        <div className="text-center bg-gray-50 rounded-md p-6">
          <p className="text-gray-500">
            Stats cards temporarily disabled while backend calculations are being implemented.
            {selectedCampusName && <span> Selected campus: <strong>{selectedCampusName}</strong></span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
