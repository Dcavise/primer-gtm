import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// First, read our new utility file
const utilityFile = fs.readFileSync('/Users/davidcavise/primer-gtm/src/utils/salesforce-fivetran-access.ts', 'utf8');
console.log('Loaded utility file');

// Convert the TypeScript code to JavaScript (very simple conversion)
const jsUtility = utilityFile
  .replace(/import[^;]*;/g, '') // Remove import statements
  .replace(/export const/g, 'const') // Remove exports
  .replace(/: [a-zA-Z<>|=[\]]*( \| null)? =/g, ' =') // Remove TypeScript types
  .replace(/:[^=\n,]+(,|\n)/g, '$1') // Remove more types
  .replace(/logger\.[a-z]+\([^)]*\);/g, '') // Remove logging
  .trim();

// Add our imports and exports
const fullJsUtility = `
// Auto-converted from TypeScript
const supabase = createClient("${supabaseUrl}", "${supabaseKey}");

${jsUtility}

// Export the functions for testing
export { querySalesforceTable, getWeeklyLeadCounts, getLeadSummaryByCampus, testFivetranConnection };
`;

// Write to a temporary JS file
fs.writeFileSync('/Users/davidcavise/primer-gtm/temp_utility.js', fullJsUtility, 'utf8');
console.log('Wrote temporary JS utility');

// Import and test the functions
import('./temp_utility.js')
  .then(async ({ querySalesforceTable, getWeeklyLeadCounts, testFivetranConnection }) => {
    console.log('=== Testing fivetran_views Connection ===');
    const connectionTest = await testFivetranConnection();
    console.log('Connection test result:', connectionTest);
    
    if (connectionTest.success) {
      console.log('\n=== Testing Query Salesforce Table ===');
      const leadQuery = await querySalesforceTable('lead', 5);
      console.log('Lead query success:', leadQuery.success);
      if (leadQuery.success && leadQuery.data) {
        console.log('Lead count:', leadQuery.data.length);
        console.log('Sample fields:', Object.keys(leadQuery.data[0]).slice(0, 5));
      } else if (leadQuery.error) {
        console.error('Lead query error:', leadQuery.error);
      }
      
      // Get dates for weekly lead counts
      const today = new Date();
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(today.getDate() - 42);
      
      console.log('\n=== Testing Weekly Lead Counts ===');
      const weeklyCounts = await getWeeklyLeadCounts(
        sixWeeksAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      
      console.log('Weekly counts success:', weeklyCounts.success);
      if (weeklyCounts.success && weeklyCounts.data) {
        console.log('Weekly data points:', weeklyCounts.data.length);
        if (weeklyCounts.data.length > 0) {
          console.log('Sample data:', weeklyCounts.data[0]);
        }
      } else if (weeklyCounts.error) {
        console.error('Weekly counts error:', weeklyCounts.error);
      }
    }
  })
  .catch(err => {
    console.error('Error importing utility:', err);
  })
  .finally(() => {
    // Clean up - remove temporary file
    setTimeout(() => {
      try {
        fs.unlinkSync('/Users/davidcavise/primer-gtm/temp_utility.js');
        console.log('Removed temporary utility file');
      } catch (err) {
        console.error('Error removing temp file:', err);
      }
    }, 1000); // Small delay to ensure we're done with the file
  });