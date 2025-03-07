// This file serves as a central export point for the Supabase client
// to avoid path resolution issues in Vercel

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase/types';
import { logger } from '@/utils/logger';

// Ensure environment variables are properly loaded with fallbacks
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY || "";

// Validate that we have the required environment variables
if (!SUPABASE_URL) {
  throw new Error("VITE_SUPABASE_URL is required. Make sure it's set in your .env file.");
}

if (!SUPABASE_ANON_KEY) {
  throw new Error("VITE_SUPABASE_ANON_KEY is required. Make sure it's set in your .env file.");
}

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

// Create the Supabase clients
const regularClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = SUPABASE_SERVICE_KEY ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

/**
 * Class that provides unified access to the Supabase client
 * with additional helper methods
 */
class SupabaseUnifiedClient {
  public readonly regular: SupabaseClient<Database>;
  public readonly admin: SupabaseClient<Database> | null;

  constructor() {
    this.regular = regularClient;
    this.admin = adminClient;
    
    logger.info('Supabase client initialized');
  }

  /**
   * Check if admin access is configured
   */
  public hasAdminAccess(): boolean {
    return this.admin !== null;
  }

  /**
   * Proxy method to access the regular client's from method
   */
  public from(table: any) {
    return this.regular.from(table);
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
        logger.error(`Error executing RPC function ${functionName}:`, error);
        return { success: false, data: null, error: error.message };
      }
      
      return { success: true, data, error: null };
    } catch (err: any) {
      logger.error(`Exception executing RPC function ${functionName}:`, err);
      return { success: false, data: null, error: err.message };
    }
  }
  
  /**
   * Queries Salesforce data through RPC
   * @param tableName The Salesforce table name to query
   * @param limit Maximum number of records to return
   * @returns Query result with success status
   */
  public async querySalesforceTable(tableName: string, limit: number = 10) {
    if (!tableName) {
      logger.error('Invalid table name provided to querySalesforceTable');
      return { success: false, data: null, error: 'Invalid table name' };
    }
    
    return this.executeRPC('query_salesforce_table', { table_name: tableName, limit });
  }
  
  /**
   * Tests database connection and schema access
   */
  public async testConnection() {
    try {
      // Test public schema access
      const { error: publicError } = await this.regular.from('campuses').select('campus_id').limit(1);
      
      // Test fivetran_views schema access
      const { error: fivetranError } = await this.executeRPC('test_salesforce_connection');
      
      return {
        success: true,
        publicSchema: !publicError,
        fivetranViewsSchema: !fivetranError
      };
    } catch (err) {
      logger.error('Error testing connection:', err);
      return {
        success: false,
        publicSchema: false,
        fivetranViewsSchema: false
      };
    }
  }
}

// Export a singleton instance
export const supabase = new SupabaseUnifiedClient();

// Export the admin client directly for convenience
export const supabaseAdminClient = supabase.admin;

// Export a function to check if admin access is available
export const hasAdminAccess = () => supabase.hasAdminAccess(); 