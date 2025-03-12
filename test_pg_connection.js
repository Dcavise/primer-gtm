// Test PostgreSQL connection using pg module
import pg from 'pg';
const { Client } = pg;

// Connection configuration
const config = {
  host: 'pudncilureqpzxrxfupr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Logistimatics123!',
  ssl: {
    rejectUnauthorized: false
  }
};

async function testConnection() {
  const client = new Client(config);
  
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connection successful!');
    
    // Test query
    const res = await client.query('SELECT current_database() as db, current_user as user');
    console.log('Database info:', res.rows[0]);
    
    // Query fivetran_views schema
    const schemaRes = await client.query("SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'fivetran_views')");
    console.log('Fivetran views schema exists:', schemaRes.rows[0].exists);
    
    // List schemas
    const schemasRes = await client.query("SELECT schema_name FROM information_schema.schemata ORDER BY schema_name");
    console.log('Available schemas:', schemasRes.rows.map(row => row.schema_name));
    
    // List tables in fivetran_views
    if (schemaRes.rows[0].exists) {
      const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'fivetran_views' ORDER BY table_name LIMIT 10");
      console.log('Some tables in fivetran_views:', tablesRes.rows.map(row => row.table_name));
    }
    
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

testConnection();