import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase URL and key from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableDetails(schema, table) {
  try {
    // Get column details
    const query = `SELECT column_name, data_type, character_maximum_length, 
                 column_default, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = '${schema}' 
            AND table_name = '${table}'
          ORDER BY ordinal_position`;
    
    const { data: columns, error } = await supabase.rpc('execute_sql_query', {
      query_text: query
    });
    
    if (error) {
      console.error(`Error fetching columns for ${schema}.${table}:`, error);
      return;
    }
    
    console.log(`\nColumns for ${schema}.${table}:`);
    columns.forEach(col => {
      let type = col.data_type;
      if (col.character_maximum_length) {
        type += `(${col.character_maximum_length})`;
      }
      console.log(`- ${col.column_name}: ${type}${col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}${col.column_default ? ' DEFAULT ' + col.column_default : ''}`);
    });
    
    return columns;
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function main() {
  // Get details for key tables
  console.log('GETTING TABLE SCHEMA DETAILS');
  await getTableDetails('public', 'campuses');
  await getTableDetails('public', 'real_estate_pipeline');
  await getTableDetails('fivetran_views', 'lead');
  await getTableDetails('fivetran_views', 'opportunity');
}

main();