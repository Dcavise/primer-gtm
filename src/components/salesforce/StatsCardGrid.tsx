
import React, { useState } from 'react';
import { StatsCard } from './StatsCard';
import { EmploymentStatusDialog } from './EmploymentStatusDialog';
import { LeadsChartDialog } from './LeadsChartDialog';
import { PipelineChartDialog } from './PipelineChartDialog';
import { SummaryStats, EmploymentStatusCount, WeeklyLeadCount, OpportunityStageCount } from '@/hooks/salesforce/types';
import { WeeklyLeadTrendsByCampus } from './WeeklyLeadTrendsByCampus';
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
  stats,
  employmentStatusCounts,
  weeklyLeadCounts,
  opportunityStageCounts,
  selectedCampusId,
  selectedCampusName,
  campuses = []
}) => {
  const [isEmploymentDialogOpen, setIsEmploymentDialogOpen] = useState(false);
  const [isLeadsDialogOpen, setIsLeadsDialogOpen] = useState(false);
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Fellows"
          value={stats.fellowsCount}
          description="Total fellows"
          onClick={() => setIsEmploymentDialogOpen(true)}
        />
        
        <StatsCard 
          title="Leads"
          value={stats.leadsCount}
          description="Total leads"
          onClick={() => setIsLeadsDialogOpen(true)}
        />
        
        <StatsCard 
          title="Active Opportunities"
          value={stats.activeOpportunitiesCount}
          description="In progress"
          onClick={() => setIsPipelineDialogOpen(true)}
        />
        
        <StatsCard 
          title="Closed Won"
          value={stats.closedWonOpportunitiesCount}
          description="Converted opportunities"
        />
      </div>
      
      {/* Add the Weekly Lead Trends component */}
      <WeeklyLeadTrendsByCampus 
        weeklyLeadCounts={weeklyLeadCounts}
        campuses={campuses || []} 
        selectedCampusName={selectedCampusName}
      />
      
      <EmploymentStatusDialog
        open={isEmploymentDialogOpen}
        onOpenChange={setIsEmploymentDialogOpen}
        employmentStatusCounts={employmentStatusCounts}
        selectedCampusName={selectedCampusName}
      />
      
      <LeadsChartDialog
        open={isLeadsDialogOpen}
        onOpenChange={setIsLeadsDialogOpen}
        weeklyLeadCounts={weeklyLeadCounts}
        selectedCampusName={selectedCampusName}
      />
      
      <PipelineChartDialog
        open={isPipelineDialogOpen}
        onOpenChange={setIsPipelineDialogOpen}
        opportunityStageCounts={opportunityStageCounts}
        selectedCampusName={selectedCampusName}
      />
    </>
  );
};
