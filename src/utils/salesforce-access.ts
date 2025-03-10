/**
 * @deprecated Use the salesforce-service from @/features/salesforce/services instead
 * This is a wrapper for backward compatibility
 */

import salesforceService from '@/features/salesforce/services/salesforce-service';

export const querySalesforceTable = salesforceService.querySalesforceTable;
export const getWeeklyLeadCounts = salesforceService.getWeeklyLeadCounts;
export const getDailyLeadCount = salesforceService.getDailyLeadCount;
export const getLeadSummaryByCampus = salesforceService.getLeadSummaryByCampus;
export const testConnection = salesforceService.testConnection;
export const troubleshootSchemaAccess = salesforceService.troubleshootSchemaAccess;

// Export the combined salesforce service
export default salesforceService;