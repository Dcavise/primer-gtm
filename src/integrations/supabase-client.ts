// This file serves as a central export point for the Supabase client
// to avoid path resolution issues in Vercel

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase/types';
import { logger } from '@/utils/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pudncilureqpzxrxfupr.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY || "";

// Type augmentation for the RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc(
      fn: 'execute_sql_query' | 'get_weekly_lead_counts' | 'query_salesforce_table' | string,
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
    this.regular = createClient<Database>(
      SUPABASE_URL, 
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
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
}

// Export a singleton instance
export const supabase = new SupabaseUnifiedClient();

// Export the admin client directly for convenience
export const adminClient = supabase.admin;

// Export a function to check if admin access is available
export const hasAdminAccess = () => supabase.hasAdminAccess(); 