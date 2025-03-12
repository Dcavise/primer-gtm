import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { logger } from "@/utils/logger";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://pudncilureqpzxrxfupr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY || "";

// Type augmentation for the RPC functions
declare module "@supabase/supabase-js" {
  interface SupabaseClient<Database> {
    rpc(
      fn: "execute_sql_query" | "get_weekly_lead_counts" | "query_salesforce_table" | string,
      params?: Record<string, any>
    ): any;
  }
}

/**
 * Unified Supabase Client that handles both regular and admin access
 */
class SupabaseUnifiedClient {
  public readonly regular: SupabaseClient<Database>;
  public readonly admin: SupabaseClient<Database>;
  private isAdminConfigured: boolean;

  constructor() {
    // Initialize regular client with anonymous key
    this.regular = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          "x-client-info": "primer-analytics-dashboard",
        },
      },
      db: {
        schema: "fivetran_views",
      },
    });

    // Initialize admin client with service role key
    this.isAdminConfigured = !!SUPABASE_SERVICE_KEY;
    this.admin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-client-info": "primer-analytics-dashboard-admin",
        },
      },
      db: {
        schema: "fivetran_views",
      },
    });
  }

  /**
   * Checks if the admin client is properly configured
   */
  public hasAdminAccess(): boolean {
    return this.isAdminConfigured;
  }

  /**
   * Queries Salesforce data with automatic fallback from regular client to admin client
   * @param tableName The Salesforce table name to query (e.g., 'lead', 'contact')
   * @param limit Maximum number of records to return
   * @returns Query result with success status
   */
  public async querySalesforceTable(tableName: string, limit: number = 10) {
    try {
      // First try with regular client using the RPC function
      const { data: regularData, error: regularError } = await this.regular.rpc(
        "query_salesforce_table",
        { table_name: tableName, limit_count: limit }
      );

      if (!regularError && regularData) {
        return { success: true, data: regularData, error: null };
      }

      logger.info("Regular client failed to query Salesforce table, trying admin client...");

      // Try admin client as fallback
      if (this.hasAdminAccess()) {
        const { data: adminData, error: adminError } = await this.admin.rpc(
          "query_salesforce_table",
          { table_name: tableName, limit_count: limit }
        );

        if (!adminError && adminData) {
          return {
            success: true,
            data: adminData,
            error: null,
            usingAdminClient: true,
          };
        }

        return {
          success: false,
          data: null,
          error: adminError || new Error("Admin client failed to query Salesforce table"),
        };
      }

      return {
        success: false,
        data: null,
        error:
          regularError ||
          new Error("Failed to query Salesforce table and admin client not available"),
      };
    } catch (error) {
      logger.error("Error in querySalesforceTable:", error);
      return { success: false, data: null, error };
    }
  }

  /**
   * Executes an RPC function with automatic fallback
   * @param functionName The RPC function name
   * @param params The function parameters
   * @returns RPC result with success status
   */
  public async executeRPC(functionName: string, params: Record<string, any> = {}) {
    try {
      // First try with regular client
      const { data: regularData, error: regularError } = await this.regular.rpc(
        functionName,
        params
      );

      if (!regularError) {
        return { success: true, data: regularData, error: null };
      }

      logger.info(`Regular client failed to execute RPC ${functionName}, trying admin client...`);

      // Try admin client as fallback
      if (this.hasAdminAccess()) {
        const { data: adminData, error: adminError } = await this.admin.rpc(functionName, params);

        if (!adminError) {
          return {
            success: true,
            data: adminData,
            error: null,
            usingAdminClient: true,
          };
        }

        return {
          success: false,
          data: null,
          error: adminError || new Error(`Admin client failed to execute RPC ${functionName}`),
        };
      }

      return {
        success: false,
        data: null,
        error:
          regularError ||
          new Error(`Failed to execute RPC ${functionName} and admin client not available`),
      };
    } catch (error) {
      logger.error(`Error in executeRPC (${functionName}):`, error);
      return { success: false, data: null, error };
    }
  }

  /**
   * Tests connection to database and schema access
   */
  public async testConnection() {
    try {
      // Test public schema access with regular client
      const { data: publicData, error: publicError } = await this.regular
        .from("campuses")
        .select("count")
        .limit(1);

      const publicSchemaAccess = !publicError;

      // Test fivetran_views schema access with regular client first
      let fivetranAccess = false;
      let usedAdminClient = false;

      try {
        const { success, error } = await this.executeRPC("test_salesforce_connection");
        fivetranAccess = success;
      } catch (error) {
        logger.warn("Regular client test_salesforce_connection failed:", error);

        // Try admin client if available
        if (this.hasAdminAccess()) {
          try {
            const result = await this.admin.rpc("execute_sql_query", {
              query_text:
                "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'fivetran_views')",
            });

            fivetranAccess =
              !result.error && result.data && result.data[0] && result.data[0].exists;
            usedAdminClient = true;
          } catch (adminError) {
            logger.error("Admin client fivetran_views schema check failed:", adminError);
          }
        }
      }

      return {
        success: publicSchemaAccess,
        publicSchema: publicSchemaAccess,
        fivetranViewsSchema: fivetranAccess,
        usedAdminClient,
      };
    } catch (error) {
      logger.error("Error in testConnection:", error);
      return { success: false, error };
    }
  }
}

// Export singleton instance
export const supabase = new SupabaseUnifiedClient();

// Backwards compatibility for direct client access
export const supabaseClient = supabase.regular;
