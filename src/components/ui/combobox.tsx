import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComboBoxOption {
  value: string;
  label: string;
}

interface ComboBoxProps {
  options: ComboBoxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function ComboBox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  emptyMessage = "No options found.",
  className,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between border-input", className)}
        >
          {value ? options.find((option) => option.value === value)?.label : placeholder}
          <span className="ml-2 h-4 w-4 shrink-0 opacity-50">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[200px]" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              key="none"
              value="none"
              onSelect={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
              --None--
            </CommandItem>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "cursor-pointer",
                  value === option.value ? "bg-accent text-accent-foreground" : ""
                )}
              >
                <div className="flex items-center w-full">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option.label}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
