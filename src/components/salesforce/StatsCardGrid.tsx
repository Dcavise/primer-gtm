
import React from 'react';
import { StatsCard } from './StatsCard';
import { Users, ArrowUpRight, Clock, CheckCircle } from 'lucide-react';
import { SummaryStats } from '@/hooks/use-salesforce-data';

interface StatsCardGridProps {
  stats: SummaryStats;
  selectedCampusId: string | null;
}

export const StatsCardGrid: React.FC<StatsCardGridProps> = ({ stats, selectedCampusId }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Fellows"
        value={stats.fellowsCount}
        description={selectedCampusId ? 'Fellows at this campus' : 'Total Fellows'}
        icon={Users}
      />
      <StatsCard
        title="Leads"
        value={stats.leadsCount}
        description={selectedCampusId ? 'Leads for this campus' : 'Total Leads'}
        icon={ArrowUpRight}
      />
      <StatsCard
        title="Active Opportunities"
        value={stats.activeOpportunitiesCount}
        description="Not Closed Won/Lost"
        icon={Clock}
      />
      <StatsCard
        title="Closed Won"
        value={stats.closedWonOpportunitiesCount}
        description="Successful opportunities"
        icon={CheckCircle}
      />
    </div>
  );
};
