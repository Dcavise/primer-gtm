
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
      canAccessSalesforce: data.salesforce_schema_access 
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
export const getDailyLeadCount = async (params?: { days?: number, campus_id?: string }) => {
  try {
    logger.info('Fetching daily lead count', params);
    const { data, error } = await supabase.rpc('get_daily_lead_count', params);
    
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
export const getLeadToWinConversion = async (params?: { p_campus_id?: string, p_months?: number }) => {
  try {
    logger.info('Fetching lead to win conversion', params);
    const { data, error } = await supabase.rpc('get_lead_to_win_conversion', params);
    
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

// Get weekly lead trends
export const getWeeklyLeadTrends = async (params: { start_date: string, end_date: string }) => {
  try {
    logger.info('Fetching weekly lead trends', params);
    const { data, error } = await supabase.rpc('get_weekly_lead_trends', params);
    
    if (error) {
      logger.error('Error fetching weekly lead trends:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in getWeeklyLeadTrends:', err);
    return { success: false, error: err };
  }
};

// Get monthly opportunity trends
export const getMonthlyOpportunityTrends = async (params: { 
  start_date: string, 
  end_date: string,
  p_campus_id?: string 
}) => {
  try {
    logger.info('Fetching monthly opportunity trends', params);
    const { data, error } = await supabase.rpc('get_monthly_opportunity_trends', params);
    
    if (error) {
      logger.error('Error fetching monthly opportunity trends:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in getMonthlyOpportunityTrends:', err);
    return { success: false, error: err };
  }
};

// Get sales cycle by campus
export const getSalesCycleByCampus = async () => {
  try {
    logger.info('Fetching sales cycle by campus');
    const { data, error } = await supabase.rpc('get_sales_cycle_by_campus');
    
    if (error) {
      logger.error('Error fetching sales cycle by campus:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (err) {
    logger.error('Error in getSalesCycleByCampus:', err);
    return { success: false, error: err };
  }
};

// =============================================
// 3. Access Salesforce Tables Directly (Via Views)
// =============================================

export const getSalesforceContacts = async (limit = 10) => {
  try {
    logger.info(`Fetching salesforce contacts with limit: ${limit}`);
    // Using the public view (if it exists)
    const { data, error } = await supabase
      .from('salesforce_contacts')
      .select('*')
      .limit(limit);
    
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

export const querySalesforceTable = async (tableName: string) => {
  try {
    logger.info(`Querying salesforce table: ${tableName}`);
    // Using the helper function (if it exists)
    const { data, error } = await supabase
      .rpc('query_salesforce_table', { table_name: tableName });
    
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
// 6. Troubleshooting functions
// =============================================

export const troubleshootSchemaAccess = async () => {
  logger.info("Running schema access diagnostics...");

  // 1. Test basic connection
  const connectionTest = await testConnection();
  logger.info("1. Connection test:", connectionTest);

  if (!connectionTest.success) {
    logger.error("Basic connection failed. Check your Supabase URL and key.");
    return {
      success: false,
      error: "Basic connection failed",
      details: connectionTest.error
    };
  }

  // 2. Check schema access (if function exists)
  try {
    const { data, error } = await supabase.rpc('check_schema_access');
    logger.info("2. Schema access check:", { data, error });
    
    if (error) {
      logger.error("Schema access check failed:", error);
    } else if (data) {
      // Analyze which schemas and tables we can access
      data.forEach((schema: any) => {
        logger.info(`Schema ${schema.schema_name}: ${schema.can_access ? 'Accessible' : 'Not accessible'}`);
        if (schema.can_access && schema.tables) {
          logger.info("Tables:", schema.tables);
        }
      });
    }
  } catch (err) {
    logger.error("Error checking schema access:", err);
  }

  // 3. Try each cross-schema function
  const functions = [
    'get_daily_lead_count',
    'get_lead_to_win_conversion',
    'get_monthly_lead_trends',
    'get_monthly_opportunity_trends',
    'get_sales_cycle_by_campus'
  ];

  logger.info("3. Testing cross-schema functions...");
  const functionResults: Record<string, { success: boolean, error?: string }> = {};
  
  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc(func);
      const success = !error;
      logger.info(`Function ${func}:`, { 
        success, 
        error: error?.message, 
        dataReceived: !!data 
      });
      functionResults[func] = { 
        success, 
        error: error?.message 
      };
    } catch (err: any) {
      logger.error(`Error calling function ${func}:`, err);
      functionResults[func] = { 
        success: false, 
        error: err.message 
      };
    }
  }

  logger.info("Diagnostics complete. Check the logs for detailed results.");
  
  return {
    success: true,
    connectionTest,
    functionResults
  };
};
