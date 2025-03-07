// This file serves as a central export point for the Supabase client
// to avoid path resolution issues in Vercel

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase/types';
import { logger } from '@/utils/logger';

// Ensure environment variables are properly loaded with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pudncilureqpzxrxfupr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY || "";

// Log configuration for debugging
logger.info(`Supabase URL: ${SUPABASE_URL}`);
logger.info(`Supabase Anon Key configured: ${SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);
logger.info(`Supabase Service Key configured: ${SUPABASE_SERVICE_KEY ? 'Yes' : 'No'}`);

// Type augmentation for the RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc(
      fn: 'execute_sql_query' | 'get_weekly_lead_counts' | 'query_salesforce_table' | 'test_salesforce_connection' | string,
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
    try {
      this.regular = createClient<Database>(
        SUPABASE_URL, 
        SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: 'primer-supabase-auth',
            detectSessionInUrl: true,
          },
          global: {
            headers: {
              'x-client-info': 'primer-analytics-dashboard'
            },
          },
          db: {
            schema: 'public',
          },
        }
      );
      
      // Initialize admin client with service role key
      this.isAdminConfigured = !!SUPABASE_SERVICE_KEY;
      this.admin = createClient<Database>(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              'x-client-info': 'primer-analytics-dashboard-admin'
            },
          },
          db: {
            schema: 'public',
          },
        }
      );

      logger.info(`Supabase client initialized. Admin access: ${this.isAdminConfigured ? 'Configured' : 'Not configured'}`);
    } catch (error) {
      logger.error('Error initializing Supabase client:', error);
      throw new Error('Failed to initialize Supabase client. Check your environment variables.');
    }
  }

  /**
   * Check if admin access is configured
   */
  public hasAdminAccess(): boolean {
    return this.isAdminConfigured;
  }

  /**
   * Proxy method to access the regular client's from method
   */
  public from(table: any) {
    return this.regular.from(table as any);
  }
  
  /**
   * Proxy auth property to access the regular client's auth property
   */
  public get auth() {
    return this.regular.auth;
  }

  /**
   * Proxy functions property to access the regular client's functions property
   */
  public get functions() {
    return this.regular.functions;
  }

  /**
   * Proxy rpc method to access the regular client's rpc method
   */
  public rpc(fn: string, params?: Record<string, any>) {
    return this.regular.rpc(fn, params);
  }
  
  /**
   * Execute an RPC function with better error handling
   * @param functionName The name of the RPC function to call
   * @param params Parameters to pass to the function
   * @returns Result with success status
   */
  public async executeRPC(functionName: string, params: Record<string, any> = {}) {
    try {
      const { data, error } = await this.regular.rpc(functionName, params);
      
      if (error) {
        logger.error(`Error in executeRPC (${functionName}):`, error);
        return { success: false, data: null, error };
      }
      
      return { success: true, data, error: null };
    } catch (error) {
      logger.error(`Error in executeRPC (${functionName}):`, error);
      return { success: false, data: null, error };
    }
  }
  
  /**
   * Queries Salesforce data through RPC
   * @param tableName The Salesforce table name to query
   * @param limit Maximum number of records to return
   * @returns Query result with success status
   */
  public async querySalesforceTable(tableName: string, limit: number = 10) {
    try {
      const { data, error } = await this.regular.rpc(
        'query_salesforce_table', 
        { table_name: tableName, limit_count: limit }
      );
      
      if (!error && data) {
        return { success: true, data, error: null };
      }
      
      return { success: false, data: null, error };
    } catch (error) {
      logger.error('Error in querySalesforceTable:', error);
      return { success: false, data: null, error };
    }
  }
  
  /**
   * Tests database connection and schema access
   */
  public async testConnection() {
    try {
      const { data: publicData, error: publicError } = await this.regular
        .from('campuses')
        .select('count')
        .limit(1);
      
      const publicSchemaAccess = !publicError;
      
      // Test fivetran_views schema access
      let fivetranAccess = false;
      
      try {
        const { data, error } = await this.regular.rpc('test_salesforce_connection');
        fivetranAccess = !error && !!data;
      } catch (error) {
        logger.warn('RPC test_salesforce_connection failed:', error);
        fivetranAccess = false;
      }
      
      return {
        success: publicSchemaAccess,
        publicSchema: publicSchemaAccess,
        fivetranViewsSchema: fivetranAccess
      };
    } catch (error) {
      logger.error('Error in testConnection:', error);
      return { success: false, error };
    }
  }
}

// Export a singleton instance
export const supabase = new SupabaseUnifiedClient();

// Export the admin client directly for convenience
export const adminClient = supabase.admin;

// Export a function to check if admin access is available
export const hasAdminAccess = () => supabase.hasAdminAccess(); 