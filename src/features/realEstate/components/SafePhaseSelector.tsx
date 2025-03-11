import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  SafeCommand as Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/safe-command";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/error-boundary";
import { PropertyPhase } from "@/types/realEstate";
import { VALID_PHASES, getPhaseColorClass } from "./PhaseSelector";

// Type for props
interface PhaseSelectorProps {
  value: PropertyPhase | null | undefined;
  onValueChange: (value: PropertyPhase | "") => void;
  className?: string;
  disabled?: boolean;
}

// Safe fallback component if the selector fails
function PhaseSelectorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="border p-2 rounded">
      <p className="text-sm text-red-500">Phase selector failed to load</p>
      <Button size="sm" variant="outline" onClick={resetError} className="mt-2">
        Try again
      </Button>
    </div>
  );
}

export function SafePhaseSelector(props: PhaseSelectorProps) {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <PhaseSelectorFallback error={error} resetError={resetError} />
      )}
    >
      <PhaseSelectorInner {...props} />
    </ErrorBoundary>
  );
}

function PhaseSelectorInner({
  value,
  onValueChange,
  className,
  disabled = false,
}: PhaseSelectorProps) {
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
}

export default SafePhaseSelector;
