
import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { BooleanStatus } from '@/types/realEstate';
import { EnumSelector } from './EnumSelector';

// Valid options for this enum
const BOOLEAN_STATUS_OPTIONS: BooleanStatus[] = ["true", "false", "unknown"];

// Props type
interface BooleanStatusSelectorProps {
  value: BooleanStatus | null | undefined;
  onValueChange: (value: BooleanStatus | '') => void;
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

export function BooleanStatusSelector(props: BooleanStatusSelectorProps) {
  return (
    <ErrorBoundary fallback={(error, resetError) => (
      <SelectorFallback error={error} resetError={resetError} />
    )}>
      <EnumSelector<BooleanStatus>
        {...props}
        options={BOOLEAN_STATUS_OPTIONS}
        getOptionColor={(option) => {
          switch (option) {
            case 'true': return 'bg-[#2CA02C] text-white';
            case 'false': return 'bg-[#D62728] text-white';
            case 'unknown': return 'bg-[#6c757d] text-white';
            default: return '';
          }
        }}
      />
    </ErrorBoundary>
  );
}

export default BooleanStatusSelector;
