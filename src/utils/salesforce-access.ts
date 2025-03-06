import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, checkSalesforceAccess } from '@/integrations/supabase/admin-client';
import { logger } from '@/utils/logger';

// =============================================
// 1. Test Connection to Both Schemas
// =============================================
export const testConnection = async () => {
  try {
    logger.info('Testing connection to Salesforce schema');
    
    // First try with regular client
    const regularTest = await supabase.rpc('test_salesforce_connection');
    
    // If regular access fails, try with admin client
    if (regularTest.error) {
      logger.info('Regular client access failed, trying with admin client');
      const adminTest = await checkSalesforceAccess();
      
      if (!adminTest.success) {
        logger.error('Admin client access also failed:', adminTest.error);
        return { success: false, error: adminTest.error };
      }
      
      return { 
        success: true, 
        data: { salesforce_schema_access: adminTest.salesforceAccess },
        canAccessSalesforce: adminTest.salesforceAccess,
        usingAdminClient: true
      };
    }
    
    logger.info('Connection test results:', regularTest.data);
    return { 
      success: true, 
      data: regularTest.data,
      canAccessSalesforce: regularTest.data?.salesforce_schema_access,
      usingAdminClient: false
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
// 3. Access Salesforce Tables Directly (now in public schema)
// =============================================

// Access salesforce tables (now in public schema)
export const getSalesforceContacts = async (limit = 10) => {
  try {
    logger.info(`Fetching salesforce contacts with limit: ${limit}`);
    // Direct access to contact table in public schema
    const { data, error } = await supabase
      .from('contact')
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
// 4. Access Salesforce tables in public schema
// =============================================

export const querySalesforceTable = async (tableName, limit = 100) => {
  try {
    logger.info(`Querying salesforce table ${tableName} with limit ${limit}`);
    // Direct access to tables in public schema
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);
    
    if (error) {
      logger.error(`Error querying table ${tableName}:`, error);
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

// Define interface for schema access results
interface SchemaAccessResult {
  schema_name: string;
  can_access: boolean;
  tables?: string[];
}

// Define interface for schema results
interface SchemaResults {
  [key: string]: {
    accessible: boolean;
    tables: string[];
  };
}

// Define interface for troubleshooting results
interface TroubleshootResult {
  success: boolean;
  schemas?: SchemaResults;
  salesforceTablesAccessible?: boolean; // Changed to check for tables in public schema
  step?: string;
  error?: any;
  usingAdminClient: boolean;
}

export const troubleshootSchemaAccess = async (): Promise<TroubleshootResult> => {
  logger.info("Running schema access diagnostics...");

  // 1. Test basic connection
  const connectionTest = await testConnection();
  logger.info("1. Connection test:", connectionTest);

  if (!connectionTest.success) {
    logger.error("Basic connection failed. Check your Supabase URL and key.");
    return { success: false, step: 'connection', error: connectionTest.error, usingAdminClient: connectionTest.usingAdminClient };
  }

  // 2. Check schema access using the appropriate client
  try {
    // Use admin client if we discovered we need it
    const client = connectionTest.usingAdminClient ? supabaseAdmin : supabase;
    
    const { data, error } = await client.rpc('check_schema_access');
    logger.info("2. Schema access check:", { data, error });
    
    if (error) {
      logger.error("Schema access check failed:", error);
      return { success: false, step: 'schema_access', error, usingAdminClient: connectionTest.usingAdminClient };
    } else {
      // Analyze which schemas and tables we can access
      const schemaResults: SchemaResults = {};
      
      if (Array.isArray(data)) {
        (data as SchemaAccessResult[]).forEach(schema => {
          logger.info(`Schema ${schema.schema_name}: ${schema.can_access ? 'Accessible' : 'Not accessible'}`);
          schemaResults[schema.schema_name] = {
            accessible: schema.can_access,
            tables: schema.tables || []
          };
        });
      }
      
      // Check for salesforce tables in public schema
      const publicTables = schemaResults?.public?.tables || [];
      const salesforceTables = ['lead', 'contact', 'opportunity'].filter(table => 
        publicTables.includes(table)
      );
      
      logger.info(`Salesforce tables in public schema: ${salesforceTables.join(', ')}`);
      
      return { 
        success: true, 
        schemas: schemaResults,
        salesforceTablesAccessible: salesforceTables.length > 0,
        usingAdminClient: connectionTest.usingAdminClient
      };
    }
  } catch (err) {
    logger.error("Error checking schema access:", err);
    return { success: false, step: 'schema_access', error: err, usingAdminClient: connectionTest.usingAdminClient };
  }
};

interface FunctionTestResult {
  [key: string]: {
    success: boolean;
    error?: string;
    dataReceived?: boolean;
  };
}

export const testCrossSchemaMethods = async (): Promise<{
  success: boolean;
  results: FunctionTestResult;
}> => {
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
  const results: FunctionTestResult = {};
  
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
