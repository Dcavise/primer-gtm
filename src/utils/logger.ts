
// Debug mode flag - can be enabled via localStorage or environment variable
let isDebugMode = false;

// Initialize debug mode from localStorage if available
try {
  isDebugMode = localStorage.getItem('debug_mode') === 'true' || 
                process.env.NODE_ENV === 'development';
} catch (e) {
  // Fallback if localStorage is not available (e.g., SSR)
  isDebugMode = process.env.NODE_ENV === 'development';
}

/**
 * Logger utility for consistent debugging across the application
 */
export const logger = {
  /**
   * Check if debug mode is enabled
   */
  isDebugMode: () => isDebugMode,
  
  /**
   * Enable debug mode
   */
  enableDebugMode: () => {
    isDebugMode = true;
    try {
      localStorage.setItem('debug_mode', 'true');
    } catch (e) {
      console.warn('Could not save debug mode to localStorage');
    }
  },
  
  /**
   * Disable debug mode
   */
  disableDebugMode: () => {
    isDebugMode = false;
    try {
      localStorage.setItem('debug_mode', 'false');
    } catch (e) {
      console.warn('Could not save debug mode to localStorage');
    }
  },
  
  /**
   * Toggle debug mode
   */
  toggleDebugMode: () => {
    if (isDebugMode) {
      logger.disableDebugMode();
    } else {
      logger.enableDebugMode();
    }
    return isDebugMode;
  },
  
  /**
   * Log info messages (only in debug mode)
   */
  info: (message: string, ...data: any[]) => {
    if (isDebugMode) {
      console.info(`[INFO] ${message}`, ...data);
    }
  },
  
  /**
   * Log warning messages (only in debug mode)
   */
  warn: (message: string, ...data: any[]) => {
    if (isDebugMode) {
      console.warn(`[WARN] ${message}`, ...data);
    }
  },
  
  /**
   * Log error messages (always logged)
   */
  error: (message: string, ...data: any[]) => {
    console.error(`[ERROR] ${message}`, ...data);
  },
  
  /**
   * Log debug messages (only in debug mode)
   */
  debug: (message: string, ...data: any[]) => {
    if (isDebugMode) {
      console.debug(`[DEBUG] ${message}`, ...data);
    }
  },
  
  /**
   * Log an object with pretty formatting (only in debug mode)
   */
  logObject: (label: string, obj: any) => {
    if (isDebugMode) {
      console.groupCollapsed(`[OBJECT] ${label}`);
      console.dir(obj);
      console.groupEnd();
    }
  },
  
  /**
   * Start a timer for performance measurement (only in debug mode)
   */
  timeStart: (label: string) => {
    if (isDebugMode) {
      console.time(`[TIMER] ${label}`);
    }
  },
  
  /**
   * End a timer and log the duration (only in debug mode)
   */
  timeEnd: (label: string) => {
    if (isDebugMode) {
      console.timeEnd(`[TIMER] ${label}`);
    }
  }
};
