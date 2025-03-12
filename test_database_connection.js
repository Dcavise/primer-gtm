// Test database connection using Supabase's admin API
import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const supabaseUrl = 'https://pudncilureqpzxrxfupr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTEyMzU1NSwiZXhwIjoyMDU2Njk5NTU1fQ.iqKJG8oVO_APMtp2B9gLZ8wIf7Xc4LuM_Qmfz5_WiZs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection via Supabase API...');
    
    // Test basic query with execute_sql_query RPC function
    const { data: testData, error: testError } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT current_database(), current_user'
    });
    
    if (testError) {
      throw testError;
    }
    
    console.log('Connection successful!');
    console.log('Database info:', testData[0]);
    
    // List schemas
    const { data: schemasData, error: schemasError } = await supabase.rpc('execute_sql_query', {
      query_text: "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name"
    });
    
    if (schemasError) {
      throw schemasError;
    }
    
    console.log('Available schemas:', schemasData.map(row => row.schema_name));
    
    // Check if fivetran_views schema exists
    const { data: fivetranData, error: fivetranError } = await supabase.rpc('execute_sql_query', {
      query_text: "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'fivetran_views')"
    });
    
    if (fivetranError) {
      throw fivetranError;
    }
    
    console.log('Fivetran views schema exists:', fivetranData[0].exists);
    
    // Get tables in fivetran_views schema
    if (fivetranData[0].exists) {
      const { data: tablesData, error: tablesError } = await supabase.rpc('execute_sql_query', {
        query_text: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'fivetran_views' ORDER BY table_name LIMIT 10"
      });
      
      if (tablesError) {
        throw tablesError;
      }
      
      console.log('Tables in fivetran_views schema (first 10):', tablesData.map(row => row.table_name));
      
      // Get a sample from the lead table
      const { data: leadData, error: leadError } = await supabase.rpc('execute_sql_query', {
        query_text: "SELECT * FROM fivetran_views.lead LIMIT 1"
      });
      
      if (leadError) {
        throw leadError;
      }
      
      console.log('Sample lead data:', leadData.length > 0 ? 'Retrieved successfully' : 'No data');
      console.log('Lead fields:', leadData.length > 0 ? Object.keys(leadData[0]).slice(0, 10) : 'None');
    }
    
  } catch (error) {
    console.error('Error testing database connection:', error);
  }
}

testDatabaseConnection();