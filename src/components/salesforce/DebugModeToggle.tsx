
import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { logger } from '@/utils/logger';

export const DebugModeToggle: React.FC = () => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  
  // Initialize from logger on mount
  useEffect(() => {
    setIsDebugMode(logger.isDebugMode());
  }, []);
  
  const handleToggleDebugMode = () => {
    const newState = logger.toggleDebugMode();
    setIsDebugMode(newState);
    console.log(`Debug mode ${newState ? 'enabled' : 'disabled'}`);
  };
  
  return (
    <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded text-xs">
      <Switch 
        id="debug-mode" 
        checked={isDebugMode}
        onCheckedChange={handleToggleDebugMode}
        size="sm"
      />
      <Label htmlFor="debug-mode" className="text-white text-xs font-mono">
        Debug Mode
      </Label>
    </div>
  );
};
