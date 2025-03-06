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
    toast({
      title: "Salesforce Connection",
      description: "Testing Salesforce connection...",
      variant: "default"
    });
    
    // Check if we can access the salesforce tables in public schema
    const { data: tableData, error: tableError } = await supabaseAdmin.rpc('execute_sql_query', {
      query_text: 'SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'lead\')',
      query_params: []
    });
    
    const leadTableExists = tableData && tableData[0] && tableData[0].exists;
    
    if (tableError || !leadTableExists) {
      logger.error('Admin client cannot access lead table in public schema:', tableError || 'Table does not exist');
      results.adminClient = { 
        success: false, 
        error: tableError || new Error('Lead table does not exist in public schema'), 
        data: null 
      };
    } else {
      // Lead table exists in public schema
      const { data: contactData, error: contactError } = await supabaseAdmin.rpc('execute_sql_query', {
        query_text: 'SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'contact\')',
        query_params: []
      });
      
      const contactTableExists = contactData && contactData[0] && contactData[0].exists;
      
      if (contactError || !contactTableExists) {
        logger.error('Admin client cannot access contact table in public schema:', contactError || 'Table does not exist');
        results.adminClient = {
          success: true,  // Lead table exists but contact table might not
          error: contactError || new Error('Contact table does not exist in public schema'),
          data: { leadTableExists: true, contactTableExists: false }
        };
      } else {
        // Successfully accessed lead and contact tables in public schema
        logger.info('Admin client can access lead and contact tables in public schema');
        results.adminClient = {
          success: true,
          error: null,
          data: { leadTableExists: true, contactTableExists: true }
        };
        
        results.salesforceAccess = true;
        results.usingAdminClient = true;
      }
    }
    
    // 2. Also test the regular client for connection health
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
    
    // 3. If we have access, try to list available salesforce tables in the public schema
    if (results.salesforceAccess) {
      // Get salesforce tables in public schema
      const { data: tablesData, error: tablesError } = await supabaseAdmin.rpc('execute_sql_query', {
        query_text: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name IN (\'lead\', \'contact\', \'opportunity\', \'account\', \'campaign\') ORDER BY table_name',
        query_params: []
      });
      
      if (!tablesError && Array.isArray(tablesData)) {
        results.tables = tablesData.map(row => row.table_name);
        logger.info(`Found ${results.tables.length} Salesforce tables`);
      } else {
        logger.warn('Could not list Salesforce tables:', tablesError);
      }
      
      toast({
        title: "Salesforce Data Connection",
        description: "Connection to Salesforce data tables established!",
        variant: "default"
      });
    } else {
      toast({
        title: "Salesforce Data Connection",
        description: "Could not access Salesforce data tables",
        variant: "destructive"
      });
    }
    
    return results;
  } catch (error) {
    logger.error('Error testing Salesforce connection:', error);
    toast({
      title: "Salesforce Connection",
      description: "Error testing Salesforce connection",
      variant: "destructive"
    });
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