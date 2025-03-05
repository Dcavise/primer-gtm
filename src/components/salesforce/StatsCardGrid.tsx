
import React, { useState } from 'react';
import { StatsCard } from './StatsCard';
import { EmploymentStatusDialog } from './EmploymentStatusDialog';
import { Users, ArrowUpRight, Clock, CheckCircle } from 'lucide-react';
import { SummaryStats, EmploymentStatusCount } from '@/hooks/salesforce/types';
import { formatNumber } from '@/utils/format';

interface StatsCardGridProps {
  stats: SummaryStats;
  employmentStatusCounts: EmploymentStatusCount[];
  selectedCampusId: string | null;
  selectedCampusName: string | null;
}

export const StatsCardGrid: React.FC<StatsCardGridProps> = ({ 
  stats, 
  employmentStatusCounts,
  selectedCampusId,
  selectedCampusName
}) => {
  const [showEmploymentStatus, setShowEmploymentStatus] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Fellows"
          value={formatNumber(stats.fellowsCount)}
          description={selectedCampusId ? 'Fellows at this campus' : 'Total Fellows'}
          icon={Users}
          onClick={() => setShowEmploymentStatus(true)}
        />
        <StatsCard
          title="Leads"
          value={formatNumber(stats.leadsCount)}
          description={selectedCampusId ? 'Leads for this campus' : 'Total Leads'}
          icon={ArrowUpRight}
        />
        <StatsCard
          title="Active Opportunities"
          value={formatNumber(stats.activeOpportunitiesCount)}
          description="Not Closed Won/Lost"
          icon={Clock}
        />
        <StatsCard
          title="Closed Won"
          value={formatNumber(stats.closedWonOpportunitiesCount)}
          description="Successful opportunities"
          icon={CheckCircle}
        />
      </div>

      <EmploymentStatusDialog
        open={showEmploymentStatus}
        onOpenChange={setShowEmploymentStatus}
        data={employmentStatusCounts}
        campusName={selectedCampusName}
      />
    </>
  );
};
