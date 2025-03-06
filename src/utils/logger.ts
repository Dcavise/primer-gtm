// Set debug mode based on environment
const isDebugMode = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Logger utility for consistent debugging across the application
 */
export const logger = {
  /**
   * Check if debug mode is enabled
   */
  isDebugMode: () => isDebugMode,
  
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
