import { toast } from 'sonner';
import { logger } from './logger';

/**
 * Error types for consistent handling
 */
export enum ErrorType {
  Validation = 'VALIDATION',
  Database = 'DATABASE',
  Network = 'NETWORK',
  Authentication = 'AUTHENTICATION',
  Authorization = 'AUTHORIZATION',
  NotFound = 'NOT_FOUND',
  Unknown = 'UNKNOWN',
}

/**
 * Structured error interface
 */
export interface AppError {
  type: ErrorType;
  message: string;
  original?: unknown;
  context?: Record<string, unknown>;
}

/**
 * Create a structured error object
 */
export function createError(
  type: ErrorType,
  message: string,
  original?: unknown,
  context?: Record<string, unknown>
): AppError {
  return {
    type,
    message,
    original,
    context,
  };
}

/**
 * Handle an error consistently with optional notification
 */
export function handleError(
  error: unknown,
  notifyUser = true,
  context?: Record<string, unknown>
): AppError {
  let appError: AppError;

  // Normalize the error to our AppError format
  if (typeof error === 'string') {
    appError = createError(ErrorType.Unknown, error);
  } else if (error instanceof Error) {
    appError = createError(ErrorType.Unknown, error.message, error);
  } else if ((error as any)?.code && (error as any)?.message) {
    // Handle database/API errors
    const code = (error as any).code.toString();
    let type = ErrorType.Unknown;
    
    if (code.startsWith('22') || code.startsWith('23')) {
      type = ErrorType.Validation;
    } else if (code.startsWith('28')) {
      type = ErrorType.Authorization;
    } else if (code.startsWith('42')) {
      type = ErrorType.Database;
    } else if (code === '404') {
      type = ErrorType.NotFound;
    } else if (code === '401' || code === '403') {
      type = ErrorType.Authentication;
    }
    
    appError = createError(type, (error as any).message, error);
  } else {
    appError = createError(ErrorType.Unknown, 'An unknown error occurred', error);
  }

  // Add additional context
  if (context) {
    appError.context = { ...appError.context, ...context };
  }

  // Log the error based on severity
  switch (appError.type) {
    case ErrorType.Authentication:
    case ErrorType.Authorization:
      logger.auth(`${appError.type} error: ${appError.message}`, appError);
      break;
    case ErrorType.Database:
    case ErrorType.Network:
    case ErrorType.Unknown:
      logger.error(`${appError.type} error: ${appError.message}`, appError);
      break;
    default:
      logger.warn(`${appError.type} error: ${appError.message}`, appError);
  }

  // Notify user if requested
  if (notifyUser) {
    let toastMessage = appError.message;
    
    // Make user-facing messages more friendly
    if (appError.type === ErrorType.Network) {
      toastMessage = 'Network error. Please check your connection and try again.';
    } else if (appError.type === ErrorType.Database) {
      toastMessage = 'Database error. Please try again later.';
    } else if (appError.type === ErrorType.Authentication) {
      toastMessage = 'Your session has expired. Please log in again.';
    }
    
    toast.error(toastMessage);
  }

  return appError;
}

/**
 * Try to execute a function and handle any errors consistently
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage = 'An error occurred',
  notifyUser = true,
  context?: Record<string, unknown>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, notifyUser, { ...context, message: errorMessage });
    return null;
  }
}