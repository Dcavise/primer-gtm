import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PropertyPhase } from "@/types/realEstate";
import { fieldValidators } from "@/schemas/propertySchema";

// Define the valid phases based on the enum type in the database
export const VALID_PHASES: PropertyPhase[] = [
  "0. New Site",
  "1. Initial Diligence",
  "2. Survey",
  "3. Test Fit",
  "4. Plan Production",
  "5. Permitting",
  "6. Construction",
  "7. Set Up",
  "Hold",
  "Deprioritize",
];

// Function to get the appropriate color class based on the phase
export const getPhaseColorClass = (
  phase: PropertyPhase | null | undefined,
): string => {
  if (!phase) return "bg-gray-100 text-gray-800";

  switch (phase) {
    case "0. New Site":
      return "bg-gray-200 text-gray-800";
    case "1. Initial Diligence":
      return "bg-[#1F77B4] text-white"; // Blue
    case "2. Survey":
      return "bg-[#FF7F0E] text-white"; // Orange
    case "3. Test Fit":
      return "bg-[#9467BD] text-white"; // Purple
    case "4. Plan Production":
      return "bg-[#2CA02C] text-white"; // Green
    case "5. Permitting":
      return "bg-[#1F77B4] text-white"; // Blue
    case "6. Construction":
      return "bg-[#495057] text-white"; // Dark gray
    case "7. Set Up":
      return "bg-[#2CA02C] text-white"; // Green
    case "Hold":
      return "bg-amber-800 text-white";
    case "Deprioritize":
      return "bg-gray-700 text-white";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

interface PhaseSelectorProps {
  value: PropertyPhase | null | undefined;
  onValueChange: (value: PropertyPhase | "") => void;
  className?: string;
  disabled?: boolean;
}

export const PhaseSelector: React.FC<PhaseSelectorProps> = ({
  value,
  onValueChange,
  className,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  // Make sure we display the current phase or "--None--" if not set
  const displayValue = value || "--None--";

  // The colorClass for the button should reflect the current phase
  const colorClass = value ? getPhaseColorClass(value) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between w-full border-input",
            value ? colorClass : "",
            className,
          )}
          disabled={disabled}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[200px]" align="start">
        <Command>
          <CommandInput placeholder="Search phases..." />
          <CommandEmpty>No phase found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              key="none"
              value="none"
              onSelect={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0",
                )}
              />
              --None--
            </CommandItem>
            {VALID_PHASES.map((phase) => (
              <CommandItem
                key={phase}
                value={phase}
                onSelect={() => {
                  onValueChange(phase);
                  setOpen(false);
                }}
              >
                <div className="flex items-center w-full">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === phase ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span>{phase}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default PhaseSelector;
