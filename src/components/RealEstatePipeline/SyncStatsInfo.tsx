
import React from 'react';

interface SyncStatsInfoProps {
  lastSynced: string | null;
  syncedRecords: number | null;
}

export const SyncStatsInfo: React.FC<SyncStatsInfoProps> = ({ 
  lastSynced, 
  syncedRecords 
}) => {
  if (!lastSynced) return null;
  
  return (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Last synced:</span>
        <span className="font-medium">
          {new Date(lastSynced).toLocaleString()}
        </span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Records synced:</span>
        <span className="font-medium">{syncedRecords}</span>
      </div>
    </>
  );
};

export default SyncStatsInfo;
