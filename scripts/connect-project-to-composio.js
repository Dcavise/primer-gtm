import { Composio } from "composio-core";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory first, then script-specific ones
const parentEnvPath = path.resolve(process.cwd(), '.env');
const localEnvPath = path.resolve(__dirname, '.env');

if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
}
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

async function connectSupabaseProject() {
  console.log("Connecting Supabase Project to Composio...");
  
  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const composioApiKey = process.env.COMPOSIO_API_KEY || "e73t7ope78jraacknx7m2h";
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing required environment variables.");
    console.error("Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in your .env file.");
    process.exit(1);
  }
  
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  const composio = new Composio({ apiKey: composioApiKey });
  
  try {
    // Create a new connected account for the specific Supabase project
    const connection = await composio.connectedAccounts.create({
      name: "Primer GTM Supabase",
      type: "supabase",
      supabase: {
        url: supabaseUrl,
        key: supabaseKey
      }
    });
    
    console.log("\n✅ Supabase Project successfully connected to Composio!");
    console.log("Connection ID:", connection.id);
    console.log("Connection Name:", connection.name);
    
    // Now that we have this connection, let's test it by listing schemas
    console.log("\nTesting connection by listing database schemas...");
    
    const schemas = await composio.supabase.schemas.list({
      connectedAccountId: connection.id
    });
    
    console.log("\nAvailable schemas:");
    console.log(schemas);
    
    // Try to specifically list functions in fivetran_views schema
    if (schemas.includes("fivetran_views")) {
      console.log("\nListing functions in fivetran_views schema...");
      
      const functions = await composio.supabase.functions.list({
        connectedAccountId: connection.id,
        schema: "fivetran_views"
      });
      
      console.log("\nFunctions in fivetran_views schema:");
      console.log(functions);
    } else {
      console.log("\nfivetran_views schema not found in this database!");
    }
    
    // Return the connection ID for future reference
    console.log("\nIMPORTANT: Update your scripts/supabase-langchain-agent.js file with this connection ID:");
    console.log("connectedAccountId: \"" + connection.id + "\"");
    
    return connection.id;
  } catch (error) {
    console.error("Error connecting Supabase Project to Composio:", error);
  }
}

// Execute the function
connectSupabaseProject().catch(console.error);
