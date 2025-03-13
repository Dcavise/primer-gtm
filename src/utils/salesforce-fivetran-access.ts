/**
 * Salesforce Data Access Module for Fivetran Views
 *
 * This module provides direct access to Salesforce data via the fivetran_views schema
 * replacing the previous approach that used the salesforce schema.
 */

import { supabase } from "@/integrations/supabase-client";
import { logger } from "@/utils/logger";

/**
 * Query a Salesforce table via fivetran_views
 * @param tableName Name of the Salesforce table (e.g., 'lead', 'opportunity')
 * @param limit Maximum number of records to return
 * @returns Query result
 */
export const querySalesforceTable = async (tableName: string, limit = 100) => {
  logger.info(`Querying Salesforce table: ${tableName} with limit ${limit}`);

  try {
    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: `SELECT * FROM fivetran_views.${tableName} LIMIT ${limit}`,
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
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Get weekly lead counts
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campusId Optional campus ID to filter by
 * @returns Weekly lead count data
 */
export const getWeeklyLeadCounts = async (
  startDate: string,
  endDate: string,
  campusId: string | null = null
) => {
  logger.info(
    `Getting weekly lead counts from ${startDate} to ${endDate}, campus: ${campusId || "all"}`
  );

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

    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: query,
    });

    if (error) {
      logger.error("Error getting weekly lead counts:", error);
      return { success: false, data: null, error };
    }

    logger.info(`Got ${data?.length || 0} weeks of lead count data`);
    return { success: true, data, error: null };
  } catch (error) {
    logger.error("Exception getting weekly lead counts:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Get lead summary statistics by campus
 * @returns Lead count by campus
 */
export const getLeadSummaryByCampus = async () => {
  logger.info("Getting lead summary by campus");

  try {
    const query = `
      SELECT
        c.name as campus_name,
        c.state as campus_state,
        COUNT(l.id) as lead_count
      FROM fivetran_views.lead l
      JOIN fivetran_views.campus_c c ON l.campus_c = c.id
      GROUP BY c.name, c.state
      ORDER BY lead_count DESC
    `;

    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: query,
    });

    if (error) {
      logger.error("Error getting lead summary by campus:", error);
      return { success: false, data: null, error };
    }

    logger.info(`Got lead summary for ${data?.length || 0} campuses`);
    return { success: true, data, error: null };
  } catch (error) {
    logger.error("Exception getting lead summary by campus:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Test connection to fivetran_views schema
 * @returns Connection test results
 */
export const testFivetranConnection = async () => {
  logger.info("Testing connection to fivetran_views schema");

  try {
    // Check if fivetran_views schema exists
    const { data: schemaData, error: schemaError } = await supabase.rpc("execute_sql_query", {
      query_text: `SELECT EXISTS(
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'fivetran_views'
      )`
    });

    if (schemaError) {
      logger.error("Error checking for fivetran_views schema:", schemaError);
      return {
        success: false,
        fivetranViewsExists: false,
        error: schemaError,
      };
    }

    const schemaExists = schemaData && schemaData.length > 0 && schemaData[0].exists;

    if (!schemaExists) {
      logger.warn("fivetran_views schema does not exist in the database");
      return {
        success: false,
        fivetranViewsExists: false,
        error: new Error("fivetran_views schema does not exist"),
      };
    }

    // Check if lead table exists and is accessible
    const { data: tableData, error: tableError } = await supabase.rpc("execute_sql_query", {
      query_text: `SELECT COUNT(*) FROM fivetran_views.lead LIMIT 1`
    });

    if (tableError) {
      logger.error("Error accessing fivetran_views.lead table:", tableError);
      return {
        success: true,
        fivetranViewsExists: true,
        leadTableAccessible: false,
        error: tableError,
      };
    }

    const leadTableAccessible = tableData && tableData.length > 0;
    const rowCount = leadTableAccessible ? tableData[0].count : 0;

    return {
      success: true,
      fivetranViewsExists: true,
      leadTableAccessible,
      rowCount,
    };
  } catch (error) {
    logger.error("Exception testing fivetran connection:", error);
    return {
      success: false,
      fivetranViewsExists: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
