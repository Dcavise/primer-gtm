import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, querySalesforceSchema } from '@/integrations/supabase/admin-client';
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';

/**
 * Comprehensive test for Salesforce schema access
 * This tests both regular and admin client access paths
 */
export const testSalesforceConnection = async () => {
  const results = {
    regularClient: { success: false, error: null, data: null },
    adminClient: { success: false, error: null, data: null },
    salesforceAccess: false,
    usingAdminClient: false,
    tables: [] as string[]
  };
  
  try {
    logger.info('Testing Salesforce connection with admin client using direct SQL...');
    
    // First check if the admin client has a valid service key
    if (!supabaseAdmin.auth.getSession) {
      logger.error('Admin client is not properly configured. Missing service key.');
      return {
        ...results,
        error: new Error('Admin client is not properly configured')
      };
    }
    
    // Try a simpler method first - test with a standard RPC function that should exist
    try {
      const { data: queryData, error: queryError } = await supabaseAdmin.rpc('query_salesforce_table', {
        table_name: 'lead',
        limit_count: 1
      });
      
      if (!queryError && Array.isArray(queryData)) {
        // Successfully queried lead table directly via RPC
        logger.info('Successfully accessed lead table via RPC function');
        results.adminClient = {
          success: true,
          error: null,
          data: { leadTableAccess: true }
        };
        
        results.salesforceAccess = true;
        results.usingAdminClient = true;
        results.tables = ['lead']; // At minimum we know lead exists
        
        return results;
      }
    } catch (rpcError) {
      logger.warn('RPC query_salesforce_table failed, trying alternative methods:', rpcError);
      // Continue to try other methods
    }
    
    // Check if we can access the lead table in fivetran_views schema
    try {
      const { data: tableData, error: tableError } = await supabaseAdmin.rpc('execute_sql_query', {
        query_text: 'SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = \'fivetran_views\' AND table_name = \'lead\')',
        query_params: []
      });
      
      const leadTableExists = tableData && tableData[0] && tableData[0].exists;
      
      if (tableError || !leadTableExists) {
        logger.error('Admin client cannot access lead table in fivetran_views schema:', tableError || 'Table does not exist');
        
        // Try public schema as a fallback
        try {
          const { data: publicData, error: publicError } = await supabaseAdmin.rpc('execute_sql_query', {
            query_text: 'SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'lead\')',
            query_params: []
          });
          
          const publicLeadTableExists = publicData && publicData[0] && publicData[0].exists;
          
          if (publicError || !publicLeadTableExists) {
            logger.error('Admin client cannot access lead table in public schema either:', publicError || 'Table does not exist');
            results.adminClient = { 
              success: false, 
              error: tableError || new Error('Lead table does not exist in fivetran_views or public schema'), 
              data: null 
            };
          } else {
            // Lead table exists in public schema
            logger.info('Lead table found in public schema');
            results.adminClient = {
              success: true,
              error: null,
              data: { leadTableExists: true, schema: 'public' }
            };
            
            results.salesforceAccess = true;
            results.usingAdminClient = true;
            results.tables = ['lead']; // At minimum we know lead exists
          }
        } catch (publicSchemaError) {
          logger.error('Error checking public schema:', publicSchemaError);
          results.adminClient = { 
            success: false, 
            error: publicSchemaError || new Error('Error checking for lead table in both schemas'), 
            data: null 
          };
        }
      } else {
        // Lead table exists in fivetran_views schema
        logger.info('Lead table found in fivetran_views schema');
        results.adminClient = {
          success: true,
          error: null,
          data: { leadTableExists: true, schema: 'fivetran_views' }
        };
        
        results.salesforceAccess = true;
        results.usingAdminClient = true;
        results.tables = ['lead']; // At minimum we know lead exists
      }
    } catch (sqlError) {
      logger.error('SQL query via execute_sql_query failed:', sqlError);
      // Continue with regular client test
    }
    
    // 2. Also test the regular client for connection health
    try {
      const { data: publicData, error: publicError } = await supabase
        .from('campuses')
        .select('*')
        .limit(1);
      
      if (publicError) {
        logger.error('Regular client connection failed:', publicError);
        results.regularClient = { 
          success: false, 
          error: publicError, 
          data: null 
        };
      } else {
        logger.info('Regular client connection successful');
        results.regularClient = {
          success: true,
          error: null,
          data: publicData
        };
      }
    } catch (clientError) {
      logger.error('Error testing regular client:', clientError);
      results.regularClient = {
        success: false,
        error: clientError,
        data: null
      };
    }
    
    return results;
  } catch (error) {
    logger.error('Error testing Salesforce connection:', error);
    return {
      ...results,
      error
    };
  }
};

/**
 * Gets a sample of leads from the public schema
 */
export const getSampleLeads = async (limit = 5) => {
  try {
    logger.info(`Fetching sample of ${limit} Salesforce leads from public schema`);
    
    // Use direct SQL query with the admin client - now from public schema
    const { data, error, success } = await querySalesforceSchema(
      'SELECT * FROM public.lead LIMIT $1',
      [limit]
    );
    
    if (!success || error) {
      logger.error('Error fetching sample leads:', error);
      return { success: false, error, data: null };
    }
    
    logger.info(`Successfully fetched ${data.length} leads`);
    return { success: true, error: null, data };
  } catch (error) {
    logger.error('Error getting sample leads:', error);
    return { success: false, error, data: null };
  }
}; 