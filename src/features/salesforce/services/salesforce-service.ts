/**
 * Consolidated Salesforce Data Service
 * 
 * This module provides unified access to Salesforce data via the fivetran_views schema.
 */

import { supabase } from '@/integrations/supabase-client';
import { logger } from '@/utils/logger';

// =============================================
// 1. Core Data Access Methods
// =============================================

/**
 * Query any Salesforce table
 * @param tableName Table name in fivetran_views schema (e.g., 'lead', 'contact')
 * @param limit Maximum number of records to return
 * @returns Query result with success status
 */
export const querySalesforceTable = async (tableName: string, limit = 100) => {
  logger.info(`Querying salesforce table ${tableName} with limit ${limit}`);
  
  try {
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query: `SELECT * FROM fivetran_views.${tableName} LIMIT ${limit}`
    });
    
    if (error) {
      logger.error(`Error querying Salesforce table ${tableName}:`, error);
      return { success: false, data: null, error };
    }
    
    logger.info(`Successfully queried ${tableName}, got ${data?.length || 0} records`);
    return { success: true, data, error: null };
  } catch (error) {
    logger.error(`Exception querying Salesforce table ${tableName}:`, error);
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

/**
 * Get weekly lead count data
 * @param startDate ISO date string for start date
 * @param endDate ISO date string for end date
 * @param campusId Optional campus ID to filter by
 * @returns Weekly lead count data
 */
export const getWeeklyLeadCounts = async (startDate: string, endDate: string, campusId: string | null = null) => {
  logger.info(`Getting weekly lead counts from ${startDate} to ${endDate}, campus: ${campusId || 'all'}`);
  
  try {
    // Build the query based on parameters
    let query = `
      WITH weekly_data AS (
        SELECT
          date_trunc('week', l.createddate)::date as week,
          COUNT(l.id) as lead_count
        FROM fivetran_views.lead l
        WHERE l.createddate BETWEEN '${startDate}' AND '${endDate}'
    `;
    
    // Add campus filter if provided
    if (campusId) {
      query += ` AND l.campus_c = '${campusId}'`;
    }
    
    // Finish the query
    query += `
        GROUP BY date_trunc('week', l.createddate)
        ORDER BY date_trunc('week', l.createddate)
      )
      SELECT * FROM weekly_data
    `;
    
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query
    });
    
    if (error) {
      logger.error('Error getting weekly lead counts:', error);
      return { success: false, data: null, error };
    }
    
    logger.info(`Got ${data?.length || 0} weeks of lead count data`);
    return { success: true, data, error: null };
  } catch (error) {
    logger.error('Exception getting weekly lead counts:', error);
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

/**
 * Get daily lead count data
 * @param days Number of days to include in the report
 * @param campusId Optional campus ID to filter by
 * @returns Daily lead count data
 */
export const getDailyLeadCount = async (days = 30, campusId = null) => {
  logger.info(`Fetching daily lead count for past ${days} days, campus ID: ${campusId || 'all'}`);
  
  try {
    let query = `
      WITH daily_data AS (
        SELECT
          date_trunc('day', l.createddate)::date as day,
          COUNT(l.id) as lead_count
        FROM fivetran_views.lead l
        WHERE l.createddate >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    
    // Add campus filter if provided
    if (campusId) {
      query += ` AND l.campus_c = '${campusId}'`;
    }
    
    // Finish the query
    query += `
        GROUP BY date_trunc('day', l.createddate)
        ORDER BY date_trunc('day', l.createddate)
      )
      SELECT * FROM daily_data
    `;
    
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query
    });
    
    if (error) {
      logger.error('Error getting daily lead counts:', error);
      return { success: false, data: null, error };
    }
    
    return { success: true, data, error: null };
  } catch (error) {
    logger.error('Exception getting daily lead counts:', error);
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

/**
 * Get lead summary statistics by campus
 * @returns Lead count by campus
 */
export const getLeadSummaryByCampus = async () => {
  logger.info('Getting lead summary by campus');
  
  try {
    const query = `
      SELECT
        l.preferred_campus_c as campus_name,
        COUNT(l.id) as lead_count
      FROM fivetran_views.lead l
      WHERE l.preferred_campus_c IS NOT NULL
      GROUP BY l.preferred_campus_c
      ORDER BY lead_count DESC
    `;
    
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query
    });
    
    if (error) {
      logger.error('Error getting lead summary by campus:', error);
      return { success: false, data: null, error };
    }
    
    logger.info(`Got lead summary for ${data?.length || 0} campuses`);
    return { success: true, data, error: null };
  } catch (error) {
    logger.error('Exception getting lead summary by campus:', error);
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

// =============================================
// 2. Diagnostics and Testing
// =============================================

/**
 * Test connection to fivetran_views schema
 * @returns Connection test results
 */
export const testConnection = async () => {
  logger.info('Testing Supabase connection and schema access');
  
  try {
    // Check for public schema access
    const { data: publicData, error: publicError } = await supabase
      .from('campuses')
      .select('count')
      .limit(1);
    
    const publicSchemaAccessible = !publicError;
    
    // Check if fivetran_views schema exists
    const { data: schemaData, error: schemaError } = await supabase.rpc('execute_sql_query', {
      query: `SELECT EXISTS(
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'fivetran_views'
      )`
    });
    
    const fivetranViewsExists = !schemaError && 
                            schemaData && 
                            schemaData.length > 0 && 
                            schemaData[0].exists;
    
    // Check if lead table exists and is accessible
    let leadTableAccessible = false;
    let rowCount = 0;
    
    if (fivetranViewsExists) {
      const { data: tableData, error: tableError } = await supabase.rpc('execute_sql_query', {
        query: `SELECT COUNT(*) FROM fivetran_views.lead LIMIT 1`
      });
      
      leadTableAccessible = !tableError && tableData;
      rowCount = leadTableAccessible ? tableData[0].count : 0;
    }
    
    return {
      success: publicSchemaAccessible && fivetranViewsExists,
      publicSchema: publicSchemaAccessible,
      fivetranViewsSchema: fivetranViewsExists,
      leadTableAccessible,
      rowCount
    };
  } catch (error) {
    logger.error('Error testing connection:', error);
    return { 
      success: false,
      publicSchema: false,
      fivetranViewsSchema: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

/**
 * Troubleshoot schema access issues
 * @returns Detailed information about schema access
 */
export const troubleshootSchemaAccess = async () => {
  logger.info('Troubleshooting schema access issues');
  try {
    const { data: schemas, error: schemasError } = await supabase.rpc('execute_sql_query', {
      query: `
        SELECT schema_name 
        FROM information_schema.schemata 
        ORDER BY schema_name
      `
    });
    
    // List tables in fivetran_views if it exists
    let fivetranTables: any[] = [];
    
    if (!schemasError && schemas) {
      const hasFiretranViews = schemas.some((s: any) => s.schema_name === 'fivetran_views');
      
      if (hasFiretranViews) {
        const { data: tables, error: tablesError } = await supabase.rpc('execute_sql_query', {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'fivetran_views'
            ORDER BY table_name
          `
        });
        
        if (!tablesError && tables) {
          fivetranTables = tables;
        }
      }
    }
    
    // Test a sample query on lead table
    let sampleQueryWorks = false;
    let sampleData = null;
    
    try {
      const { data, error } = await supabase.rpc('execute_sql_query', {
        query: `SELECT * FROM fivetran_views.lead LIMIT 1`
      });
      
      sampleQueryWorks = !error && !!data;
      sampleData = data;
    } catch (err) {
      logger.warn('Sample query failed:', err);
    }
    
    return {
      success: !schemasError,
      availableSchemas: schemas,
      fivetranTables,
      sampleQueryWorks,
      sampleData
    };
  } catch (error) {
    logger.error('Error troubleshooting schema access:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

// Export the combined salesforce service
export default {
  querySalesforceTable,
  getWeeklyLeadCounts,
  getDailyLeadCount,
  getLeadSummaryByCampus,
  testConnection,
  troubleshootSchemaAccess
};