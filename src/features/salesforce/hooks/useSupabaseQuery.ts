import { useState, useCallback } from "react";
import { supabase, OperationResponse } from "@/integrations/supabase-client"; // Import OperationResponse type
import { logger } from "@/utils/logger";

interface UseSupabaseQueryOptions<T> {
  errorHandler?: (error: any) => void;
  mockDataFn?: () => T;
  logTiming?: boolean;
}

/**
 * A base hook for making Supabase queries with consistent error handling and logging
 * @param options Configuration options for the query
 * @returns Query utilities and state
 */
export function useSupabaseQuery<T>(options: UseSupabaseQueryOptions<T> = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback(
    (err: any, context?: string) => {
      const errorMessage = err?.message || String(err);
      logger.error(`Supabase query error${context ? ` (${context})` : ""}:`, err);
      setError(new Error(errorMessage));

      if (options.errorHandler) {
        options.errorHandler(err);
      }
    },
    [options.errorHandler]
  );

  /**
   * Execute a Supabase query with consistent error handling and timing logs
   * @param queryFn Function that executes the Supabase query
   * @param queryName Name of the query for logging
   * @returns Query result or mock data on error
   */
  const executeQuery = useCallback(
    async <R>(
      queryFn: () => Promise<{ data: R | null; error: any }>,
      queryName: string
    ): Promise<R | null> => {
      setLoading(true);
      setError(null);

      try {
        if (options.logTiming) {
          logger.timeStart(`${queryName}`);
        }

        const { data, error } = await queryFn();

        if (options.logTiming) {
          logger.timeEnd(`${queryName}`);
        }

        if (error) {
          handleError(error, queryName);
          return options.mockDataFn ? (options.mockDataFn() as unknown as R) : null;
        }

        return data;
      } catch (err) {
        handleError(err, queryName);
        return options.mockDataFn ? (options.mockDataFn() as unknown as R) : null;
      } finally {
        setLoading(false);
      }
    },
    [handleError, options.logTiming, options.mockDataFn]
  );

  /**
   * Execute an RPC function with the unified supabase client
   * @param functionName RPC function name
   * @param params Function parameters
   * @returns Query result or mock data on error
   */
  const executeRpc = useCallback(
    async <R>(functionName: string, params: Record<string, any> = {}): Promise<R | null> => {
      // First try executeRPC method, falling back if it doesn't exist
      try {
        return executeQuery(
          async () => {
            // Check if executeRPC exists on the supabase object
            if (typeof supabase.executeRPC === 'function') {
              const result = await supabase.executeRPC<R>(functionName, params);
              return result;
            } else {
              // Fallback to using normal rpc method
              logger.warn(`executeRPC method not found, falling back to direct RPC call for ${functionName}`);
              const result = await supabase.rpc<R>(functionName, params);
              return result;
            }
          }, 
          `rpc.${functionName}`
        );
      } catch (err) {
        logger.error(`Error executing RPC ${functionName}:`, err);
        throw err;
      }
    },
    [executeQuery]
  );

  /**
   * Query a table with consistent error handling
   * @param tableName Table to query
   * @param queryBuilder Function that builds the query
   * @returns Query result or mock data on error
   */
  const queryTable = useCallback(
    async <R>(tableName: string, queryBuilder: (query: any) => any): Promise<R | null> => {
      return executeQuery(() => {
        const query = supabase.regular.from(tableName);
        return queryBuilder(query);
      }, `query.${tableName}`);
    },
    [executeQuery]
  );

  return {
    loading,
    error,
    executeQuery,
    executeRpc,
    queryTable,
    handleError,
  };
}
