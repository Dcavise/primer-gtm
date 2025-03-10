import { supabase } from '@/integrations/supabase-client';
import { logger } from '@/utils/logger';

/**
 * A centralized Salesforce data access module that uses the unified Supabase client
 */

// =============================================
// 1. Core Data Access Methods
// =============================================

/**
 * Query any Salesforce table using the unified client
 * @param tableName Table name in fivetran_views schema (e.g., 'lead', 'contact')
 * @param limit Maximum number of records to return
 * @returns Query result with success status
 */
export const querySalesforceTable = async (tableName: string, limit = 100) => {
  logger.info(`Querying salesforce table ${tableName} with limit ${limit}`);
  return await supabase.querySalesforceTable(tableName, limit);
};

/**
 * Get weekly lead count data
 * @param startDate ISO date string for start date
 * @param endDate ISO date string for end date
 * @param campusId Optional campus ID to filter by
 * @returns Weekly lead count data
 */
export const getWeeklyLeadCounts = async (startDate: string, endDate: string, campusId = null) => {
  logger.info(`Fetching weekly lead counts from ${startDate} to ${endDate}, campus ID: ${campusId || 'all'}`);
  return await supabase.executeRPC('get_weekly_lead_counts', {
    start_date: startDate,
    end_date: endDate,
    campus_filter: campusId
  });
};

/**
 * Get daily lead count data
 * @param days Number of days to include in the report
 * @param campusId Optional campus ID to filter by
 * @returns Daily lead count data
 */
export const getDailyLeadCount = async (days = 30, campusId = null) => {
  logger.info(`Fetching daily lead count for past ${days} days, campus ID: ${campusId || 'all'}`);
  return await supabase.executeRPC('get_daily_lead_count', {
    p_days: days,
    p_campus_id: campusId
  });
};

/**
 * Get lead to win conversion metrics
 * @param campusId Optional campus ID to filter by
 * @param months Number of months to include in analysis
 * @returns Lead to win conversion data
 */
export const getLeadToWinConversion = async (campusId = null, months = 12) => {
  logger.info(`Fetching lead to win conversion for past ${months} months, campus ID: ${campusId || 'all'}`);
  return await supabase.executeRPC('get_lead_to_win_conversion', {
    p_campus_id: campusId,
    p_months: months
  });
};

/**
 * Get week over week comparison metrics
 * @param campusId Optional campus ID to filter by
 * @returns Week over week comparison data
 */
export const getWeekOverWeekComparison = async (campusId = null) => {
  logger.info(`Fetching week over week comparison, campus ID: ${campusId || 'all'}`);
  return await supabase.executeRPC('get_week_over_week_comparison', {
    p_campus_id: campusId
  });
};

// =============================================
// 2. Diagnostics and Testing
// =============================================

/**
 * Test database connection and schema access
 * @returns Connection test results with schema access details
 */
export const testConnection = async () => {
  logger.info('Testing Supabase connection and schema access');
  return await supabase.testConnection();
};

/**
 * Troubleshoot schema access issues
 * @returns Detailed information about schema access
 */
export const troubleshootSchemaAccess = async () => {
  logger.info('Troubleshooting schema access issues');
  try {
    // Check for public schema access
    const { data: publicData, error: publicError } = await supabase
      .from('campuses')
      .select('count')
      .limit(1);
    
    const publicSchemaAccessible = !publicError;
    
    // Check if Salesforce tables are accessible
    let salesforceAccessible = false;
    let salesforceTablesAccessible = false;
    
    try {
      const { data, error } = await supabase.rpc('test_schema_exists', { schema_name: 'fivetran_views' });
      salesforceAccessible = !error && !!data;
    } catch (error) {
      logger.warn('Error checking fivetran_views schema:', error);
    }
    
    try {
      const { data, error } = await supabase.rpc('check_schema_tables', { schema_name: 'fivetran_views' });
      salesforceTablesAccessible = !error && Array.isArray(data) && data.length > 0;
    } catch (error) {
      logger.warn('Error checking fivetran_views tables:', error);
    }
    
    // List available schemas
    let availableSchemas = [];
    try {
      const { data, error } = await supabase.rpc('list_schemas');
      if (!error && Array.isArray(data)) {
        availableSchemas = data;
      }
    } catch (error) {
      logger.warn('Error listing schemas:', error);
    }
    
    // Test schemas
    const schemas = {
      public: { accessible: publicSchemaAccessible },
      fivetran_views: { accessible: salesforceAccessible }
    };
    
    return {
      success: publicSchemaAccessible,
      schemas,
      salesforceAccessible,
      salesforceTablesAccessible,
      availableSchemas
    };
  } catch (error) {
    logger.error('Error troubleshooting schema access:', error);
    return { success: false, error };
  }
};

interface FunctionTestResult {
  [key: string]: {
    success: boolean;
    error?: string;
    dataReceived?: boolean;
  };
}

/**
 * Test all cross-schema RPC functions
 * @returns Test results for each function
 */
export const testCrossSchemaMethods = async (): Promise<{
  success: boolean;
  results: FunctionTestResult;
}> => {
  // List of functions to test
  const functions = [
    'get_daily_lead_count',
    'get_lead_to_win_conversion',
    'get_monthly_lead_trends',
    'get_monthly_opportunity_trends',
    'get_sales_cycle_by_campus',
    'get_weekly_lead_counts'
  ];

  logger.info("Testing cross-schema functions...");
  const results: FunctionTestResult = {};
  
  for (const func of functions) {
    try {
      const { success, data, error } = await supabase.executeRPC(func);
      results[func] = { 
        success, 
        error: error?.message, 
        dataReceived: !!data 
      };
      logger.info(`Function ${func}:`, results[func]);
    } catch (err) {
      const error = err as Error;
      logger.error(`Error calling function ${func}:`, error);
      results[func] = { 
        success: false, 
        error: error.message 
      };
    }
  }

  logger.info("Cross-schema function tests complete");
  return {
    success: Object.values(results).some(r => r.success),
    results
  };
};
