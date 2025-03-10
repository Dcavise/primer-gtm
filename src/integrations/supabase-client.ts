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

// Family search result interface with standardized IDs
export interface FamilySearchResult {
  standard_id: string;
  family_id: string;
  alternate_id: string;
  family_name: string;
  current_campus_c: string;
  contact_count: number;
  opportunity_count: number;
}

// Generic response type for operations
export interface OperationResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Type augmentation for the RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database> {
    rpc<T = unknown>(
      fn: 'execute_sql_query' | 'get_weekly_lead_counts' | 'query_salesforce_table' | 'test_salesforce_connection' | 'fivetran_views.search_families' | 'fivetran_views.search_families_consistent' | 'fivetran_views.get_family_by_standard_id' | string,
      params?: Record<string, unknown>
    ): Promise<{data: T | null; error: Error | null}>;
  }
}

// Create the Supabase clients
const regularClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = SUPABASE_SERVICE_KEY ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

/**
 * Class that provides unified access to the Supabase client
 * with additional helper methods
 */
export
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
   * Note: This is a simplified version that may not handle all table types
   * For schema-qualified tables, use direct SQL queries instead
   */
  public from(table: Parameters<typeof this.regular.from>[0]) {
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
  public rpc<T = unknown>(fn: string, params?: Record<string, unknown>) {
    return this.regular.rpc<T>(fn, params);
  }
  
  /**
   * Execute an RPC function with better error handling
   * @param functionName The name of the RPC function to call
   * @param params Parameters to pass to the function
   * @param schema Optional schema name to qualify the function with
   * @returns Result with success status
   */
  public async executeRPC<T = unknown>(functionName: string, params: Record<string, unknown> = {}, schema?: string): Promise<OperationResponse<T>> {
    try {
      let fullFunctionName = functionName;
      
      // Apply schema if provided
      if (schema) {
        fullFunctionName = `${schema}.${functionName}`;
        logger.debug(`Using schema-qualified function: ${fullFunctionName}`);
      }
      
      // Direct RPC approach
      try {
        const { data, error } = await this.regular.rpc<T>(fullFunctionName, params);
        
        if (error) {
          // If we get an error about missing function in public schema, it means
          // Supabase is still trying to prefix with public.
          if (error.message && error.message.includes('public') && schema) {
            logger.warn(`Supabase tried to use public schema when we specified ${schema}. Trying direct SQL...`);
            throw new Error('Schema prefix issue detected');
          }
          
          logger.error(`Error executing RPC function ${fullFunctionName}:`, error);
          return { success: false, data: null, error: error.message };
        }
        
        return { success: true, data, error: null };
      } catch (rpcErr) {
        // If we're here and we have a schema, try direct SQL query as a fallback
        if (schema) {
          logger.warn(`RPC call to ${fullFunctionName} failed. Attempting direct SQL query...`);
          
          // Construct a direct SQL query to call the function
          const sqlParams = Object.entries(params)
            .map(([key, value]) => {
              // For simplicity, handling just strings and numbers
              const formattedValue = typeof value === 'string' ? `'${value}'` : value;
              return `${key} => ${formattedValue}`;
            })
            .join(', ');
          
          // SQL to call the function directly
          const sql = `SELECT * FROM ${schema}.${functionName}(${sqlParams})`;
          logger.debug(`Executing direct SQL: ${sql}`);
          
          try {
            const { data, error } = await this.regular.rpc<T>('execute_sql_query', {
              query: sql
            });
            
            if (error) {
              logger.error(`Direct SQL query failed:`, error);
              return { success: false, data: null, error: error.message };
            }
            
            return { success: true, data, error: null };
          } catch (sqlErr) {
            // Both approaches failed
            logger.error(`Both RPC and direct SQL approaches failed:`, sqlErr);
            const errorMessage = sqlErr instanceof Error ? sqlErr.message : 'Unknown error';
            return { success: false, data: null, error: errorMessage };
          }
        } else {
          // No schema provided, just return the original error
          const errorMessage = rpcErr instanceof Error ? rpcErr.message : 'Unknown error';
          logger.error(`Exception executing RPC function ${fullFunctionName}:`, rpcErr);
          return { success: false, data: null, error: errorMessage };
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Exception in executeRPC for ${functionName}:`, err);
      return { success: false, data: null, error: errorMessage };
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
  /**
   * Search for families using the existing database schema
   * @param searchTerm The search term to use
   * @returns Array of family search results with standardized IDs added on the client side
   */
  public async searchFamilies(searchTerm: string): Promise<OperationResponse<FamilySearchResult[]>> {
    try {
      logger.info(`Searching for families with term: ${searchTerm}`);
      
      // Use direct SQL query with fivetran_views schema to search families
      // This approach avoids schema prefix issues that occur with regular RPC calls
      const sqlQuery = `
        SELECT 
          family_id,
          family_name,
          pdc_family_id_c, 
          current_campus_c, 
          contact_count, 
          opportunity_count 
        FROM 
          fivetran_views.comprehensive_family_records 
        WHERE 
          family_name ILIKE '%${searchTerm}%' OR 
          current_campus_c ILIKE '%${searchTerm}%' 
        LIMIT 20
      `;
      
      try {
        logger.debug('Executing family search query using execute_sql_query RPC');
        const { data, error } = await this.regular.rpc('execute_sql_query', { query: sqlQuery });
        
        if (error) {
          logger.warn(`Error executing SQL query: ${error.message}`, error);
          throw error;
        }
        
        // Process the results to add standardized IDs
        const processedResults = this.processSearchResults(data as Record<string, unknown>[]);
        logger.debug(`Found ${processedResults.length} families matching '${searchTerm}'`);
        return { success: true, data: processedResults, error: null };
      } catch (rpcError) {
        // Fallback to direct POST request if RPC fails
        logger.warn('RPC execute_sql_query failed, trying direct POST request', rpcError);
        
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql_query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              query: sqlQuery
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            logger.warn(`Error with direct SQL POST: ${response.status} - ${errorText}`);
            throw new Error(`SQL query failed: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          const processedResults = this.processSearchResults(data as Record<string, unknown>[]);
          return { success: true, data: processedResults, error: null };
        } catch (directError) {
          logger.warn('Direct POST request failed', directError);
          throw directError;
        }
      }
    } catch (err: unknown) {
      // Provide detailed error information
      const errorObj = err instanceof Error ? 
        { message: err.message, stack: err.stack, name: err.name } : 
        { error: String(err) };
      
      logger.error('Family search failed:', JSON.stringify(errorObj, null, 2));
      return { success: false, data: [], error: JSON.stringify(errorObj) };
    }
  }
  
  /**
   * Process search results to add standardized IDs
   * @param results Raw results from the database query
   * @returns Processed results with standardized IDs
   */
  private processSearchResults(results: Record<string, unknown>[]): FamilySearchResult[] {
    if (!Array.isArray(results)) {
      logger.warn('Expected array of results but received:', typeof results);
      return [];
    }
    
    return results.map(family => {
      // Log the available IDs for debugging
      logger.debug('Processing family search result:', {
        family_id: family.family_id as string,
        pdc_family_id_c: family.pdc_family_id_c as string | null
      });
      
      return {
        // Add standardized IDs
        standard_id: family.family_id as string,  // Use family_id as standard_id
        family_id: family.family_id as string,    // Keep original family_id
        alternate_id: (family.pdc_family_id_c as string) || null, // Use pdc_family_id_c as alternate_id
        
        // Keep all other fields
        family_name: family.family_name as string,
        current_campus_c: family.current_campus_c as string,
        contact_count: Number(family.contact_count),
        opportunity_count: Number(family.opportunity_count)
      };
    });
  }
  
  /**
   * Fetch a family record by ID using the existing database schema
   * @param familyId The ID of the family to fetch
   * @returns Result with success status and family data
   */
  public async getFamilyRecord(familyId: string): Promise<OperationResponse<Record<string, unknown>>> {
    try {
      if (!familyId) {
        return { success: false, data: null, error: 'No family ID provided' };
      }
      
      logger.debug(`Fetching family record for ID: ${familyId}`);
      
      // Query the comprehensive_family_records table directly
      const query = `
        SELECT * FROM fivetran_views.comprehensive_family_records
        WHERE family_id = '${familyId}' OR pdc_family_id_c = '${familyId}'
        LIMIT 1
      `;
      
      try {
        logger.debug('Executing direct SQL query on comprehensive_family_records');
        const { data, error } = await this.regular.rpc('execute_sql_query', { query });
        
        if (error) {
          logger.error('Failed to fetch family record using SQL query', error);
          return { success: false, data: null, error: error.message };
        }
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
          logger.warn(`No family found with ID: ${familyId}`);
          return { success: false, data: null, error: `Family with ID ${familyId} not found` };
        }
        
        // If data is an array, return the first item
        const familyRecord = Array.isArray(data) ? data[0] : data;
        
        // Add standard ID fields for consistency
        const processedRecord = {
          ...familyRecord,
          standard_id: familyRecord.family_id,
          alternate_id: familyRecord.pdc_family_id_c || null
        };
        
        logger.debug(`Successfully fetched family record for ID: ${familyId}`);
        return { success: true, data: processedRecord, error: null };
      } catch (sqlError) {
        // Try direct POST request if RPC fails
        logger.warn('RPC execute_sql_query failed, trying direct POST request', sqlError);
        
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql_query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              query: query
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            logger.warn(`Error with direct SQL POST: ${response.status} - ${errorText}`);
            throw new Error(`SQL query failed: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          
          if (!data || (Array.isArray(data) && data.length === 0)) {
            return { success: false, data: null, error: `Family with ID ${familyId} not found` };
          }
          
          const familyRecord = Array.isArray(data) ? data[0] : data;
          
          // Add standard ID fields for consistency
          const processedRecord = {
            ...familyRecord,
            standard_id: familyRecord.family_id,
            alternate_id: familyRecord.pdc_family_id_c || null
          };
          
          return { success: true, data: processedRecord, error: null };
        } catch (directError) {
          logger.error('All family record fetch approaches failed', directError);
          throw directError;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Error fetching family record for ID ${familyId}:`, err);
      return { success: false, data: null, error: errorMessage };
    }
  }
  
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

// Types are already exported above

// Export the admin client directly for convenience
export const supabaseAdminClient = supabase.admin;

// Export a function to check if admin access is available
export const hasAdminAccess = () => supabase.hasAdminAccess(); 