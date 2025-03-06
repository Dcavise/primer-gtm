import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';

/**
 * Simplified test for Salesforce schema access using the unified client
 */
export const testSalesforceConnection = async () => {
  try {
    logger.info('Testing Salesforce connection using unified client...');
    
    // Use the unified client's testConnection method
    const connectionResult = await supabase.testConnection();
    
    if (!connectionResult.success) {
      logger.error('Connection test failed:', connectionResult.error);
      return {
        regularClient: { success: false, error: connectionResult.error, data: null },
        adminClient: { success: false, error: connectionResult.error, data: null },
        salesforceAccess: false,
        usingAdminClient: false,
        tables: []
      };
    }
    
    // Check if we can access the lead table via RPC
    const { success, data, error, usingAdminClient } = await supabase.querySalesforceTable('lead', 1);
    
    // Format the results in the expected structure for backward compatibility
    return {
      regularClient: { 
        success: connectionResult.publicSchema, 
        error: null, 
        data: { publicSchema: connectionResult.publicSchema }
      },
      adminClient: { 
        success: success, 
        error: error, 
        data: data ? { leadTableAccess: true } : null
      },
      salesforceAccess: success,
      usingAdminClient: usingAdminClient || false,
      tables: success ? ['lead'] : []
    };
  } catch (error) {
    logger.error('Error testing Salesforce connection:', error);
    return {
      regularClient: { success: false, error, data: null },
      adminClient: { success: false, error, data: null },
      salesforceAccess: false,
      usingAdminClient: false,
      tables: []
    };
  }
};

/**
 * Gets a sample of leads from the fivetran_views schema
 */
export const getSampleLeads = async (limit = 5) => {
  try {
    logger.info(`Fetching sample of ${limit} Salesforce leads`);
    
    // Use the unified client's querySalesforceTable method
    const { success, data, error, usingAdminClient } = await supabase.querySalesforceTable('lead', limit);
    
    if (success && data) {
      logger.info(`Successfully fetched ${Array.isArray(data) ? data.length : 0} leads${usingAdminClient ? ' (using admin client)' : ''}`);
      return { success: true, error: null, data };
    }
    
    // Access failed
    toast({
      title: "Data Access Error",
      description: "Could not access leads data. Please check your database configuration.",
      variant: "destructive"
    });
    
    logger.error('Error fetching sample leads:', error || 'No data returned');
    return { 
      success: false, 
      error: error || new Error("No leads found"), 
      data: null 
    };
  } catch (error) {
    logger.error('Error getting sample leads:', error);
    return { success: false, error, data: null };
  }
};