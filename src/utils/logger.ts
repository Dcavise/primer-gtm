// Set debug mode based on environment, disabled in all environments
const isDebugMode = false;

// Maximum number of logs to keep in localStorage
const MAX_PERSISTENT_LOGS = 100;

// Log levels
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  AUTH = 4 // Special level for authentication issues
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

/**
 * Save a log entry to localStorage for persistence
 */
const savePersistentLog = (level: LogLevel, message: string, data?: any) => {
  try {
    // Only persist warnings, errors, and auth logs
    if (level < LogLevel.WARN) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = { timestamp, level, message, data };
    
    // Get existing logs
    const existingLogsJson = localStorage.getItem('app_logs') || '[]';
    let logs: LogEntry[] = [];
    
    try {
      logs = JSON.parse(existingLogsJson);
    } catch (e) {
      // If parsing fails, start with empty array
      logs = [];
    }
    
    // Add new log and trim if needed
    logs.push(logEntry);
    if (logs.length > MAX_PERSISTENT_LOGS) {
      logs = logs.slice(-MAX_PERSISTENT_LOGS);
    }
    
    // Save back to localStorage
    localStorage.setItem('app_logs', JSON.stringify(logs));
  } catch (e) {
    // Fail silently if localStorage is not available
    console.error('Failed to save log to localStorage:', e);
  }
};

/**
 * Logger utility for consistent debugging across the application
 */
export const logger = {
  /**
   * Check if debug mode is enabled
   */
  isDebugMode: () => isDebugMode,
  
  /**
   * Get all persistent logs
   */
  getPersistentLogs: (): LogEntry[] => {
    try {
      const logsJson = localStorage.getItem('app_logs') || '[]';
      return JSON.parse(logsJson);
    } catch (e) {
      console.error('Failed to retrieve logs from localStorage:', e);
      return [];
    }
  },
  
  /**
   * Clear all persistent logs
   */
  clearPersistentLogs: () => {
    try {
      localStorage.removeItem('app_logs');
    } catch (e) {
      console.error('Failed to clear logs from localStorage:', e);
    }
  },
  
  /**
   * Log info messages (only in debug mode)
   */
  info: (message: string, ...data: any[]) => {
    if (isDebugMode) {
      console.info(`[INFO] ${message}`, ...data);
    }
    savePersistentLog(LogLevel.INFO, message, data.length > 0 ? data : undefined);
  },
  
  /**
   * Log warning messages (only in debug mode)
   */
  warn: (message: string, ...data: any[]) => {
    if (isDebugMode) {
      console.warn(`[WARN] ${message}`, ...data);
    }
    savePersistentLog(LogLevel.WARN, message, data.length > 0 ? data : undefined);
  },
  
  /**
   * Log error messages (always logged)
   */
  error: (message: string, ...data: any[]) => {
    console.error(`[ERROR] ${message}`, ...data);
    savePersistentLog(LogLevel.ERROR, message, data.length > 0 ? data : undefined);
  },
  
  /**
   * Log authentication-related messages (always logged and persisted)
   */
  auth: (message: string, ...data: any[]) => {
    console.error(`[AUTH] ${message}`, ...data);
    savePersistentLog(LogLevel.AUTH, message, data.length > 0 ? data : undefined);
  },
  
  /**
   * Log debug messages (only in debug mode)
   */
  debug: (message: string, ...data: any[]) => {
    if (isDebugMode) {
      console.debug(`[DEBUG] ${message}`, ...data);
    }
    savePersistentLog(LogLevel.DEBUG, message, data.length > 0 ? data : undefined);
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
