import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaseStatus } from "@/types/realEstate";

// Valid options for this enum
const LEASE_STATUS_OPTIONS: LeaseStatus[] = ["pending", "sent", "signed"];

// Props type to maintain compatibility with existing implementation
interface LeaseStatusSelectorProps {
  value: LeaseStatus | null | undefined;
  onValueChange: (value: LeaseStatus | "") => void;
  className?: string;
  disabled?: boolean;
}

export function LeaseStatusSelector({
  value,
  onValueChange,
  className,
  disabled = false,
}: LeaseStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Display value
  const displayValue = value || "Select status";

  // Format status for display (capitalize first letter)
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get the appropriate color for the status
  const getStatusColor = (status: LeaseStatus): string => {
    switch (status) {
      case "pending":
        return "bg-[#FF7F0E] text-white";
      case "sent":
        return "bg-[#1F77B4] text-white";
      case "signed":
        return "bg-[#2CA02C] text-white";
      default:
        return "";
    }
  };

  // Handle status selection
  const handleSelect = (status: LeaseStatus) => {
    onValueChange(status);
    setIsOpen(false);
  };

  // Handle clear
  const handleClear = () => {
    onValueChange("");
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Dropdown trigger button */}
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        type="button"
        disabled={disabled}
      >
        {value ? formatStatus(displayValue) : displayValue}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-72 overflow-y-auto p-1">
            {LEASE_STATUS_OPTIONS.map((status) => (
              <div
                key={status}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  value === status ? "bg-accent text-accent-foreground" : "",
                )}
                onClick={() => handleSelect(status)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === status ? "opacity-100" : "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium mr-2",
                    getStatusColor(status),
                  )}
                >
                  {formatStatus(status)}
                </span>
              </div>
            ))}
            {/* Clear option */}
            <div
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              onClick={handleClear}
            >
              <span className="px-2 py-0.5">Clear selection</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaseStatusSelector;
