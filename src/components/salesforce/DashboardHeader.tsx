
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/utils/format';

interface DashboardHeaderProps {
  title: string;
  onRefresh: () => void;
  isLoading: boolean;
  lastRefreshed: Date | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  onRefresh, 
  isLoading,
  lastRefreshed
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex flex-col items-end">
        <Button 
          onClick={onRefresh} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
        {lastRefreshed && (
          <span className="text-xs text-muted-foreground mt-1">
            Last refreshed: {lastRefreshed.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};
