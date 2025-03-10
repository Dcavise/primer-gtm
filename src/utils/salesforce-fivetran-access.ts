/**
 * @deprecated Use the salesforce-service from @/features/salesforce/services instead
 * This is a wrapper for backward compatibility
 */

import salesforceService from '@/features/salesforce/services/salesforce-service';

export const querySalesforceTable = salesforceService.querySalesforceTable;
export const getWeeklyLeadCounts = salesforceService.getWeeklyLeadCounts;
export const getLeadSummaryByCampus = salesforceService.getLeadSummaryByCampus;
export const testFivetranConnection = salesforceService.testConnection;

// Export the combined salesforce service
export default salesforceService;