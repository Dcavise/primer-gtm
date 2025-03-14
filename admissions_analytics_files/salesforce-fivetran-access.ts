/**
 * Salesforce Data Access Module for Fivetran Views
 *
 * This module provides direct access to Salesforce data via the fivetran_views schema
 * replacing the previous approach that used the salesforce schema.
 */

import { supabase } from "@/integrations/supabase-client";
import { logger } from "@/utils/logger";

/**
 * Type guard to safely check if data is an array with at least one element
 */
function isArrayWithLength(data: unknown): data is any[] {
  return Array.isArray(data) && data.length > 0;
}

/**
 * Type guard to check if data is a non-null object
 */
function isNonNullObject(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null;
}

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

    // Use the type guard to safely access data
    if (!data) {
      logger.warn(`No data returned from ${tableName}`);
      return { success: true, data: [], error: null };
    }

    let resultRows: any[] = [];
    
    // Properly extract the result rows regardless of the returned structure
    if (Array.isArray(data)) {
      resultRows = data;
      logger.debug(`Got direct array with ${resultRows.length} items`);
    } else if (isNonNullObject(data)) {
      if ('rows' in data && Array.isArray(data.rows)) {
        resultRows = data.rows;
      } else if ('result' in data && Array.isArray(data.result)) {
        resultRows = data.result;
      } else {
        // Last attempt - might be a single object
        resultRows = [data];
      }
    }

    return { success: true, data: resultRows, error: null };
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

    // Use the type guard to safely access data
    if (!data) {
      logger.warn("No data returned for weekly lead counts");
      return { success: true, data: [], error: null };
    }

    let resultRows: any[] = [];
    
    // Properly extract the result rows regardless of the returned structure
    if (Array.isArray(data)) {
      resultRows = data;
      logger.debug(`Got direct array with ${resultRows.length} items`);
    } else if (isNonNullObject(data)) {
      if ('rows' in data && Array.isArray(data.rows)) {
        resultRows = data.rows;
      } else if ('result' in data && Array.isArray(data.result)) {
        resultRows = data.result;
      } else {
        // Last attempt - might be a single object
        resultRows = [data];
      }
    }

    logger.info(`Got ${resultRows.length} weeks of lead count data`);
    return { success: true, data: resultRows, error: null };
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

    // Use the type guard to safely access data
    if (!data) {
      logger.warn("No data returned for lead summary by campus");
      return { success: true, data: [], error: null };
    }

    let resultRows: any[] = [];
    
    // Properly extract the result rows regardless of the returned structure
    if (Array.isArray(data)) {
      resultRows = data;
      logger.debug(`Got direct array with ${resultRows.length} items`);
    } else if (isNonNullObject(data)) {
      if ('rows' in data && Array.isArray(data.rows)) {
        resultRows = data.rows;
      } else if ('result' in data && Array.isArray(data.result)) {
        resultRows = data.result;
      } else {
        // Last attempt - might be a single object
        resultRows = [data];
      }
    }

    logger.info(`Got lead summary for ${resultRows.length} campuses`);
    return { success: true, data: resultRows, error: null };
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

    const schemaExists = isArrayWithLength(schemaData) && isNonNullObject(schemaData[0]) && schemaData[0].exists;

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

    const leadTableAccessible = isArrayWithLength(tableData) && isNonNullObject(tableData[0]);
    const rowCount = leadTableAccessible && 'count' in tableData[0] ? Number(tableData[0].count) : 0;

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

/**
 * Fetch converted leads data from the metrics view
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campus Optional campus name to filter by
 * @returns Converted leads metric data
 */
export const fetchConvertedLeadsData = async (
  startDate: string,
  endDate: string,
  campus: string | null = null
) => {
  logger.info(
    `Fetching converted leads data from ${startDate} to ${endDate}, campus: ${campus || "all"}`
  );

  try {
    const campusFilter = campus ? `AND campus_name = '${campus.replace(/'/g, "''")}'` : '';
    
    const query = `
      SELECT 
        period_type, 
        period_date, 
        formatted_date, 
        campus_name, 
        converted_count
      FROM 
        fivetran_views.converted_leads_metrics_weekly
      WHERE 
        period_date BETWEEN '${startDate}' AND '${endDate}'
        ${campusFilter}
      ORDER BY 
        period_date ASC
    `;
    
    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: query,
    });

    if (error) {
      logger.error("Error fetching converted leads data:", error);
      return { success: false, data: null, error };
    }

    if (!data) {
      logger.warn("No data returned for converted leads query");
      return { success: true, data: [], error: null };
    }

    let resultRows: any[] = [];
    
    // Properly extract the result rows regardless of the returned structure
    if (Array.isArray(data)) {
      resultRows = data;
      logger.debug(`Got direct array with ${resultRows.length} items`);
    } else if (isNonNullObject(data)) {
      if ('rows' in data && Array.isArray(data.rows)) {
        resultRows = data.rows;
      } else if ('result' in data && Array.isArray(data.result)) {
        resultRows = data.result;
      } else {
        // Last attempt - might be a single object
        resultRows = [data];
      }
    }

    logger.info(`Got ${resultRows.length} converted leads data points`);
    return { success: true, data: resultRows, error: null };
  } catch (error) {
    logger.error("Exception fetching converted leads data:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Fetch closed won opportunities data from the metrics view
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campus Optional campus name to filter by
 * @returns Closed won opportunities metric data
 */
export const fetchClosedWonData = async (
  startDate: string,
  endDate: string,
  campus: string | null = null
) => {
  logger.info(
    `Fetching closed won data from ${startDate} to ${endDate}, campus: ${campus || "all"}`
  );

  try {
    const campusFilter = campus ? `AND campus_name = '${campus.replace(/'/g, "''")}'` : '';
    
    const query = `
      SELECT 
        period_type, 
        period_date, 
        formatted_date, 
        campus_name, 
        closed_won_count
      FROM 
        fivetran_views.closed_won_metrics_weekly
      WHERE 
        period_date BETWEEN '${startDate}' AND '${endDate}'
        ${campusFilter}
      ORDER BY 
        period_date ASC
    `;
    
    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: query,
    });

    if (error) {
      logger.error("Error fetching closed won data:", error);
      return { success: false, data: null, error };
    }

    if (!data) {
      logger.warn("No data returned for closed won query");
      return { success: true, data: [], error: null };
    }

    let resultRows: any[] = [];
    
    // Properly extract the result rows regardless of the returned structure
    if (Array.isArray(data)) {
      resultRows = data;
      logger.debug(`Got direct array with ${resultRows.length} items`);
    } else if (isNonNullObject(data)) {
      if ('rows' in data && Array.isArray(data.rows)) {
        resultRows = data.rows;
      } else if ('result' in data && Array.isArray(data.result)) {
        resultRows = data.result;
      } else {
        // Last attempt - might be a single object
        resultRows = [data];
      }
    }

    logger.info(`Got ${resultRows.length} closed won data points`);
    return { success: true, data: resultRows, error: null };
  } catch (error) {
    logger.error("Exception fetching closed won data:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

/**
 * Fetch cumulative ARR data for the 25/26 school year
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param campus Optional campus name to filter by
 * @returns Cumulative ARR metric data
 */
export const fetchCumulativeARRData = async (
  startDate: string,
  endDate: string,
  campus: string | null = null
) => {
  logger.info(
    `Fetching cumulative ARR data from ${startDate} to ${endDate}, campus: ${campus || "all"}`
  );

  try {
    // Need to join to campus_c to filter by campus name instead of ID
    const campusFilter = campus 
      ? `AND EXISTS (SELECT 1 FROM fivetran_views.campus_c c WHERE o.preferred_campus_c = c.id AND c.name = '${campus.replace(/'/g, "''")}')`
      : '';
    
    const query = `
      WITH period_dates AS (
        SELECT generate_series(
          '${startDate}'::date, 
          '${endDate}'::date, 
          '1 week'::interval
        )::date as period_date
      ),
      arr_data AS (
        SELECT
          o.close_date,
          c.name as campus_name,
          SUM(
            COALESCE(toc.state_scholarship_amount_annualized_c, 0) + 
            COALESCE(toc.family_contribution_amount_annualized_c, 0) + 
            COALESCE(o.actualized_financial_aid_c, 0)
          ) as arr_amount
        FROM 
          fivetran_views.opportunity o
        LEFT JOIN
          fivetran_views.tuition_offer_c toc ON o.active_tuition_offer_c = toc.id
        LEFT JOIN
          fivetran_views.campus_c c ON o.preferred_campus_c = c.id
        WHERE 
          o.is_closed = true 
          AND o.is_won = true
          AND o.school_year_c = '25/26'
          AND (toc.status_c = 'Active' OR toc.status_c IS NULL)
          ${campusFilter}
        GROUP BY
          o.close_date, c.name
      ),
      weekly_arr AS (
        SELECT
          pd.period_date,
          TO_CHAR(pd.period_date, 'Mon DD, YYYY') as formatted_date,
          COALESCE(ad.campus_name, 'All Campuses') as campus_name,
          SUM(ad.arr_amount) FILTER (WHERE ad.close_date <= pd.period_date) OVER (
            PARTITION BY ad.campus_name 
            ORDER BY pd.period_date
          ) as cumulative_arr
        FROM
          period_dates pd
        CROSS JOIN (
          SELECT DISTINCT campus_name FROM arr_data
          UNION ALL
          SELECT NULL
        ) campuses
        LEFT JOIN
          arr_data ad ON ad.campus_name = campuses.campus_name
        ORDER BY
          pd.period_date, ad.campus_name
      )
      SELECT
        'week' as period_type,
        period_date,
        formatted_date,
        campus_name,
        COALESCE(cumulative_arr, 0) as cumulative_arr
      FROM
        weekly_arr
      ORDER BY
        period_date ASC, campus_name
    `;
    
    const { data, error } = await supabase.rpc("execute_sql_query", {
      query_text: query,
    });

    if (error) {
      logger.error("Error fetching cumulative ARR data:", error);
      return { success: false, data: null, error };
    }

    if (!data) {
      logger.warn("No data returned for cumulative ARR query");
      return { success: true, data: [], error: null };
    }

    let resultRows: any[] = [];
    
    // Properly extract the result rows regardless of the returned structure
    if (Array.isArray(data)) {
      resultRows = data;
      logger.debug(`Got direct array with ${resultRows.length} items`);
    } else if (isNonNullObject(data)) {
      if ('rows' in data && Array.isArray(data.rows)) {
        resultRows = data.rows;
      } else if ('result' in data && Array.isArray(data.result)) {
        resultRows = data.result;
      } else {
        // Last attempt - might be a single object
        resultRows = [data];
      }
    }

    logger.info(`Got ${resultRows.length} cumulative ARR data points`);
    return { success: true, data: resultRows, error: null };
  } catch (error) {
    logger.error("Exception fetching cumulative ARR data:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
