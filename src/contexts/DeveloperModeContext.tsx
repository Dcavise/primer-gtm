import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface DevModeOptions {
  showDevTools: boolean;
  logDataFetching: boolean;
  simulateNetworkDelay: boolean;
  defaultDelayMs: number;
  useRealDataWhenAvailable: boolean;
}

interface DeveloperModeContextProps {
  isDeveloperMode: boolean;
  toggleDeveloperMode: () => void;
  devModeOptions: DevModeOptions;
  updateDevModeOptions: (options: Partial<DevModeOptions>) => void;
}

// Default options for developer mode
const DEFAULT_DEV_MODE_OPTIONS: DevModeOptions = {
  showDevTools: true,
  logDataFetching: true,
  simulateNetworkDelay: false,
  defaultDelayMs: 800,
  useRealDataWhenAvailable: false,
};

const DeveloperModeContext = createContext<
  DeveloperModeContextProps | undefined
>(undefined);

export const DeveloperModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Load the saved preference from localStorage or default to false
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("developer-mode");
    return saved ? JSON.parse(saved) : false;
  });

  // Load any saved options or use defaults
  const [devModeOptions, setDevModeOptions] = useState<DevModeOptions>(() => {
    const saved = localStorage.getItem("developer-mode-options");
    return saved ? JSON.parse(saved) : DEFAULT_DEV_MODE_OPTIONS;
  });

  // Update options with partial changes
  const updateDevModeOptions = (options: Partial<DevModeOptions>) => {
    setDevModeOptions((prev) => ({ ...prev, ...options }));
  };

  // Save to localStorage whenever the value changes
  useEffect(() => {
    localStorage.setItem("developer-mode", JSON.stringify(isDeveloperMode));
    localStorage.setItem(
      "developer-mode-options",
      JSON.stringify(devModeOptions),
    );

    // Dispatch an event so other components can react to the change
    window.dispatchEvent(
      new CustomEvent("developer-mode-changed", {
        detail: { isDeveloperMode, options: devModeOptions },
      }),
    );

    // Show toast when developer mode is toggled
    if (isDeveloperMode) {
      toast.success("Developer Mode Enabled", {
        description: "Using mock data for all modules",
      });
    } else {
      toast.info("Developer Mode Disabled", {
        description: "Using real data sources",
      });
    }
  }, [isDeveloperMode, devModeOptions]);

  const toggleDeveloperMode = () => {
    setIsDeveloperMode((prev) => !prev);
  };

  return (
    <DeveloperModeContext.Provider
      value={{
        isDeveloperMode,
        toggleDeveloperMode,
        devModeOptions,
        updateDevModeOptions,
      }}
    >
      {children}
    </DeveloperModeContext.Provider>
  );
};

export const useDeveloperMode = () => {
  const context = useContext(DeveloperModeContext);
  if (context === undefined) {
    throw new Error(
      "useDeveloperMode must be used within a DeveloperModeProvider",
    );
  }
  return context;
};
