/**
 * A utility hook that always returns false for developer mode status
 * This is a replacement for the previous developer mode functionality
 *
 * @param resetFunction - Function to reset the data state (not used)
 * @return Object with utility functions and state for dev mode
 */
export function useDeveloperModeData(_resetFunction?: () => void) {
  // Always returns false for isDeveloperMode
  const isDeveloperMode = false;

  /**
   * Dummy function that throws an error when developer mode is disabled
   */
  const getMockDataWithDelay = async <T>(
    _dataType: string,
    _delayMs = 800,
    _successMessage?: string,
  ): Promise<T> => {
    throw new Error("Developer mode is disabled");
  };

  /**
   * Always returns false since developer mode is disabled
   */
  const shouldUseMockData = (_operationLabel?: string): boolean => {
    return false;
  };

  return {
    isDeveloperMode,
    getMockDataWithDelay,
    shouldUseMockData,
  };
}

/**
 * Simple hook that always returns false for developer mode
 * Use this instead of the previous DeveloperModeContext hook
 */
export function useDeveloperMode() {
  return { isDeveloperMode: false };
}
