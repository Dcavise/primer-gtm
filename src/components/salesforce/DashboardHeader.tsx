
import React from 'react';
import { formatDate } from '@/utils/format';

interface DashboardHeaderProps {
  title: string;
  lastRefreshed: Date | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  lastRefreshed
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex flex-col items-end">
        {lastRefreshed && (
          <span className="text-xs text-muted-foreground">
            Last refreshed: {lastRefreshed.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};
