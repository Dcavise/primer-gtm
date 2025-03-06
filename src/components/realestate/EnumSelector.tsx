
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnumSelectorProps<T extends string> {
  value: T | null | undefined;
  onValueChange: (value: T | '') => void;
  options: T[];
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  getOptionColor?: (option: T) => string;
}

export function EnumSelector<T extends string>({ 
  value, 
  onValueChange, 
  options,
  className,
  disabled = false,
  placeholder = "--None--",
  getOptionColor
}: EnumSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Make sure we display the current value or placeholder if not set
  const displayValue = value || placeholder;
  
  // The colorClass for the button should reflect the current value if a color function is provided
  const colorClass = value && getOptionColor ? getOptionColor(value) : '';
  
  // Handle option selection
  const handleSelect = (option: T) => {
    onValueChange(option);
    setIsOpen(false);
  };

  // Handle selecting "None"
  const handleSelectNone = () => {
    onValueChange('' as '');
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
              {placeholder}
            </div>
            
            {/* Options */}
            {options.map((option) => (
              <div
                key={option}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  value === option ? "bg-accent text-accent-foreground" : ""
                )}
                onClick={() => handleSelect(option)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option ? "opacity-100" : "opacity-0"
                  )}
                />
                {option}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnumSelector;
