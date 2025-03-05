
import React from 'react';

export interface LoadingStateProps {
  message?: string;
  showSpinner?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  showSpinner = false 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      {showSpinner ? (
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary mb-2"></div>
      ) : (
        <div className="h-6 w-24 bg-slate-200 animate-pulse rounded mb-2"></div>
      )}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};
