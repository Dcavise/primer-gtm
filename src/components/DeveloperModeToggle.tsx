import React from "react";
import { Code2, Code } from "lucide-react";
import { useDeveloperMode } from "@/contexts/DeveloperModeContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Developer Mode Toggle Component
 *
 * Provides a visual toggle for enabling/disabling developer mode
 * When enabled, mock data will be used throughout the application
 */
export const DeveloperModeToggle: React.FC = () => {
  const { isDeveloperMode, toggleDeveloperMode } = useDeveloperMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isDeveloperMode ? "default" : "outline"}
            size="sm"
            onClick={toggleDeveloperMode}
            className={`relative ${isDeveloperMode ? "bg-amber-600 hover:bg-amber-700 text-white" : "text-gray-500"}`}
          >
            {isDeveloperMode ? (
              <>
                <Code2 className="h-4 w-4 mr-1" />
                <span className="text-xs">Dev Mode</span>
              </>
            ) : (
              <>
                <Code className="h-4 w-4 mr-1" />
                <span className="text-xs">Dev Mode</span>
              </>
            )}

            {isDeveloperMode && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {isDeveloperMode
              ? "Disable developer mode (using mock data)"
              : "Enable developer mode to use mock data"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
