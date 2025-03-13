import { OpenAI } from "openai";
import { OpenAIToolSet } from "composio-core";
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

async function runDirectAgent(query) {
  console.log("Setting up direct OpenAI agent...");
  
  // Initialize OpenAI client
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("Missing OpenAI API key. Please set the OPENAI_API_KEY environment variable.");
  }
  
  const openai = new OpenAI({
    apiKey: openaiApiKey
  });
  
  // Initialize Composio toolset
  const composioApiKey = process.env.COMPOSIO_API_KEY || "e73t7ope78jraacknx7m2h";
  console.log(`Using Composio API Key: ${composioApiKey.substring(0, 5)}...`);
  
  // Set up the toolset with your Supabase connection details
  const toolset = new OpenAIToolSet({
    apiKey: composioApiKey,
    // Use the existing Supabase connection
    connectedAccountId: "2d9cccd5-7906-4ba2-9777-62ab0da1fda4",
    // Direct connection fallback
    supabaseUrl: process.env.VITE_SUPABASE_URL || "https://pudncilureqpzxrxfupr.supabase.co",
    supabaseKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  });
  
  // Get tools specifically for Supabase, focusing on fivetran_views schema
  const tools = await toolset.getTools({
    actions: [
      "SUPABASE_LIST_ALL_FUNCTIONS",
      "SUPABASE_EXECUTE_FUNCTION",
      "SUPABASE_QUERY_DATA",
      "SUPABASE_TABLE_INFO"
    ],
    options: {
      defaultSchema: "fivetran_views",
      functionsOfInterest: [
        "get_enhanced_family_record",
        "search_families",
        "get_campus_names",
        "get_campus_name",
        "populate_derived_students",
        "set_opportunity_student_override",
        "get_lead_metrics"
      ],
      tablesOfInterest: [
        "derived_students",
        "opportunity_student_map",
        "enhanced_family_records",
        "opportunity",
        "campus_c",
        "lead_metrics_daily",
        "lead_metrics_weekly"
      ]
    }
  });
  
  console.log(`\nRunning direct OpenAI agent with query: "${query}"`);
  console.log("⚠️  Note: This agent is specifically configured for the fivetran_views schema");
  
  try {
    // Call OpenAI chat completions API with tools
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that specializes in querying the Primer GTM Supabase database.
          
Important guidelines:
- ALWAYS use fivetran_views schema, NEVER reference public schema
- Student data comes from derived_students table and opportunity_student_map
- For student timeline, use school_year_c from the opportunity table
- For campus data, use campus_c table for names and IDs
- All operations target the fivetran_views schema, not public schema`
        },
        {
          role: "user",
          content: query
        }
      ],
      tools: tools
    });
    
    console.log("\n--- Agent Response ---");
    console.log(response.choices[0].message.content || "No text response provided");
    
    // Check if there were any tool calls
    if (response.choices[0].message.tool_calls && response.choices[0].message.tool_calls.length > 0) {
      console.log("\n--- Tool Calls Made ---");
      response.choices[0].message.tool_calls.forEach((toolCall, index) => {
        console.log(`Tool Call ${index + 1}:`);
        console.log(`Function: ${toolCall.function.name}`);
        console.log(`Arguments: ${toolCall.function.arguments}`);
      });
    }
    
    return response;
  } catch (error) {
    console.error("Error running OpenAI agent:", error);
    
    if (error.message.includes('API key')) {
      console.log("\nTIP: Make sure your OpenAI API key is set properly in the .env file");
      console.log("Current key:", process.env.OPENAI_API_KEY ? 
        "Set (starts with " + process.env.OPENAI_API_KEY.substring(0, 10) + "...)" : 
        "(not set)");
    }
    
    throw error;
  }
}

// Get query from command line or use default
const query = process.argv[2] || "List all functions in the fivetran_views schema";

// Execute the function
runDirectAgent(query)
  .then(() => console.log("Direct OpenAI agent execution completed"))
  .catch(err => console.error("Direct OpenAI agent execution failed:", err));
