
import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from "@/components/ui/button";
import { SimplePhaseSelector } from './SimplePhaseSelector';
import { PropertyPhase } from "@/types/realEstate";

// Type for props
interface SafeSimplePhaseSelectorProps {
  value: PropertyPhase | null | undefined;
  onValueChange: (value: PropertyPhase | '') => void;
  className?: string;
  disabled?: boolean;
}

// Safe fallback component if the selector fails
function PhaseSelectorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="border p-2 rounded">
      <p className="text-sm text-red-500">Phase selector failed to load</p>
      <Button size="sm" variant="outline" onClick={resetError} className="mt-2">
        Try again
      </Button>
    </div>
  );
}

export function SafeSimplePhaseSelector(props: SafeSimplePhaseSelectorProps) {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <PhaseSelectorFallback error={error} resetError={resetError} />
      )}
    >
      <SimplePhaseSelector {...props} />
    </ErrorBoundary>
  );
}

export default SafeSimplePhaseSelector;
