import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file or hardcoded values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dnifcmkfeyubpthphirv.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuaWZjbWtmZXl1YnB0aHBoaXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk5MzQwMDcsImV4cCI6MjAyNTUxMDAwN30.VV2-GKL_Dv42U7Jj1vwYN35JA-TNa60-1DY9X3Gqgj8';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryHighestTuition() {
  console.log('Querying highest total_tuition_c values...');
  
  try {
    // Get the top 20 highest total_tuition_c values
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: `
        SELECT 
          id, 
          name, 
          total_tuition_c,
          full_tuition_c,
          family_contribution_c,
          actualized_financial_aid_c,
          stage_name 
        FROM fivetran_views.opportunity 
        WHERE total_tuition_c IS NOT NULL 
        ORDER BY total_tuition_c DESC 
        LIMIT 20
      `
    });
    
    if (error) {
      console.error('Error querying tuition data:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Top 20 highest total_tuition_c values:');
      console.log('------------------------------------');
      
      // Calculate statistics
      const values = data.map(row => parseFloat(row.total_tuition_c));
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      console.log(`Statistics for total_tuition_c values:`);
      console.log(`Count: ${values.length}`);
      console.log(`Minimum: $${min.toLocaleString()}`);
      console.log(`Maximum: $${max.toLocaleString()}`);
      console.log(`Average: $${avg.toLocaleString()}`);
      console.log('------------------------------------');
      
      // Print detailed data
      data.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Stage: ${row.stage_name}`);
        console.log(`   Total Tuition: $${parseFloat(row.total_tuition_c).toLocaleString()}`);
        console.log(`   Full Tuition: $${row.full_tuition_c ? parseFloat(row.full_tuition_c).toLocaleString() : 'N/A'}`);
        console.log(`   Family Contribution: $${row.family_contribution_c ? parseFloat(row.family_contribution_c).toLocaleString() : 'N/A'}`);
        console.log(`   Financial Aid: $${row.actualized_financial_aid_c ? parseFloat(row.actualized_financial_aid_c).toLocaleString() : 'N/A'}`);
        console.log('------------------------------------');
      });
    } else {
      console.log('No tuition data found or all values are NULL');
    }
  } catch (err) {
    console.error('Exception executing query:', err);
  }
}

// Run the query
queryHighestTuition()
  .catch(err => {
    console.error('Unexpected error:', err);
  });