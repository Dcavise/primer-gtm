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
logger.info('DEVELOPMENT MODE: Using mock data instead of real Supabase API calls');

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
 * Mock Supabase Client that returns fake data instead of making real API calls
 */
class SupabaseUnifiedClient {
  public readonly regular: any;
  public readonly admin: any;
  private isAdminConfigured: boolean = true;

  constructor() {
    // Create mock clients that return fake data
    this.regular = this.createMockClient();
    this.admin = this.createMockClient();
    
    logger.info('Mock Supabase client initialized for development');
  }

  private createMockClient() {
    // Create a mock client with methods that return fake data
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { session: null }, error: null }),
        signUp: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        refreshSession: async () => ({ data: { session: null }, error: null })
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: 'mock-id', name: 'Mock Data' }, error: null })
          }),
          limit: async () => ({ data: [{ id: 'mock-id', name: 'Mock Data' }], error: null })
        }),
        insert: async () => ({ data: { id: 'mock-id' }, error: null }),
        update: async () => ({ data: { id: 'mock-id' }, error: null }),
        delete: async () => ({ data: { id: 'mock-id' }, error: null })
      }),
      rpc: async (fn: string) => {
        logger.info(`Mock RPC call to ${fn}`);
        return { data: { success: true, message: 'Mock RPC response' }, error: null };
      },
      functions: {
        invoke: async () => ({ data: { message: 'Mock function response' }, error: null })
      }
    };
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
    logger.info(`Mock RPC call to ${fn} with params:`, params);
    return { data: { success: true, message: 'Mock RPC response' }, error: null };
  }
  
  /**
   * Execute an RPC function with better error handling
   * @param functionName The name of the RPC function to call
   * @param params Parameters to pass to the function
   * @returns Result with success status
   */
  public async executeRPC(functionName: string, params: Record<string, any> = {}) {
    logger.info(`Mock executeRPC call to ${functionName} with params:`, params);
    return { success: true, data: { message: 'Mock RPC response' }, error: null };
  }
  
  /**
   * Queries Salesforce data through RPC
   * @param tableName The Salesforce table name to query
   * @param limit Maximum number of records to return
   * @returns Query result with success status
   */
  public async querySalesforceTable(tableName: string, limit: number = 10) {
    logger.info(`Mock querySalesforceTable call for ${tableName} with limit ${limit}`);
    return { 
      success: true, 
      data: Array(limit).fill(0).map((_, i) => ({ id: `mock-${i}`, name: `Mock ${tableName} Record ${i}` })), 
      error: null 
    };
  }
  
  /**
   * Tests database connection and schema access
   */
  public async testConnection() {
    logger.info('Mock testConnection call');
    return {
      success: true,
      publicSchema: true,
      fivetranViewsSchema: true
    };
  }
}

// Export a singleton instance
export const supabase = new SupabaseUnifiedClient();

// Export the admin client directly for convenience
export const adminClient = supabase.admin;

// Export a function to check if admin access is available
export const hasAdminAccess = () => supabase.hasAdminAccess(); 