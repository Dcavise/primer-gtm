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
  current_campus_name: string;
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
        | "fivetran_views.get_distinct_fellow_stages"
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
              c.name as current_campus_name,
              contact_count,
              opportunity_count,
              opportunity_is_won_flags,
              ARRAY[''] as opportunity_school_years,
              opportunity_preferred_campuses as opportunity_campuses,
              opportunity_stages
            FROM 
              fivetran_views.comprehensive_family_records_with_students fs
            LEFT JOIN
              fivetran_views.campus_c c ON fs.current_campus_c = c.id
            WHERE 
              family_name ILIKE '%${searchTerm}%' OR
              c.name ILIKE '%${searchTerm}%' OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(opportunity_names, 1) AS i 
                  WHERE 
                      opportunity_names[i] ILIKE '%${searchTerm}%'
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM fivetran_views.opportunity o
                  WHERE 
                      o.account_id = fs.family_id AND
                      (o.student_first_name_c ILIKE '%${searchTerm}%' OR
                       o.student_last_name_c ILIKE '%${searchTerm}%')
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM fivetran_views.derived_students s
                  WHERE 
                      s.family_id = fs.family_id AND
                      (s.first_name ILIKE '%${searchTerm}%' OR
                       s.last_name ILIKE '%${searchTerm}%' OR
                       s.full_name ILIKE '%${searchTerm}%')
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(contact_last_names, 1) AS i 
                  WHERE 
                      contact_last_names[i] ILIKE '%${searchTerm}%' OR
                      contact_emails[i] ILIKE '%${searchTerm}%' OR
                      contact_phones[i] ILIKE '%${searchTerm}%'
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM fivetran_views.contact c
                  WHERE 
                      c.account_id = fs.family_id AND
                      (c.first_name ILIKE '%${searchTerm}%' OR
                       c.last_name ILIKE '%${searchTerm}%' OR
                       c.email ILIKE '%${searchTerm}%' OR
                       c.phone ILIKE '%${searchTerm}%')
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(student_first_names, 1) AS i 
                  WHERE 
                      student_first_names[i] ILIKE '%${searchTerm}%' OR
                      student_last_names[i] ILIKE '%${searchTerm}%' OR
                      student_full_names[i] ILIKE '%${searchTerm}%'
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
              `Found ${processedResults.length} families from comprehensive_family_records_with_students SQL query`
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
              c.name as current_campus_name,
              contact_count,
              opportunity_count,
              ARRAY[false]::boolean[] as opportunity_is_won_flags,
              ARRAY['']::text[] as opportunity_school_years,
              ARRAY['']::text[] as opportunity_campuses,
              ARRAY['']::text[] as opportunity_stages
            FROM 
              fivetran_views.family_standard_ids fs
            LEFT JOIN
              fivetran_views.campus_c c ON fs.current_campus_c = c.id
            WHERE 
              family_name ILIKE '%${searchTerm}%' OR
              c.name ILIKE '%${searchTerm}%' OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(opportunity_names, 1) AS i 
                  WHERE 
                      opportunity_names[i] ILIKE '%${searchTerm}%'
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM fivetran_views.opportunity o
                  WHERE 
                      o.account_id = fs.family_id AND
                      (o.student_first_name_c ILIKE '%${searchTerm}%' OR
                       o.student_last_name_c ILIKE '%${searchTerm}%')
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM fivetran_views.derived_students s
                  WHERE 
                      s.family_id = fs.family_id AND
                      (s.first_name ILIKE '%${searchTerm}%' OR
                       s.last_name ILIKE '%${searchTerm}%' OR
                       s.full_name ILIKE '%${searchTerm}%')
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(contact_last_names, 1) AS i 
                  WHERE 
                      contact_last_names[i] ILIKE '%${searchTerm}%' OR
                      contact_emails[i] ILIKE '%${searchTerm}%' OR
                      contact_phones[i] ILIKE '%${searchTerm}%'
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM fivetran_views.contact c
                  WHERE 
                      c.account_id = fs.family_id AND
                      (c.first_name ILIKE '%${searchTerm}%' OR
                       c.last_name ILIKE '%${searchTerm}%' OR
                       c.email ILIKE '%${searchTerm}%' OR
                       c.phone ILIKE '%${searchTerm}%')
              ) OR
              EXISTS (
                  SELECT 1 
                  FROM generate_subscripts(student_first_names, 1) AS i 
                  WHERE 
                      student_first_names[i] ILIKE '%${searchTerm}%' OR
                      student_last_names[i] ILIKE '%${searchTerm}%' OR
                      student_full_names[i] ILIKE '%${searchTerm}%'
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
              `Found ${processedResults.length} families from family_standard_ids SQL query`
            );
          }
        } catch (sqlRpcError) {
          logger.warn("execute_sql_query RPC failed", sqlRpcError);
          // Continue to next approach
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
        current_campus_name: (family.current_campus_name as string) || "",
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
   * Get a family record by ID
   * @param familyId ID of the family to retrieve
   * @returns Result with success status and family data
   */
  public async getFamilyRecord(
    familyId: string
  ): Promise<OperationResponse<Record<string, unknown>>> {
    try {
      logger.debug(`Fetching family record for ID: ${familyId}`);

      // Use the fivetran_views schema for the query
      const query = `
        SELECT 
          f.family_id::uuid,
          f.family_name,
          f.pdc_family_id_c,
          f.current_campus_c,
          (f.contact_ids)::uuid[],
          f.contact_first_names,
          f.contact_last_names,
          f.contact_phones,
          f.contact_emails,
          f.contact_last_activity_dates,
          -- Student arrays with type casting
          ARRAY(
              SELECT s.id::uuid
              FROM fivetran_views.derived_students s
              WHERE s.family_id = family_id_param::varchar
          ) AS student_ids,
          ARRAY(
              SELECT s.first_name
              FROM fivetran_views.derived_students s
              WHERE s.family_id = family_id_param::varchar
          ) AS student_first_names,
          ARRAY(
              SELECT s.last_name
              FROM fivetran_views.derived_students s
              WHERE s.family_id = family_id_param::varchar
          ) AS student_last_names,
          ARRAY(
              SELECT s.full_name
              FROM fivetran_views.derived_students s
              WHERE s.family_id = family_id_param::varchar
          ) AS student_full_names,
          -- Rest of existing fields
          (f.opportunity_ids)::uuid[],
          f.opportunity_record_types,
          f.opportunity_names,
          f.opportunity_stages,
          f.opportunity_is_won_flags,
          f.opportunity_created_dates,
          f.opportunity_last_stage_change_dates,
          f.opportunity_lead_notes,
          f.opportunity_family_interview_notes,
          f.opportunity_preferred_campuses,
          f.opportunity_family_last_names,
          f.opportunity_pdc_user_ids,
          f.opportunity_grades,
          f.opportunity_pdc_profile_urls,
          f.opportunity_campuses,
          f.opportunity_actualized_financial_aids,
          (f.tuition_offer_ids)::uuid[],
          f.tuition_offer_created_dates,
          f.tuition_offer_accepted_dates,
          f.tuition_offer_enrollment_fees,
          f.tuition_offer_family_contributions,
          f.tuition_offer_statuses,
          f.tuition_offer_start_dates,
          f.tuition_offer_state_scholarships,
          f.tuition_offer_last_viewed_dates,
          f.contact_count,
          f.opportunity_count,
          (SELECT COUNT(*) FROM fivetran_views.derived_students s WHERE s.family_id = family_id_param::varchar) AS student_count,
          f.tuition_offer_count,
          f.latest_opportunity_date,
          f.latest_contact_activity_date,
          f.latest_tuition_offer_date
        FROM 
          fivetran_views.comprehensive_family_records_with_students f
        WHERE 
          f.family_id::varchar = family_id_param::varchar;
      `;

      // Sanitize the input to prevent SQL injection
      const sanitizedId = familyId.replace(/'/g, "''");

      try {
        // First approach: Use the execute_sql_query RPC function
        const { data, error } = await this.regular.rpc("execute_sql_query", {
          query_text: query,
          query_params: [sanitizedId],
        });

        if (error) {
          throw new Error(`SQL query failed: ${error.message}`);
        }

        // Extract the result from the response
        let result = null;
        if (data && typeof data === "object" && "rows" in data) {
          const rows = data.rows as any[];
          result = rows.length > 0 ? rows[0] : null;
        }

        if (!result) {
          return {
            success: false,
            data: null,
            error: `Family with ID ${familyId} not found in the database.`,
          };
        }

        logger.info("Retrieved family record using SQL query");
        return { success: true, data: result, error: null };
      } catch (sqlErr) {
        logger.warn("Primary SQL approach failed, trying direct fetch:", sqlErr);

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
      logger.error(`Error fetching family record for ID ${familyId}:`, err);
      return { success: false, data: null, error: errorMessage };
    }
  }

  /**
   * Get all family records
   * @returns Result with success status and family data
   */
  public async getAllFamilies(): Promise<OperationResponse<FamilySearchResult[]>> {
    try {
      logger.debug("Fetching all family records");
      
      // Use the fivetran_views schema for the query
      const { data, error } = await this.regular.rpc("fivetran_views.get_all_families");
      
      if (error) {
        logger.error("Error fetching all families:", error);
        return { success: false, data: [], error: error.message };
      }
      
      if (!data || !Array.isArray(data)) {
        logger.warn("No family records found or invalid response format");
        return { success: true, data: [], error: null };
      }
      
      // Process the results to add standardized IDs
      const processedResults = this.processSearchResults(data as Record<string, unknown>[]);
      
      logger.debug(`Retrieved ${processedResults.length} family records`);
      return { success: true, data: processedResults, error: null };
    } catch (err: unknown) {
      // Provide detailed error information
      const errorObj =
        err instanceof Error
          ? { message: err.message, stack: err.stack, name: err.name }
          : { error: String(err) };

      logger.error("Get all families failed:", JSON.stringify(errorObj, null, 2));
      return { success: false, data: [], error: JSON.stringify(errorObj) };
    }
  }

  /**
   * Get distinct fellow stages from fivetran_views.fellows
   * @returns Result with success status and array of distinct stage values
   */
  public async getFellowStages(): Promise<OperationResponse<string[]>> {
    try {
      logger.debug("Fetching distinct fellow stages from fivetran_views.fellows");
      
      // Use the fivetran_views schema directly as per project standards
      // Use hiring_stage column instead of stage (which doesn't exist)
      const query = `
        SELECT DISTINCT hiring_stage as stage 
        FROM fivetran_views.fellows 
        WHERE hiring_stage IS NOT NULL 
        ORDER BY hiring_stage
      `;
      
      logger.debug(`Executing query: ${query}`);
      
      // Execute the SQL query directly
      const { data, error } = await this.regular.rpc("execute_sql_query", {
        query_text: query
      });
      
      if (error) {
        logger.error("Error executing SQL query for fellow stages:", error);
        return { success: false, data: [], error: error.message };
      }
      
      // Log the raw response for debugging
      logger.debug("Raw response from execute_sql_query:", data);
      
      // Handle different response formats
      let stages: string[] = [];
      
      if (Array.isArray(data)) {
        // If data is already an array, extract the stage values
        logger.debug("Response is an array, extracting stages directly");
        stages = data.map(item => item.stage).filter(Boolean);
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.rows)) {
          // If data has a rows property that is an array
          logger.debug("Response has rows array, extracting stages from rows");
          stages = data.rows.map(row => row.stage).filter(Boolean);
        } else if (data.result && Array.isArray(data.result)) {
          // If data has a result property that is an array
          logger.debug("Response has result array, extracting stages from result");
          stages = data.result.map(item => item.stage).filter(Boolean);
        } else {
          // Try to extract values from any array property in the data
          const arrayProps = Object.entries(data)
            .find(([_, value]) => Array.isArray(value));
          
          if (arrayProps) {
            const [propName, arrayValue] = arrayProps;
            logger.debug(`Found array property ${propName}, extracting stages`);
            stages = (arrayValue as any[]).map(item => item.stage).filter(Boolean);
          } else {
            logger.warn("Could not find any array in the response:", data);
          }
        }
      }
      
      if (stages.length === 0) {
        logger.warn("No stages found in the response");
        return { success: false, data: [], error: "No stages found in the response" };
      }
        
      logger.debug(`Found ${stages.length} distinct fellow stages:`, stages);
      return { success: true, data: stages, error: null };
    } catch (err: unknown) {
      const errorObj =
        err instanceof Error
          ? { message: err.message, stack: err.stack, name: err.name }
          : { error: String(err) };

      logger.error("Failed to fetch fellow stages:", JSON.stringify(errorObj, null, 2));
      return { success: false, data: [], error: JSON.stringify(errorObj) };
    }
  }

  /**
   * Test database connection and schema access
   */
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

      if (Array.isArray(data)) {
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
