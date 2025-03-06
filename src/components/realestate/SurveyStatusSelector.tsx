
import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { SurveyStatus } from '@/types/realEstate';
import { EnumSelector } from './EnumSelector';

// Valid options for this enum
const SURVEY_STATUS_OPTIONS: SurveyStatus[] = ["complete", "pending", "unknown"];

// Props type
interface SurveyStatusSelectorProps {
  value: SurveyStatus | null | undefined;
  onValueChange: (value: SurveyStatus | '') => void;
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

export function SurveyStatusSelector(props: SurveyStatusSelectorProps) {
  return (
    <ErrorBoundary fallback={(error, resetError) => (
      <SelectorFallback error={error} resetError={resetError} />
    )}>
      <EnumSelector<SurveyStatus>
        {...props}
        options={SURVEY_STATUS_OPTIONS}
        getOptionColor={(option) => {
          switch (option) {
            case 'complete': return 'bg-[#2CA02C] text-white';
            case 'pending': return 'bg-[#FF7F0E] text-white';
            case 'unknown': return 'bg-[#6c757d] text-white';
            default: return '';
          }
        }}
      />
    </ErrorBoundary>
  );
}

export default SurveyStatusSelector;
