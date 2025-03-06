// Script to update Supabase client imports
import fs from 'fs';
import path from 'path';

// List of files to update - add your list of files here
const filesToUpdate = [
  '/Users/davidcavise/primer-gtm/src/components/CommentForm.tsx',
  '/Users/davidcavise/primer-gtm/src/components/CommentsSection.tsx',
  '/Users/davidcavise/primer-gtm/src/components/FellowsDataSync.tsx',
  '/Users/davidcavise/primer-gtm/src/components/FileList.tsx',
  '/Users/davidcavise/primer-gtm/src/components/FileMetadataHandler.tsx',
  '/Users/davidcavise/primer-gtm/src/components/FileUpload.tsx',
  '/Users/davidcavise/primer-gtm/src/components/GoogleSheetsDataSync.tsx',
  '/Users/davidcavise/primer-gtm/src/components/realestate/PropertyBasicInfo.tsx',
  '/Users/davidcavise/primer-gtm/src/components/realestate/PropertyContactInfo.tsx',
  '/Users/davidcavise/primer-gtm/src/components/realestate/PropertyDetailDialog.tsx',
  '/Users/davidcavise/primer-gtm/src/components/realestate/PropertyLeaseInfo.tsx',
  '/Users/davidcavise/primer-gtm/src/components/realestate/PropertyStatusInfo.tsx',
  '/Users/davidcavise/primer-gtm/src/components/salesforce/CampusSelector.tsx',
  '/Users/davidcavise/primer-gtm/src/components/salesforce/LeadsByWeekChart.tsx',
  '/Users/davidcavise/primer-gtm/src/components/salesforce/LeadsDataTable.tsx',
  '/Users/davidcavise/primer-gtm/src/components/salesforce/MetricsDashboard.tsx',
  '/Users/davidcavise/primer-gtm/src/components/salesforce/SchemaDebugger.tsx',
  '/Users/davidcavise/primer-gtm/src/components/salesforce/SimpleDatabaseTest.tsx',
  '/Users/davidcavise/primer-gtm/src/components/salesforce/StatsCardGrid.tsx',
  '/Users/davidcavise/primer-gtm/src/components/salesforce/SupabaseConnectionTest.tsx',
  '/Users/davidcavise/primer-gtm/src/contexts/AuthContext.tsx',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/useCampuses.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/useFellowsStats.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/useLeadsStats.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/useMetrics.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/useOpportunitiesStats.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/useStats.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/__tests__/setupTests.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/__tests__/useSalesforceData.test.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/salesforce/__tests__/useSyncSalesforce.test.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/use-census-data.tsx',
  '/Users/davidcavise/primer-gtm/src/hooks/__tests__/use-census-data.test.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/use-salesforce-access-diagnostic.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/use-salesforce-data.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/use-schools-data.tsx',
  '/Users/davidcavise/primer-gtm/src/hooks/useReEstateSync.ts',
  '/Users/davidcavise/primer-gtm/src/hooks/useRealEstatePipeline.ts',
  '/Users/davidcavise/primer-gtm/src/lib/serverComms.ts',
  '/Users/davidcavise/primer-gtm/src/services/__tests__/api-config.test.ts',
  '/Users/davidcavise/primer-gtm/src/services/api-config.ts',
  '/Users/davidcavise/primer-gtm/src/services/contacts-api.ts',
  '/Users/davidcavise/primer-gtm/src/services/permits-api.ts',
  '/Users/davidcavise/primer-gtm/src/services/zoning-api.ts',
  '/Users/davidcavise/primer-gtm/src/utils/salesforce-access.ts',
  '/Users/davidcavise/primer-gtm/src/utils/test-salesforce.ts'
];

let successCount = 0;
let errorCount = 0;

filesToUpdate.forEach(filePath => {
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the import statement
    const updatedContent = content.replace(
      /import (.*) from ['"]@\/integrations\/supabase\/client['"];/g,
      'import $1 from \'@/integrations/supabase-client\';'
    );
    
    // Write the updated content back
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`✅ Updated: ${path.basename(filePath)}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Error updating ${path.basename(filePath)}:`, error.message);
    errorCount++;
  }
});

console.log(`\nUpdate complete! ${successCount} files updated successfully, ${errorCount} files had errors.`);