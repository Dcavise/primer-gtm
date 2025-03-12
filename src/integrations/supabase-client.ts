// This file serves as a central export point for the Supabase client
// to avoid path resolution issues in Vercel

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import { logger } from "@/utils/logger";

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
logger.info(`Supabase Anon Key configured: ${SUPABASE_ANON_KEY ? "Yes" : "No"}`);
logger.info(`Supabase Service Key configured: ${SUPABASE_SERVICE_KEY ? "Yes" : "No"}`);

// Family search result interface with standardized IDs
export interface FamilySearchResult {
  standard_id: string;
  family_id: string;
  alternate_id: string;
  family_name: string;
  current_campus_c: string;
  contact_count: number;
  opportunity_count: number;
  opportunity_is_won_flags?: boolean[]; // Array of booleans indicating if any opportunity is won
  opportunity_school_years?: string[]; // Array of school years for opportunities
  opportunity_campuses?: string[]; // Array of campuses for opportunities
  opportunity_stages?: string[]; // Array of stages for opportunities
}

// Generic response type for operations
export interface OperationResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Type augmentation for the RPC functions
declare module "@supabase/supabase-js" {
  interface SupabaseClient<Database> {
    rpc<T = unknown>(
      fn:
        | "execute_sql_query"
        | "get_weekly_lead_counts"
        | "query_salesforce_table"
        | "test_salesforce_connection"
        | "fivetran_views.search_families"
        | "fivetran_views.search_families_consistent"
        | "fivetran_views.get_family_by_standard_id"
        | string,
      params?: Record<string, unknown>
    ): Promise<{ data: T | null; error: Error | null }>;
  }
}

// Create the Supabase clients
const regularClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = SUPABASE_SERVICE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * Class that provides unified access to the Supabase client
 * with additional helper methods
 */
export class SupabaseUnifiedClient {
  public readonly regular: SupabaseClient<Database>;
  public readonly admin: SupabaseClient<Database> | null;

  constructor() {
    this.regular = regularClient;
    this.admin = adminClient;

    logger.info("Supabase client initialized");
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
  public async executeRPC<T = unknown>(
    functionName: string,
    params: Record<string, unknown> = {},
    schema?: string
  ): Promise<OperationResponse<T>> {
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
          if (error.message && error.message.includes("public") && schema) {
            logger.warn(
              `Supabase tried to use public schema when we specified ${schema}. Trying direct SQL...`
            );
            throw new Error("Schema prefix issue detected");
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
              const formattedValue = typeof value === "string" ? `'${value}'` : value;
              return `${key} => ${formattedValue}`;
            })
            .join(", ");

          // SQL to call the function directly
          const sql = `SELECT * FROM ${schema}.${functionName}(${sqlParams})`;
          logger.debug(`Executing direct SQL: ${sql}`);

          try {
            const { data, error } = await this.regular.rpc<T>("execute_sql_query", {
              query: sql,
            });

            if (error) {
              logger.error(`Direct SQL query failed:`, error);
              return { success: false, data: null, error: error.message };
            }

            return { success: true, data, error: null };
          } catch (sqlErr) {
            // Both approaches failed
            logger.error(`Both RPC and direct SQL approaches failed:`, sqlErr);
            const errorMessage = sqlErr instanceof Error ? sqlErr.message : "Unknown error";
            return { success: false, data: null, error: errorMessage };
          }
        } else {
          // No schema provided, just return the original error
          const errorMessage = rpcErr instanceof Error ? rpcErr.message : "Unknown error";
          logger.error(`Exception executing RPC function ${fullFunctionName}:`, rpcErr);
          return { success: false, data: null, error: errorMessage };
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
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
      logger.error("Invalid table name provided to querySalesforceTable");
      return { success: false, data: null, error: "Invalid table name" };
    }

    return this.executeRPC("query_salesforce_table", {
      table_name: tableName,
      limit,
    });
  }

  /**
   * Tests database connection and schema access
   */
  /**
   * Search for families using the existing database schema
   * @param searchTerm The search term to use
   * @returns Array of family search results with standardized IDs added on the client side
   */
  public async searchFamilies(
    searchTerm: string
  ): Promise<OperationResponse<FamilySearchResult[]>> {
    try {
      logger.info(`Searching for families with term: ${searchTerm}`);

      // Create a Map to store unique families by ID
      const familyMap = new Map<string, FamilySearchResult>();
      let foundResults = false;

      // First try the dedicated search_families_consistent RPC function
      try {
        logger.debug(`Trying to use search_families_consistent RPC with term: '${searchTerm}'`);
        const { data: rpcData, error: rpcError } = await this.regular.rpc(
          "search_families_consistent",
          {
            search_term: searchTerm,
          }
        );

        if (!rpcError && rpcData) {
          // Success with RPC - process the data
          logger.debug("Successfully retrieved data from search_families_consistent RPC");
          const processedResults = this.processSearchResults(rpcData as Record<string, unknown>[]);

          // Add to unique family map
          processedResults.forEach((family) => {
            if (family.family_id) {
              familyMap.set(family.family_id, family);
            }
          });

          foundResults = true;
          logger.debug(`Found ${processedResults.length} families from search_families_consistent`);
        } else {
          // RPC had an error, log and continue to fallback
          logger.warn(`Error using search_families_consistent RPC: ${rpcError?.message}`, rpcError);
          logger.debug("Falling back to regular search_families");
        }
      } catch (rpcSearchError) {
        logger.warn("search_families_consistent RPC failed", rpcSearchError);
        // Continue to next approach
      }

      // Try the regular search_families function
      try {
        const { data: regData, error: regError } = await this.regular.rpc("search_families", {
          search_term: searchTerm,
        });

        if (!regError && regData) {
          logger.debug("Successfully retrieved data from search_families RPC");
          const processedResults = this.processSearchResults(regData as Record<string, unknown>[]);

          // Add to unique family map
          processedResults.forEach((family) => {
            if (family.family_id && !familyMap.has(family.family_id)) {
              familyMap.set(family.family_id, family);
            }
          });

          foundResults = true;
          logger.debug(`Found ${processedResults.length} families from search_families`);
        } else {
          logger.warn(`Error using search_families RPC: ${regError?.message}`, regError);
          logger.debug("Falling back to direct SQL query");
        }
      } catch (regSearchError) {
        logger.warn("search_families RPC failed", regSearchError);
        // Continue to SQL fallback
      }

      // Fallback: Try SQL query using execute_sql_query RPC if we haven't found results yet
      if (!foundResults) {
        try {
          // Use the correct table name based on the schema information
          const sqlQuery = `
            SELECT 
              family_id,
              family_name,
              pdc_family_id_c, 
              current_campus_c,
              contact_count,
              opportunity_count,
              opportunity_is_won_flags,
              ARRAY[''] as opportunity_school_years,
              opportunity_preferred_campuses as opportunity_campuses,
              opportunity_stages
            FROM 
              fivetran_views.comprehensive_family_records
            WHERE 
              family_name ILIKE '%${searchTerm}%' OR
              current_campus_c ILIKE '%${searchTerm}%' OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(opportunity_names, 1) AS i 
                  WHERE 
                      opportunity_names[i] ILIKE '%${searchTerm}%'
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(contact_last_names, 1) AS i 
                  WHERE 
                      contact_last_names[i] ILIKE '%${searchTerm}%' OR
                      contact_emails[i] ILIKE '%${searchTerm}%' OR
                      contact_phones[i] ILIKE '%${searchTerm}%'
              )
            LIMIT 20
          `;

          logger.debug("Executing family search query using execute_sql_query RPC");
          const { data, error } = await this.regular.rpc("execute_sql_query", {
            query_text: sqlQuery,
          });

          if (error) {
            logger.warn(`Error executing SQL query: ${error.message}`, error);
          } else {
            // The execute_sql_query RPC returns results in a 'rows' property
            logger.debug(`Raw result data:`, data);

            // Better handling of response structure
            let resultRows: Record<string, unknown>[] = [];

            if (data) {
              if (Array.isArray(data)) {
                resultRows = data;
                logger.debug(`Data is direct array with ${data.length} items`);
              } else if (typeof data === "object") {
                if ("rows" in data && Array.isArray(data.rows)) {
                  resultRows = data.rows as Record<string, unknown>[];
                  logger.debug(`Data has rows array with ${resultRows.length} items`);
                } else if ("result" in data && Array.isArray(data.result)) {
                  resultRows = data.result as Record<string, unknown>[];
                  logger.debug(`Data has result array with ${resultRows.length} items`);
                } else {
                  // Last attempt - check if it's a single object that should be wrapped in array
                  logger.debug(
                    `Data is object without standard array property, keys:`,
                    Object.keys(data)
                  );
                  if (Object.keys(data).length > 0) {
                    resultRows = [data as Record<string, unknown>];
                  }
                }
              }
            }

            logger.debug(
              `Raw result structure:`,
              typeof data,
              Array.isArray(data) ? "is array" : "not array",
              `Extracted ${resultRows.length} rows`
            );

            // Process the results to add standardized IDs
            const processedResults = this.processSearchResults(resultRows);

            // Add to unique family map
            processedResults.forEach((family) => {
              if (family.family_id && !familyMap.has(family.family_id)) {
                familyMap.set(family.family_id, family);
              }
            });

            foundResults = true;
            logger.debug(
              `Found ${processedResults.length} families from comprehensive_family_records SQL query`
            );
          }
        } catch (sqlRpcError) {
          logger.warn("execute_sql_query RPC failed", sqlRpcError);
          // Continue to next approach
        }
      }

      // Last resort: direct POST request - only if no results found yet
      if (!foundResults) {
        try {
          logger.debug("Attempting direct POST request to execute_sql_query");

          // Use family_standard_ids table as a last resort
          const sqlQuery = `
            SELECT 
              family_id,
              family_name,
              pdc_family_id_c, 
              current_campus_c,
              contact_count,
              opportunity_count,
              ARRAY[false]::boolean[] as opportunity_is_won_flags,
              ARRAY['']::text[] as opportunity_school_years,
              ARRAY['']::text[] as opportunity_campuses,
              ARRAY['']::text[] as opportunity_stages
            FROM 
              fivetran_views.family_standard_ids
            WHERE 
              family_name ILIKE '%${searchTerm}%' OR
              current_campus_c ILIKE '%${searchTerm}%' OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(opportunity_names, 1) AS i 
                  WHERE 
                      opportunity_names[i] ILIKE '%${searchTerm}%'
              )
            LIMIT 20
          `;

          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql_query`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              query_text: sqlQuery,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            logger.warn(`Error with direct SQL POST: ${response.status} - ${errorText}`);
            throw new Error(`SQL query failed: ${response.status} - ${errorText}`);
          }

          const data = await response.json();

          // Get the rows from the response if available
          const resultRows =
            data && typeof data === "object" && "rows" in data
              ? (data.rows as Record<string, unknown>[])
              : ((Array.isArray(data) ? data : []) as Record<string, unknown>[]);

          // Process the results to add standardized IDs
          const processedResults = this.processSearchResults(resultRows);

          // Add to unique family map
          processedResults.forEach((family) => {
            if (family.family_id && !familyMap.has(family.family_id)) {
              familyMap.set(family.family_id, family);
            }
          });

          foundResults = true;
          logger.debug(`Found ${processedResults.length} families via direct POST request`);
        } catch (fetchError) {
          logger.error("Final fallback family search failed", fetchError);
          // If we have no other results, return this error
          if (familyMap.size === 0) {
            return { success: false, data: [], error: String(fetchError) };
          }
        }
      }

      // Convert the Map values to an array for the final results
      const uniqueResults = Array.from(familyMap.values());

      // Filter results to only include families with specific opportunity stages
      const targetStages = [
        "Family Interview",
        "Awaiting Documents",
        "Admission Offered",
        "Education Review",
        "Closed Won",
      ];

      const filteredResults = uniqueResults.filter((family) => {
        // Check if the family has any opportunities with the target stages
        if (!family.opportunity_stages || !Array.isArray(family.opportunity_stages)) {
          return false;
        }

        // Look for any opportunity stage that matches one of our target stages
        return family.opportunity_stages.some((stage) => stage && targetStages.includes(stage));
      });

      logger.debug(
        `Filtered from ${uniqueResults.length} to ${filteredResults.length} families with specific opportunity stages`
      );
      logger.debug(
        `Returning ${filteredResults.length} unique families matching '${searchTerm}' with specific opportunity stages`
      );
      return { success: true, data: filteredResults, error: null };
    } catch (err: unknown) {
      // Provide detailed error information
      const errorObj =
        err instanceof Error
          ? { message: err.message, stack: err.stack, name: err.name }
          : { error: String(err) };

      logger.error("Family search failed:", JSON.stringify(errorObj, null, 2));
      return { success: false, data: [], error: JSON.stringify(errorObj) };
    }
  }

  /**
   * Process search results to add standardized IDs
   * @param results Raw results from the database query
   * @returns Processed results with standardized IDs
   */
  public processSearchResults(results: Record<string, unknown>[]): FamilySearchResult[] {
    if (!Array.isArray(results)) {
      logger.warn("Expected array of results but received:", typeof results, results);
      return [];
    }

    if (results.length === 0) {
      logger.debug("No search results found");
      return [];
    }

    return results.map((family) => {
      // Log the available IDs for debugging
      logger.debug("Processing family search result:", {
        family_id: family.family_id as string,
        pdc_family_id_c: family.pdc_family_id_c as string | null,
      });

      // Handle potentially null values in array fields
      const opportunityIsWonFlags = family.opportunity_is_won_flags
        ? Array.isArray(family.opportunity_is_won_flags)
          ? (family.opportunity_is_won_flags as boolean[])
          : []
        : [];

      const opportunitySchoolYears = family.opportunity_school_years
        ? Array.isArray(family.opportunity_school_years)
          ? (family.opportunity_school_years as string[]).filter(Boolean)
          : []
        : [];

      const opportunityCampuses = family.opportunity_campuses
        ? Array.isArray(family.opportunity_campuses)
          ? (family.opportunity_campuses as string[]).filter(Boolean)
          : []
        : [];

      // Process opportunity stages with better validation and trimming
      const opportunityStages = family.opportunity_stages
        ? Array.isArray(family.opportunity_stages)
          ? (family.opportunity_stages as string[])
              .map((stage) => (typeof stage === "string" ? stage.trim() : stage)) // Trim whitespace
              .filter(Boolean)
          : []
        : [];

      // Log the array values for debugging
      logger.debug("Array values from search result:", {
        is_won_flags: opportunityIsWonFlags,
        school_years: opportunitySchoolYears,
        campuses: opportunityCampuses,
      });

      return {
        // Add standardized IDs
        standard_id: (family.family_id as string) || "", // Use family_id as standard_id
        family_id: (family.family_id as string) || "", // Keep original family_id
        alternate_id: (family.pdc_family_id_c as string) || null, // Use pdc_family_id_c as alternate_id

        // Keep all other fields with safe fallbacks
        family_name: (family.family_name as string) || "",
        current_campus_c: (family.current_campus_c as string) || "",
        contact_count:
          typeof family.contact_count === "number"
            ? family.contact_count
            : typeof family.contact_count === "string"
              ? parseInt(family.contact_count, 10)
              : 0,
        opportunity_count:
          typeof family.opportunity_count === "number"
            ? family.opportunity_count
            : typeof family.opportunity_count === "string"
              ? parseInt(family.opportunity_count, 10)
              : 0,
        opportunity_is_won_flags: opportunityIsWonFlags,
        opportunity_school_years: opportunitySchoolYears,
        opportunity_campuses: opportunityCampuses,
        opportunity_stages: opportunityStages,
      };
    });
  }

  /**
   * Fetch a family record by ID using the existing database schema
   * @param familyId The ID of the family to fetch
   * @returns Result with success status and family data
   */
  public async getFamilyRecord(
    familyId: string
  ): Promise<OperationResponse<Record<string, unknown>>> {
    try {
      if (!familyId) {
        return { success: false, data: null, error: "No family ID provided" };
      }

      logger.debug(`Fetching family record for ID: ${familyId}`);

      // Query the comprehensive_family_records table directly from fivetran_views schema
      // According to docs, this is the correct schema, not public schema
      // We'll try to match by any identifier (family_id or pdc_family_id_c or standard_id)
      // and handle potential format issues with more lenient matching

      // Clean and sanitize the ID input to prevent SQL injection
      const sanitizedId = familyId.replace(/'/g, "''");
      logger.debug(`Using sanitized ID for family record query: ${sanitizedId}`);

      const query = `
        WITH family_data AS (
          SELECT 
            family_id,
            family_name,
            pdc_family_id_c,
            current_campus_c,
            contact_ids,
            contact_first_names,
            contact_last_names,
            contact_phones,
            contact_emails,
            contact_last_activity_dates,
            opportunity_ids,
            opportunity_names,
            opportunity_grades,
            opportunity_campuses,
            opportunity_lead_notes,
            opportunity_family_interview_notes,
            opportunity_created_dates,
            opportunity_record_types,
            tuition_offer_ids,
            tuition_offer_statuses,
            tuition_offer_family_contributions,
            tuition_offer_state_scholarships,
            contact_count,
            opportunity_count,
            tuition_offer_count
          FROM fivetran_views.comprehensive_family_records
          WHERE 
            -- Try to match by any ID field
            family_id = '${sanitizedId}' 
            OR pdc_family_id_c = '${sanitizedId}'
            OR family_id LIKE '${sanitizedId}%' -- Try partial matching for truncated IDs
            OR pdc_family_id_c LIKE '${sanitizedId}%' -- Try partial matching for truncated IDs
          LIMIT 1
        ),
        -- Get the campus name for the current_campus_c field
        campus_data AS (
          SELECT
            c.id as campus_id,
            c.name as campus_name
          FROM
            fivetran_views.campus_c c
          JOIN
            family_data fd ON fd.current_campus_c = c.id
        ),
        -- Get campus names for all opportunity campuses
        opportunity_campus_names AS (
          SELECT
            array_agg(c.name ORDER BY ids.index) as opportunity_campus_names
          FROM 
            family_data fd,
            LATERAL (
              SELECT
                UNNEST(fd.opportunity_campuses) as campus_id,
                generate_subscripts(fd.opportunity_campuses, 1) as index
            ) ids
          LEFT JOIN LATERAL (
            SELECT
              c.name
            FROM
              fivetran_views.campus_c c
            WHERE
              c.id = ids.campus_id
          ) c ON true
        ),
        -- Now get the actual stage names directly from the opportunity table
        -- We'll get them in a way that preserves the exact order as in opportunity_ids
        opportunity_data AS (
          SELECT 
            array_agg(s.stage ORDER BY ids.index) as opportunity_stages,
            array_agg(s.school_year ORDER BY ids.index) as opportunity_school_years,
            array_agg(s.is_won ORDER BY ids.index) as opportunity_is_won
          FROM family_data fd,
          LATERAL (
            SELECT 
              UNNEST(fd.opportunity_ids) as opp_id,
              generate_subscripts(fd.opportunity_ids, 1) as index
          ) ids
          LEFT JOIN LATERAL (
            SELECT 
              o.stage_name as stage,
              o.school_year_c as school_year,
              CASE WHEN o.stage_name = 'Closed Won' THEN true ELSE false END as is_won
            FROM fivetran_views.opportunity o
            WHERE o.id = ids.opp_id
          ) s ON true
        ),
        -- Calculate the lifetime value by summing up relevant financial values from tuition offers
        lifetime_value_calc AS (
          SELECT
            COALESCE(
              SUM(
                CASE 
                  WHEN to_status LIKE '%Accept%' OR to_status LIKE '%Won%' THEN 
                    COALESCE(to_family_contribution, 0) + 
                    COALESCE(to_state_scholarship, 0)
                  ELSE 0 
                END
              ), 
              0
            ) as lifetime_value
          FROM (
            SELECT
              UNNEST(fd.tuition_offer_statuses) as to_status,
              UNNEST(fd.tuition_offer_family_contributions) as to_family_contribution,
              UNNEST(fd.tuition_offer_state_scholarships) as to_state_scholarship
            FROM family_data fd
          ) tuition_offers
        )
        SELECT 
          fd.*,
          COALESCE(cd.campus_name, 'Unknown Campus') as current_campus_name,
          COALESCE(od.opportunity_stages, ARRAY[]::text[]) as opportunity_stages,
          COALESCE(od.opportunity_school_years, ARRAY[]::text[]) as opportunity_school_years,
          COALESCE(od.opportunity_is_won, ARRAY[]::boolean[]) as opportunity_is_won,
          COALESCE(ocn.opportunity_campus_names, ARRAY[]::text[]) as opportunity_campus_names,
          COALESCE(lvc.lifetime_value, 0) as lifetime_value
        FROM family_data fd
        LEFT JOIN campus_data cd ON true
        LEFT JOIN opportunity_data od ON true
        LEFT JOIN opportunity_campus_names ocn ON true
        LEFT JOIN lifetime_value_calc lvc ON true
      `;

      try {
        logger.debug("Executing direct SQL query on comprehensive_family_records");
        const { data, error } = await this.regular.rpc("execute_sql_query", {
          query_text: query,
        });

        if (error) {
          logger.error("Failed to fetch family record using SQL query", error);
          return { success: false, data: null, error: error.message };
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
          logger.warn(
            `No family found with ID: ${familyId} in fivetran_views.comprehensive_family_records`
          );

          // Provide more detailed debugging information
          logger.debug("Query that produced no results:", query);

          // Try to check if the table even exists and has data
          try {
            const tableCheckQuery = `SELECT count(*) FROM fivetran_views.comprehensive_family_records LIMIT 1`;
            logger.debug("Checking if table has data with query:", tableCheckQuery);
            this.regular
              .rpc("execute_sql_query", { query_text: tableCheckQuery })
              .then(({ data: checkData, error: checkError }) => {
                if (checkError) {
                  logger.error("Error checking table existence:", checkError);
                } else {
                  logger.debug("Table check result:", checkData);
                }
              });
          } catch (checkError) {
            logger.error("Error during table existence check:", checkError);
          }

          return {
            success: false,
            data: null,
            error: `Family with ID ${familyId} not found in the database. Please check the ID and try again.`,
          };
        }

        // If data is an array, return the first item
        const familyRecord = Array.isArray(data) ? data[0] : data;

        // Print raw data for debugging
        logger.debug("Raw family record from database:", familyRecord);

        // Debug opportunity stages specifically
        if (familyRecord && familyRecord.opportunity_stages) {
          logger.debug("Raw opportunity stages before processing:", {
            type: typeof familyRecord.opportunity_stages,
            isArray: Array.isArray(familyRecord.opportunity_stages),
            value: familyRecord.opportunity_stages,
            length: Array.isArray(familyRecord.opportunity_stages)
              ? familyRecord.opportunity_stages.length
              : "N/A",
          });
        } else {
          logger.debug("No opportunity_stages field found in the family record");
        }

        // Clean opportunity stages data
        if (familyRecord && Array.isArray(familyRecord.opportunity_stages)) {
          // Store original values for comparison
          const originalStages = [...familyRecord.opportunity_stages];

          // Process the stages with improved handling for known stage values
          familyRecord.opportunity_stages = familyRecord.opportunity_stages
            .map((stage) => {
              // Convert stage to string and trim if it's a string
              const cleanedStage =
                typeof stage === "string" ? stage.trim() : String(stage || "").trim();

              // Log initial cleaning
              logger.debug(`Stage initial cleaning: '${stage}' -> '${cleanedStage}'`);

              // Check for codes or partial matches that might indicate known stages
              // This helps when the database has abbreviated codes or formatting issues
              let normalizedStage = cleanedStage;

              // Common stage name variations to normalize
              const stageMapping = {
                // Handle 'Family Interview' variations
                family: "Family Interview",
                "family int": "Family Interview",
                "family interview": "Family Interview",
                interview: "Family Interview",

                // Handle 'Awaiting Documents' variations
                await: "Awaiting Documents",
                awaiting: "Awaiting Documents",
                "awaiting doc": "Awaiting Documents",
                "awaiting documents": "Awaiting Documents",
                documents: "Awaiting Documents",

                // Handle 'Education Review' variations
                "ed review": "Education Review",
                edu: "Education Review",
                education: "Education Review",
                "education review": "Education Review",
                review: "Education Review",

                // Handle 'Admission Offered' variations
                admission: "Admission Offered",
                "admission offered": "Admission Offered",
                admit: "Admission Offered",
                offered: "Admission Offered",

                // Handle 'Closed Won/Lost' variations
                "closed w": "Closed Won",
                won: "Closed Won",
                "closed won": "Closed Won",
                "closed l": "Closed Lost",
                lost: "Closed Lost",
                "closed lost": "Closed Lost",
              };

              // Try to match against our known variations
              const lowerStage = cleanedStage.toLowerCase();
              for (const [key, value] of Object.entries(stageMapping)) {
                if (lowerStage === key || lowerStage.includes(key)) {
                  normalizedStage = value;
                  logger.debug(
                    `Stage normalized from '${cleanedStage}' to '${normalizedStage}' based on pattern match`
                  );
                  break;
                }
              }

              return normalizedStage;
            })
            .filter(Boolean); // Remove empty strings

          // Log the stages before and after cleaning for comparison
          logger.debug("Opportunity stages comparison:", {
            before: originalStages,
            after: familyRecord.opportunity_stages,
          });
        }

        // Add standard ID fields for consistency
        const processedRecord = {
          ...familyRecord,
          standard_id: familyRecord.family_id,
          alternate_id: familyRecord.pdc_family_id_c || null,
        };

        logger.debug(`Successfully fetched family record for ID: ${familyId}`);
        return { success: true, data: processedRecord, error: null };
      } catch (sqlError) {
        // Try direct POST request if RPC fails
        logger.warn("RPC execute_sql_query failed, trying direct POST request", sqlError);

        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql_query`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              query: query,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            logger.warn(`Error with direct SQL POST: ${response.status} - ${errorText}`);
            throw new Error(`SQL query failed: ${response.status} - ${errorText}`);
          }

          const data = await response.json();

          if (!data || (Array.isArray(data) && data.length === 0)) {
            return {
              success: false,
              data: null,
              error: `Family with ID ${familyId} not found`,
            };
          }

          const familyRecord = Array.isArray(data) ? data[0] : data;

          // Add standard ID fields for consistency
          const processedRecord = {
            ...familyRecord,
            standard_id: familyRecord.family_id,
            alternate_id: familyRecord.pdc_family_id_c || null,
          };

          return { success: true, data: processedRecord, error: null };
        } catch (directError) {
          logger.error("All family record fetch approaches failed", directError);
          throw directError;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error(`Error fetching family record for ID ${familyId}:`, err);
      return { success: false, data: null, error: errorMessage };
    }
  }

  public async testConnection() {
    try {
      // Test public schema access
      const { error: publicError } = await this.regular
        .from("campuses")
        .select("campus_id")
        .limit(1);

      // Test fivetran_views schema access
      const { error: fivetranError } = await this.executeRPC("test_salesforce_connection");

      return {
        success: true,
        publicSchema: !publicError,
        fivetranViewsSchema: !fivetranError,
      };
    } catch (err) {
      logger.error("Error testing connection:", err);
      return {
        success: false,
        publicSchema: false,
        fivetranViewsSchema: false,
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

/**
 * Fetch enhanced family record with structured student information
 * @param familyId The ID of the family to fetch
 * @returns Result with success status and family data
 */
export async function getEnhancedFamilyRecord(
  familyId: string
): Promise<OperationResponse<Record<string, unknown>>> {
  try {
    if (!familyId) {
      return { success: false, data: null, error: "No family ID provided" };
    }

    logger.debug(`Fetching enhanced family record for ID: ${familyId}`);

    // Clean and sanitize the ID input
    const sanitizedId = familyId.replace(/'/g, "''");

    // Try the RPC approach specifically via the Supabase function interface
    // This might work better than the general RPC method for schema-qualified functions
    try {
      // First try the function call through the more direct REST API approach
      const functionName = "get_enhanced_family_record";
      const functionUrl = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;

      logger.debug(`Attempting direct function call via REST API: ${functionUrl}`);

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          family_id_param: sanitizedId,
        }),
      });

      // If the function call works, process the result
      if (response.ok) {
        const data = await response.json();
        logger.debug("Successfully retrieved data using direct function call");
        return { success: true, data, error: null };
      }

      // Log the error for diagnostic purposes
      logger.warn(`Direct function call failed with status ${response.status}`);

      // Try the schema-qualified function name - some Supabase instances require this
      const schemaQualifiedName = "fivetran_views.get_enhanced_family_record";
      const schemaFunctionUrl = `${SUPABASE_URL}/rest/v1/rpc/${schemaQualifiedName}`;

      logger.debug(`Attempting schema-qualified function call: ${schemaFunctionUrl}`);

      try {
        const schemaResponse = await fetch(schemaFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            family_id_param: sanitizedId,
          }),
        });

        if (schemaResponse.ok) {
          const data = await schemaResponse.json();
          logger.debug("Successfully retrieved data using schema-qualified function call");
          return { success: true, data, error: null };
        }

        logger.warn(
          `Schema-qualified function call also failed with status ${schemaResponse.status}`
        );
      } catch (schemaErr) {
        logger.warn("Schema-qualified function call failed with exception:", schemaErr);
      }

      // Fallback to direct SQL approach
      // Construct the SQL query directly to call the function in the correct schema
      const query = `
        SELECT fivetran_views.get_enhanced_family_record('${sanitizedId}') as family_record
      `;

      logger.debug(`Executing direct SQL query: ${query}`);

      // Execute SQL via executeRPC helper method which has better error handling
      const { success, data, error } = await supabase.executeRPC("execute_sql_query", {
        query_text: query,
      });

      if (!success || error) {
        logger.error(`Execute SQL query failed: ${error}`);

        // Try a more direct approach as a last resort
        throw new Error("Execute SQL query via RPC failed, attempting direct fetch");
      }

      // Parse the result data
      if (!data) {
        return {
          success: false,
          data: null,
          error: `Family with ID ${familyId} not found in the database.`,
        };
      }

      // Handle different result formats
      let result;

      if (Array.isArray(data) && data.length > 0) {
        result = data[0];
      } else if (data && typeof data === "object") {
        if ("rows" in data) {
          // Standard rows format from execute_sql_query
          const rows = data.rows as any[];
          if (rows.length > 0) {
            result = rows[0];
          } else {
            return {
              success: false,
              data: null,
              error: `Family with ID ${familyId} not found in the database.`,
            };
          }
        } else if ("family_record" in data) {
          // Result from direct query with an aliased function result
          result = data.family_record;
        } else {
          // Direct object return format
          result = data;
        }
      } else {
        result = data;
      }

      // Ensure the result is properly structured
      if (result && typeof result === "string") {
        try {
          // Sometimes Postgres returns JSON as a string
          result = JSON.parse(result);
        } catch (e) {
          logger.warn("Failed to parse result string as JSON", e);
        }
      }

      logger.debug("Successfully parsed family record data");
      return { success: true, data: result, error: null };
    } catch (sqlErr) {
      logger.warn("Primary SQL approach failed, trying direct fetch:", sqlErr);

      // Final fallback: Use a direct fetch as last resort
      try {
        // Construct a simpler direct query that should work even with minimal permissions
        const fallbackQuery = `
          SELECT 
            a.id as family_id,
            a.name as family_name,
            a.pdc_family_id_c,
            a.current_campus_c,
            c.name as current_campus_name
          FROM 
            fivetran_views.account a
          LEFT JOIN
            fivetran_views.campus_c c ON a.current_campus_c = c.id
          WHERE 
            a.id = '${sanitizedId}'
          LIMIT 1
        `;

        logger.debug("Using fallback direct fetch with simplified query");

        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql_query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            query_text: fallbackQuery,
          }),
        });

        if (!response.ok) {
          throw new Error(`Direct fetch failed: ${response.status}`);
        }

        const data = await response.json();

        // Extract the result from the response
        let result;
        if (Array.isArray(data)) {
          result = data.length > 0 ? data[0] : null;
        } else if (data && typeof data === "object" && "rows" in data) {
          const rows = data.rows as any[];
          result = rows.length > 0 ? rows[0] : null;
        } else {
          result = data;
        }

        if (!result) {
          return {
            success: false,
            data: null,
            error: `Family with ID ${familyId} not found in the database.`,
          };
        }

        // This is a minimal record - mark it as such
        result.is_minimal_record = true;
        result.students = [];
        result.contacts = [];

        logger.info("Retrieved minimal family record using fallback method");
        return { success: true, data: result, error: null };
      } catch (directErr) {
        const errorMessage = directErr instanceof Error ? directErr.message : "Unknown error";
        logger.error("All family record fetch approaches failed:", directErr);
        return {
          success: false,
          data: null,
          error: `Failed to fetch family record: ${errorMessage}`,
        };
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Error fetching enhanced family record for ID ${familyId}:`, err);
    return { success: false, data: null, error: errorMessage };
  }
}
