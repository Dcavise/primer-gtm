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

async function listComposioConnections() {
  console.log("Listing Composio Connected Accounts...");
  
  // Get Composio client using API key from env or fallback to provided key
  const apiKey = process.env.COMPOSIO_API_KEY || "e73t7ope78jraacknx7m2h";
  const composio = new Composio({ apiKey });
  
  try {
    // List all connected accounts
    const connections = await composio.connectedAccounts.list({});
    
    console.log("\n=== Composio Connected Accounts ===");
    if (connections && connections.length > 0) {
      connections.forEach((connection, index) => {
        console.log(`\nConnection #${index + 1}:`);
        console.log(`ID: ${connection.id}`);
        console.log(`Name: ${connection.name || 'Unnamed'}`);
        console.log(`Type: ${connection.type || 'Unknown'}`);
        console.log(`Connected: ${connection.connected ? 'Yes' : 'No'}`);
        console.log(`Created: ${new Date(connection.createdAt).toLocaleString()}`);
        
        // Show service-specific details if available
        if (connection.supabase) {
          console.log("\nSupabase Details:");
          console.log(`URL: ${connection.supabase.url}`);
          console.log(`Project ID: ${connection.supabase.projectId || 'Unknown'}`);
        }
      });
    } else {
      console.log("No connected accounts found.");
      console.log("\nTo connect a Supabase account, you can use:");
      console.log("composio.connectedAccounts.create({");
      console.log("  name: 'My Supabase Project',");
      console.log("  type: 'supabase',");
      console.log("  supabase: {");
      console.log("    url: process.env.SUPABASE_URL,");
      console.log("    key: process.env.SUPABASE_KEY");
      console.log("  }");
      console.log("});");
    }
  } catch (error) {
    console.error("Error listing Composio connections:", error);
  }
}

// Execute the function
listComposioConnections().catch(console.error);
