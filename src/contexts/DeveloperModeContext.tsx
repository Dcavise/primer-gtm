import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface DeveloperModeContextProps {
  isDeveloperMode: boolean;
  toggleDeveloperMode: () => void;
}

const DeveloperModeContext = createContext<DeveloperModeContextProps | undefined>(undefined);

export const DeveloperModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load the saved preference from localStorage or default to false
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('developer-mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage whenever the value changes
  useEffect(() => {
    localStorage.setItem('developer-mode', JSON.stringify(isDeveloperMode));
    
    // Dispatch an event so other components can react to the change
    window.dispatchEvent(new CustomEvent('developer-mode-changed', { 
      detail: { isDeveloperMode } 
    }));
    
    // Show toast when developer mode is toggled
    if (isDeveloperMode) {
      toast.success('Developer Mode Enabled', { 
        description: 'Using mock data for all modules' 
      });
    } else {
      toast.info('Developer Mode Disabled', {
        description: 'Using real data sources'
      });
    }
  }, [isDeveloperMode]);

  const toggleDeveloperMode = () => {
    setIsDeveloperMode(prev => !prev);
  };

  return (
    <DeveloperModeContext.Provider value={{ isDeveloperMode, toggleDeveloperMode }}>
      {children}
    </DeveloperModeContext.Provider>
  );
};

export const useDeveloperMode = () => {
  const context = useContext(DeveloperModeContext);
  if (context === undefined) {
    throw new Error('useDeveloperMode must be used within a DeveloperModeProvider');
  }
  return context;
}; 