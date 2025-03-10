import salesforceService from '@/features/salesforce/services/salesforce-service';
import { supabase } from '@/integrations/supabase-client';
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';

/**
 * Simplified test for Salesforce schema access using the unified client
 */
export const testSalesforceConnection = async () => {
  try {
    logger.info('Testing Salesforce connection using salesforce service...');
    
    // Use the service's testConnection method
    const connectionResult = await salesforceService.testConnection();
    
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
    
    // Check if we can access the lead table 
    if (connectionResult.leadTableAccessible) {
      // Troubleshoot to get table list
      const { fivetranTables = [] } = await salesforceService.troubleshootSchemaAccess();
      const tables = fivetranTables.map((table: any) => table.table_name);
      
      // Format the results in the expected structure for backward compatibility
      return {
        regularClient: { 
          success: connectionResult.publicSchema, 
          error: null, 
          data: { publicSchema: connectionResult.publicSchema }
        },
        adminClient: { 
          success: connectionResult.fivetranViewsSchema, 
          error: null, 
          data: connectionResult.leadTableAccessible ? { leadTableAccess: true } : null
        },
        salesforceAccess: connectionResult.fivetranViewsSchema,
        usingAdminClient: false,
        tables: tables.length > 0 ? tables : ['lead'] // Fallback to at least showing lead
      };
    } else {
      return {
        regularClient: { 
          success: connectionResult.publicSchema, 
          error: null, 
          data: { publicSchema: connectionResult.publicSchema }
        },
        adminClient: { 
          success: false, 
          error: new Error("Cannot access lead table"), 
          data: null
        },
        salesforceAccess: false,
        usingAdminClient: false,
        tables: []
      };
    }
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
    
    // Use the service's querySalesforceTable method
    const { success, data, error } = await salesforceService.querySalesforceTable('lead', limit);
    
    if (success && data) {
      logger.info(`Successfully fetched ${Array.isArray(data) ? data.length : 0} leads`);
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