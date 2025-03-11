import { supabase } from "@/integrations/supabase-client";
import { logger } from "@/utils/logger";

/**
 * Database Operations Utility
 *
 * This utility provides methods for executing SQL queries against the Supabase database,
 * supporting both read-only and data modification operations.
 */

// Types for query results
export interface QueryResult<T = any> {
  success: boolean;
  data: T | null;
  error: Error | null;
  executionTime?: number;
  rowCount?: number;
  affectedRows?: number;
}

// Database operation modes
export enum DatabaseMode {
  SAFE = "safe",
  UNSAFE = "unsafe",
}

// Current database mode state
let currentMode: DatabaseMode = DatabaseMode.SAFE;

/**
 * Get the current database mode
 * @returns The current database mode (safe or unsafe)
 */
export const getDatabaseMode = (): DatabaseMode => {
  return currentMode;
};

/**
 * Enable unsafe mode for database operations
 * @returns Result with success status
 */
export const enableUnsafeMode = async (): Promise<QueryResult<boolean>> => {
  try {
    const startTime = performance.now();
    logger.info("Enabling unsafe mode for database operations");

    const { data, error } = await supabase.rpc("live_dangerously", {
      service: "database",
      enable: true,
    });

    const endTime = performance.now();

    if (error) {
      logger.error("Error enabling unsafe mode:", error);
      return {
        success: false,
        data: null,
        error,
        executionTime: Math.round(endTime - startTime),
      };
    }

    currentMode = DatabaseMode.UNSAFE;

    return {
      success: true,
      data: true,
      error: null,
      executionTime: Math.round(endTime - startTime),
    };
  } catch (error) {
    logger.error("Error in enableUnsafeMode:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Disable unsafe mode for database operations
 * @returns Result with success status
 */
export const disableUnsafeMode = async (): Promise<QueryResult<boolean>> => {
  try {
    const startTime = performance.now();
    logger.info("Disabling unsafe mode for database operations");

    const { data, error } = await supabase.rpc("live_dangerously", {
      service: "database",
      enable: false,
    });

    const endTime = performance.now();

    if (error) {
      logger.error("Error disabling unsafe mode:", error);
      return {
        success: false,
        data: null,
        error,
        executionTime: Math.round(endTime - startTime),
      };
    }

    currentMode = DatabaseMode.SAFE;

    return {
      success: true,
      data: true,
      error: null,
      executionTime: Math.round(endTime - startTime),
    };
  } catch (error) {
    logger.error("Error in disableUnsafeMode:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Execute a read-only SQL query (SELECT)
 * @param query The SQL query to execute
 * @param params Optional parameters for the query
 * @returns Query result with success status
 */
export const executeReadQuery = async <T = any>(
  query: string,
  params: any[] = [],
): Promise<QueryResult<T[]>> => {
  try {
    const startTime = performance.now();
    logger.info(
      `Executing read query: ${query.substring(0, 100)}${query.length > 100 ? "..." : ""}`,
    );

    if (!query.trim().toLowerCase().startsWith("select")) {
      return {
        success: false,
        data: null,
        error: new Error("Only SELECT queries are allowed for read operations"),
        executionTime: 0,
      };
    }

    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: query,
      query_params: params,
    });

    const endTime = performance.now();

    if (error) {
      logger.error("Error executing read query:", error);
      return {
        success: false,
        data: null,
        error,
        executionTime: Math.round(endTime - startTime),
      };
    }

    return {
      success: true,
      data: data as T[],
      error: null,
      rowCount: Array.isArray(data) ? data.length : 0,
      executionTime: Math.round(endTime - startTime),
    };
  } catch (error) {
    logger.error("Error in executeReadQuery:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      executionTime: 0,
    };
  }
};

/**
 * Execute a data modification query (INSERT, UPDATE, DELETE)
 * @param query The SQL query to execute
 * @param params Optional parameters for the query
 * @param autoEnableUnsafe Whether to automatically enable unsafe mode if needed
 * @returns Query result with success status
 */
export const executeWriteQuery = async <T = any>(
  query: string,
  params: any[] = [],
  autoEnableUnsafe: boolean = false,
): Promise<QueryResult<T>> => {
  try {
    const startTime = performance.now();
    logger.info(
      `Executing write query: ${query.substring(0, 100)}${query.length > 100 ? "..." : ""}`,
    );

    const queryLower = query.trim().toLowerCase();
    const isModification =
      queryLower.startsWith("insert") ||
      queryLower.startsWith("update") ||
      queryLower.startsWith("delete");

    if (!isModification) {
      return {
        success: false,
        data: null,
        error: new Error(
          "Only INSERT, UPDATE, DELETE queries are allowed for write operations",
        ),
        executionTime: 0,
      };
    }

    // Check if unsafe mode is enabled
    if (currentMode !== DatabaseMode.UNSAFE) {
      if (autoEnableUnsafe) {
        // Enable unsafe mode automatically
        const enableResult = await enableUnsafeMode();
        if (!enableResult.success) {
          return {
            success: false,
            data: null,
            error: new Error(
              `Failed to enable unsafe mode: ${enableResult.error?.message}`,
            ),
            executionTime: enableResult.executionTime || 0,
          };
        }
      } else {
        return {
          success: false,
          data: null,
          error: new Error(
            "Unsafe mode must be enabled for write operations. Use enableUnsafeMode() first or set autoEnableUnsafe to true.",
          ),
          executionTime: 0,
        };
      }
    }

    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: query,
      query_params: params,
    });

    const endTime = performance.now();

    if (error) {
      logger.error("Error executing write query:", error);
      return {
        success: false,
        data: null,
        error,
        executionTime: Math.round(endTime - startTime),
      };
    }

    // Try to determine affected rows
    let affectedRows = 0;
    if (data && typeof data === "object") {
      if ("count" in data) {
        affectedRows = Number(data.count);
      } else if (Array.isArray(data) && data.length > 0 && "count" in data[0]) {
        affectedRows = Number(data[0].count);
      }
    }

    return {
      success: true,
      data: data as T,
      error: null,
      affectedRows,
      executionTime: Math.round(endTime - startTime),
    };
  } catch (error) {
    logger.error("Error in executeWriteQuery:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      executionTime: 0,
    };
  }
};

/**
 * Execute a DDL query (CREATE, ALTER, DROP) with explicit transaction control
 * @param queries Array of SQL queries to execute in a transaction
 * @param autoEnableUnsafe Whether to automatically enable unsafe mode if needed
 * @returns Query result with success status
 */
export const executeDDLTransaction = async <T = any>(
  queries: string[],
  autoEnableUnsafe: boolean = false,
): Promise<QueryResult<T>> => {
  try {
    const startTime = performance.now();
    logger.info(`Executing DDL transaction with ${queries.length} queries`);

    // Validate that we have at least one query
    if (!queries.length) {
      return {
        success: false,
        data: null,
        error: new Error("No queries provided for transaction"),
        executionTime: 0,
      };
    }

    // Check if queries contain DDL statements
    const containsDDL = queries.some((query) => {
      const queryLower = query.trim().toLowerCase();
      return (
        queryLower.startsWith("create") ||
        queryLower.startsWith("alter") ||
        queryLower.startsWith("drop")
      );
    });

    if (!containsDDL) {
      return {
        success: false,
        data: null,
        error: new Error(
          "Transaction must contain at least one DDL statement (CREATE, ALTER, DROP)",
        ),
        executionTime: 0,
      };
    }

    // Check if unsafe mode is enabled
    if (currentMode !== DatabaseMode.UNSAFE) {
      if (autoEnableUnsafe) {
        // Enable unsafe mode automatically
        const enableResult = await enableUnsafeMode();
        if (!enableResult.success) {
          return {
            success: false,
            data: null,
            error: new Error(
              `Failed to enable unsafe mode: ${enableResult.error?.message}`,
            ),
            executionTime: enableResult.executionTime || 0,
          };
        }
      } else {
        return {
          success: false,
          data: null,
          error: new Error(
            "Unsafe mode must be enabled for DDL operations. Use enableUnsafeMode() first or set autoEnableUnsafe to true.",
          ),
          executionTime: 0,
        };
      }
    }

    // Wrap queries in a transaction
    const transactionQuery = ["BEGIN;", ...queries, "COMMIT;"].join("\n");

    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: transactionQuery,
      query_params: [],
    });

    const endTime = performance.now();

    if (error) {
      logger.error("Error executing DDL transaction:", error);
      return {
        success: false,
        data: null,
        error,
        executionTime: Math.round(endTime - startTime),
      };
    }

    return {
      success: true,
      data: data as T,
      error: null,
      executionTime: Math.round(endTime - startTime),
    };
  } catch (error) {
    logger.error("Error in executeDDLTransaction:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      executionTime: 0,
    };
  }
};

/**
 * Execute a raw SQL query with automatic detection of query type
 * This is a convenience method that automatically determines the appropriate execution method
 * based on the query type (SELECT, INSERT/UPDATE/DELETE, or DDL).
 *
 * @param query The SQL query to execute
 * @param params Optional parameters for the query
 * @param options Additional options for query execution
 * @returns Query result with success status
 */
export const executeSQL = async <T = any>(
  query: string,
  params: any[] = [],
  options: {
    autoEnableUnsafe?: boolean;
    forceTransaction?: boolean;
  } = {},
): Promise<QueryResult<T>> => {
  const { autoEnableUnsafe = false, forceTransaction = false } = options;

  // Trim the query and convert to lowercase for analysis
  const trimmedQuery = query.trim();
  const queryLower = trimmedQuery.toLowerCase();

  // Determine query type
  if (queryLower.startsWith("select")) {
    // Read query
    return executeReadQuery<T[]>(query, params) as unknown as QueryResult<T>;
  } else if (
    queryLower.startsWith("insert") ||
    queryLower.startsWith("update") ||
    queryLower.startsWith("delete")
  ) {
    // Write query
    return executeWriteQuery<T>(query, params, autoEnableUnsafe);
  } else if (
    queryLower.startsWith("create") ||
    queryLower.startsWith("alter") ||
    queryLower.startsWith("drop") ||
    forceTransaction
  ) {
    // DDL query or forced transaction
    return executeDDLTransaction<T>([query], autoEnableUnsafe);
  } else {
    // Unknown query type
    return {
      success: false,
      data: null,
      error: new Error(
        "Unsupported query type. Query must start with SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, or DROP.",
      ),
      executionTime: 0,
    };
  }
};

/**
 * Database utility object that provides a more convenient interface for database operations
 */
export const db = {
  /**
   * Execute a read-only SQL query (SELECT)
   */
  select: executeReadQuery,

  /**
   * Execute a data modification query (INSERT, UPDATE, DELETE)
   */
  modify: executeWriteQuery,

  /**
   * Execute a DDL query (CREATE, ALTER, DROP) with explicit transaction control
   */
  ddl: executeDDLTransaction,

  /**
   * Execute a raw SQL query with automatic detection of query type
   */
  execute: executeSQL,

  /**
   * Enable unsafe mode for database operations
   */
  enableUnsafeMode,

  /**
   * Disable unsafe mode for database operations
   */
  disableUnsafeMode,

  /**
   * Get the current database mode
   */
  getMode: getDatabaseMode,

  /**
   * Database operation modes
   */
  mode: DatabaseMode,
};
