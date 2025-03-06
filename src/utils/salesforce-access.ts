
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// =============================================
// 1. Test Connection to Both Schemas
// =============================================
export const testConnection = async () => {
  try {
    logger.info('Testing connection to Salesforce schema');
    const { data, error } = await supabase.rpc('test_salesforce_connection');
    
    if (error) {
      logger.error('Connection test failed:', error);
      return { success: false, error };
    }
    
    logger.info('Connection test results:', data);
    return { 
      success: true, 
      data,
      canAccessSalesforce: data?.salesforce_schema_access 
    };
  } catch (err) {
    logger.error('Error testing connection:', err);
    return { success: false, error: err };
  }
};

// =============================================
// 2. Access Cross-Schema Functions
// =============================================

// Example: Get daily lead count
export const getDailyLeadCount = async (days = 30, campusId = null) => {
  try {
    logger.info(`Fetching daily lead count for past ${days} days, campus ID: ${campusId || 'all'}`);
    const { data, error } = await supabase.rpc('get_daily_lead_count', {
      p_days: days,
      p_campus_id: campusId
    });
    
    if (error) {
      logger.error('Error fetching daily lead count:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in getDailyLeadCount:', err);
    return { success: false, error: err };
  }
};

// Example: Get lead to win conversion
export const getLeadToWinConversion = async (campusId = null, months = 12) => {
  try {
    logger.info(`Fetching lead to win conversion for past ${months} months, campus ID: ${campusId || 'all'}`);
    const { data, error } = await supabase.rpc('get_lead_to_win_conversion', {
      p_campus_id: campusId,
      p_months: months
    });
    
    if (error) {
      logger.error('Error fetching lead to win conversion:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in getLeadToWinConversion:', err);
    return { success: false, error: err };
  }
};

// Get weekly lead counts
export const getWeeklyLeadCounts = async (startDate, endDate, campusId = null) => {
  try {
    logger.info(`Fetching weekly lead counts from ${startDate} to ${endDate}, campus ID: ${campusId || 'all'}`);
    const { data, error } = await supabase.rpc('get_weekly_lead_counts', {
      start_date: startDate,
      end_date: endDate,
      campus_filter: campusId
    });
    
    if (error) {
      logger.error('Error fetching weekly lead counts:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in getWeeklyLeadCounts:', err);
    return { success: false, error: err };
  }
};

// Get week over week comparison
export const getWeekOverWeekComparison = async (campusId = null) => {
  try {
    logger.info(`Fetching week over week comparison, campus ID: ${campusId || 'all'}`);
    const { data, error } = await supabase.rpc('get_week_over_week_comparison', {
      p_campus_id: campusId
    });
    
    if (error) {
      logger.error('Error fetching week over week comparison:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in getWeekOverWeekComparison:', err);
    return { success: false, error: err };
  }
};

// =============================================
// 3. Access Salesforce Tables Directly (Via RPC Functions)
// =============================================

// Use RPC functions instead of direct table access
export const getSalesforceContacts = async (limit = 10) => {
  try {
    logger.info(`Fetching salesforce contacts with limit: ${limit}`);
    // Using an RPC function to access salesforce data
    const { data, error } = await supabase.rpc('query_salesforce_table', {
      table_name: 'contact',
      limit_count: limit
    });
    
    if (error) {
      logger.error('Error fetching salesforce contacts:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in getSalesforceContacts:', err);
    return { success: false, error: err };
  }
};

// =============================================
// 4. Use helper functions for raw salesforce table access
// =============================================

export const querySalesforceTable = async (tableName, limit = 100) => {
  try {
    logger.info(`Querying salesforce table ${tableName} with limit ${limit}`);
    // Using the helper function to access salesforce data
    const { data, error } = await supabase.rpc('query_salesforce_table', { 
      table_name: tableName,
      limit_count: limit
    });
    
    if (error) {
      logger.error(`Error querying salesforce.${tableName}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error(`Error in querySalesforceTable for ${tableName}:`, err);
    return { success: false, error: err };
  }
};

// =============================================
// 5. Troubleshooting functions
// =============================================

export const troubleshootSchemaAccess = async () => {
  logger.info("Running schema access diagnostics...");

  // 1. Test basic connection
  const connectionTest = await testConnection();
  logger.info("1. Connection test:", connectionTest);

  if (!connectionTest.success) {
    logger.error("Basic connection failed. Check your Supabase URL and key.");
    return { success: false, step: 'connection', error: connectionTest.error };
  }

  // 2. Check schema access
  try {
    const { data, error } = await supabase.rpc('check_schema_access');
    logger.info("2. Schema access check:", { data, error });
    
    if (error) {
      logger.error("Schema access check failed:", error);
      return { success: false, step: 'schema_access', error };
    } else {
      // Analyze which schemas and tables we can access
      const schemaResults = {};
      data.forEach(schema => {
        logger.info(`Schema ${schema.schema_name}: ${schema.can_access ? 'Accessible' : 'Not accessible'}`);
        schemaResults[schema.schema_name] = {
          accessible: schema.can_access,
          tables: schema.tables || []
        };
      });
      
      return { 
        success: true, 
        schemas: schemaResults,
        salesforceAccessible: schemaResults.salesforce?.accessible || false
      };
    }
  } catch (err) {
    logger.error("Error checking schema access:", err);
    return { success: false, step: 'schema_access', error: err };
  }
};

export const testCrossSchemaMethods = async () => {
  // Test each cross-schema function
  const functions = [
    'get_daily_lead_count',
    'get_lead_to_win_conversion',
    'get_monthly_lead_trends',
    'get_monthly_opportunity_trends',
    'get_sales_cycle_by_campus',
    'get_weekly_lead_counts'
  ];

  logger.info("Testing cross-schema functions...");
  const results = {};
  
  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc(func);
      const success = !error;
      results[func] = { 
        success, 
        error: error?.message, 
        dataReceived: !!data 
      };
      logger.info(`Function ${func}:`, results[func]);
    } catch (err) {
      logger.error(`Error calling function ${func}:`, err);
      results[func] = { 
        success: false, 
        error: err.message 
      };
    }
  }

  logger.info("Cross-schema function tests complete");
  return {
    success: Object.values(results).some(r => r.success),
    results
  };
};
