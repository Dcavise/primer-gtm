
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyPhase } from "@/types/realEstate";
import { getPhaseColorClass } from './PhaseSelector';

interface SimplePhaseSelectorProps {
  value: PropertyPhase | null | undefined;
  onValueChange: (value: PropertyPhase | '') => void;
  className?: string;
  disabled?: boolean;
}

export function SimplePhaseSelector({ 
  value, 
  onValueChange, 
  className,
  disabled = false
}: SimplePhaseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Import the valid phases from the existing PhaseSelector
  const phaseOptions = [
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
  ] as PropertyPhase[];
  
  // Make sure we display the current phase or "--None--" if not set
  const displayValue = value || "--None--";
  
  // The colorClass for the button should reflect the current phase
  const colorClass = value ? getPhaseColorClass(value) : '';
  
  // Handle phase selection
  const handleSelect = (phase: PropertyPhase) => {
    onValueChange(phase);
    setIsOpen(false);
  };

  // Handle selecting "None"
  const handleSelectNone = () => {
    onValueChange('');
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Dropdown trigger button */}
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className={cn(
          "w-full justify-between border-input", 
          value ? colorClass : "",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        disabled={disabled}
      >
        {displayValue}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-72 overflow-y-auto p-1">
            {/* None option */}
            <div
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                "hover:bg-accent hover:text-accent-foreground",
                !value ? "bg-accent text-accent-foreground" : ""
              )}
              onClick={handleSelectNone}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              --None--
            </div>
            
            {/* Phase options */}
            {phaseOptions.map((phase) => (
              <div
                key={phase}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  value === phase ? "bg-accent text-accent-foreground" : ""
                )}
                onClick={() => handleSelect(phase)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === phase ? "opacity-100" : "opacity-0"
                  )}
                />
                {phase}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SimplePhaseSelector;
