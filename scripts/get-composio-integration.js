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

async function getComposioIntegration() {
  console.log("Getting Composio Integration Details...");
  
  // Get Composio client using API key
  const apiKey = process.env.COMPOSIO_API_KEY || "e73t7ope78jraacknx7m2h";
  const composio = new Composio({ apiKey });
  console.log(`Using Composio API Key: ${apiKey.substring(0, 5)}...`);
  
  try {
    // Get the integration details
    const integration = await composio.integrations.get({
      integrationId: "92c6af93-b6f2-4ca6-83c5-65dc8dfc7159"
    });
    
    console.log("\n=== Composio Integration Details ===");
    console.log(JSON.stringify(integration, null, 2));
    
    return integration;
  } catch (error) {
    console.error("Error getting Composio integration:", error);
  }
}

// Execute the function
getComposioIntegration().catch(console.error);
