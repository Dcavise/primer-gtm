import { useEffect } from 'react';
import { toast } from 'sonner';
import { useDeveloperMode } from '@/contexts/DeveloperModeContext';
import { getMockData } from '@/utils/mockData';

/**
 * A utility hook for handling developer mode data fetching
 * This hook simplifies the process of using mock data in developer mode
 * 
 * @param resetFunction - Function to reset the data state
 * @return Object with utility functions and state for dev mode
 */
export function useDeveloperModeData(resetFunction: () => void) {
  const { isDeveloperMode } = useDeveloperMode();
  
  // Setup event listener for dev mode changes
  useEffect(() => {
    const handleDevModeChange = () => {
      resetFunction();
    };
    
    window.addEventListener('developer-mode-changed', handleDevModeChange);
    return () => window.removeEventListener('developer-mode-changed', handleDevModeChange);
  }, [resetFunction]);

  /**
   * Get mock data with a simulated loading delay
   * 
   * @param dataType - The type of mock data to retrieve ('properties', 'schools', etc)
   * @param delayMs - Optional delay in milliseconds to simulate network latency (default 800ms)
   * @param successMessage - Optional custom success message
   * @returns The mock data of the requested type
   */
  const getMockDataWithDelay = async <T>(
    dataType: string, 
    delayMs = 800, 
    successMessage?: string
  ): Promise<T> => {
    if (!isDeveloperMode) {
      throw new Error('Developer mode is not enabled');
    }
    
    console.log(`[DEV MODE] Using mock ${dataType} data`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    const data = getMockData(dataType);
    
    if (successMessage) {
      toast.success(successMessage, {
        description: `Using mock data for ${dataType}`
      });
    }
    
    return data as T;
  };

  /**
   * Check if an operation should use mock data
   * 
   * @param operationLabel - A label for the operation using mock data (for logging)
   * @returns true if should use mock data, false otherwise
   */
  const shouldUseMockData = (operationLabel?: string): boolean => {
    if (isDeveloperMode && operationLabel) {
      console.log(`[DEV MODE] ${operationLabel} will use mock data`);
    }
    return isDeveloperMode;
  };
  
  return {
    isDeveloperMode,
    getMockDataWithDelay,
    shouldUseMockData
  };
} 