import React, { forwardRef } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

// Safer version of Command that handles undefined items
const SafeCommand = forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, children, ...props }, ref) => {
  // Create a safe wrapper for children to prevent undefined items
  const safeChildren = React.useMemo(() => {
    // If children is undefined or null, return an empty array
    if (!children) return [];

    // If children is already an array, filter out undefined/null items
    if (Array.isArray(children)) {
      return children.filter((child) => child != null);
    }

    // Otherwise, just return the single child in an array
    return [children];
  }, [children]);

  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    >
      <div className="flex flex-col overflow-hidden p-1">{safeChildren}</div>
    </CommandPrimitive>
  );
});

SafeCommand.displayName = "SafeCommand";

// Export the safe version along with the original components
export {
  SafeCommand,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
