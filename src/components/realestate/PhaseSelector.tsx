
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyPhase } from '@/types/realEstate';

const PHASE_OPTIONS: PropertyPhase[] = [
  '0. New Site',
  '1. Initial Diligence',
  '2. Survey',
  '3. Test Fit',
  '4. Plan Production',
  '5. Permitting',
  '6. Construction',
  '7. Set Up',
  'Hold',
  'Deprioritize'
];

interface PhaseSelectorProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const PhaseSelector: React.FC<PhaseSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Phase" />
      </SelectTrigger>
      <SelectContent>
        {PHASE_OPTIONS.map((phase) => (
          <SelectItem key={phase} value={phase}>
            {phase}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
