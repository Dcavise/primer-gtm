
import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { LeaseStatus } from '@/types/realEstate';
import { EnumSelector } from './EnumSelector';

// Valid options for this enum
const LEASE_STATUS_OPTIONS: LeaseStatus[] = ["pending", "sent", "signed"];

// Props type
interface LeaseStatusSelectorProps {
  value: LeaseStatus | null | undefined;
  onValueChange: (value: LeaseStatus | '') => void;
  className?: string;
  disabled?: boolean;
}

// Fallback component if the selector fails
function SelectorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="border p-2 rounded text-sm text-red-500">
      Selector failed to load
    </div>
  );
}

export function LeaseStatusSelector(props: LeaseStatusSelectorProps) {
  return (
    <ErrorBoundary fallback={(error, resetError) => <SelectorFallback error={error} resetError={resetError} />}>
      <EnumSelector<LeaseStatus>
        {...props}
        options={LEASE_STATUS_OPTIONS}
        getOptionColor={(option) => {
          switch (option) {
            case 'pending': return 'bg-[#FF7F0E] text-white';
            case 'sent': return 'bg-[#1F77B4] text-white';
            case 'signed': return 'bg-[#2CA02C] text-white';
            default: return '';
          }
        }}
      />
    </ErrorBoundary>
  );
}

export default LeaseStatusSelector;
