import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { LangchainToolSet } from "composio-core";
import { pull } from "langchain/hub";
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

/**
 * Primer GTM Supabase Agent
 * 
 * This script creates an AI agent that can interact with the Primer GTM Supabase database,
 * specifically focusing on the fivetran_views schema where all the important data lives.
 * 
 * Schema Guidelines:
 * - ALWAYS use fivetran_views schema, NEVER reference public schema
 * - Student data comes from derived_students table and opportunity_student_map
 * - For student timeline, use school_year_c from the opportunity table
 * - For campus data, use campus_c table for names and IDs
 * - Opportunity table has specific column naming conventions
 * 
 * The agent can:
 * - List all available functions in the fivetran_views schema
 * - Query student, family, opportunity, and campus data
 * - Execute specific functions like get_enhanced_family_record, search_families, etc.
 * - Help with student timeline management and campus staff tracking
 */
async function runPrimerGtmAgent(taskDescription) {
  // Initialize the OpenAI model
  const llm = new ChatOpenAI({
    model: "gpt-4-turbo",
    temperature: 0,
  });

  // Pull the agent prompt from LangChain Hub
  const prompt = await pull("hwchase17/openai-functions-agent");

  // Set up tools to interact with Supabase
  const toolset = new LangchainToolSet({ 
    apiKey: process.env.COMPOSIO_API_KEY || "e73t7ope78jraacknx7m2h",
    // Using our known connection ID for the Supabase project
    connectedAccountId: "2d9cccd5-7906-4ba2-9777-62ab0da1fda4",
    // Also provide direct Supabase connection details as fallback
    supabaseUrl: process.env.VITE_SUPABASE_URL || "https://pudncilureqpzxrxfupr.supabase.co",
    supabaseKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  });
  
  // Get tools specifically for working with the fivetran_views schema
  // IMPORTANT: Note that we should never reference the public schema as per project guidelines
  const tools = await toolset.getTools({ 
    actions: [
      "SUPABASE_LIST_ALL_FUNCTIONS", 
      "SUPABASE_EXECUTE_FUNCTION",
      "SUPABASE_QUERY_DATA",
      "SUPABASE_TABLE_INFO"
    ],
    options: {
      // Always target the fivetran_views schema, not the public schema
      defaultSchema: "fivetran_views",
      // Specify functions of interest that we know exist in the fivetran_views schema
      functionsOfInterest: [
        "get_enhanced_family_record",
        "search_families",
        "get_campus_names",
        "get_campus_name",
        "populate_derived_students",
        "set_opportunity_student_override",
        "get_lead_metrics"
      ],
      // Specify tables of interest in the fivetran_views schema
      tablesOfInterest: [
        "derived_students", 
        "opportunity_student_map",
        "enhanced_family_records",
        "comprehensive_family_records",
        "opportunity",
        "campus_c",
        "account",
        "contact",
        "lead_metrics_daily",
        "lead_metrics_weekly",
        "lead_metrics_monthly"
      ],
      // Limit query results
      maxRowsReturned: 25
    }
  });

  // Create the agent with the LLM, tools, and prompt
  const agent = await createOpenAIFunctionsAgent({llm, tools, prompt});
  
  // Create an executor for the agent with verbose output
  const agentExecutor = new AgentExecutor({ agent, tools, verbose: true });

  // Run the agent with the given task
  console.log(`\n🤖 Running Primer GTM Agent with task: "${taskDescription}"`);
  console.log("⚠️  Note: All operations target the fivetran_views schema, not public schema");
  
  const response = await agentExecutor.invoke({ 
    input: taskDescription,
    // Provide context about the schema conventions
    context: {
      schema: "fivetran_views",
      schemaGuidelines: "Always use fivetran_views schema, never reference public schema",
      studentSchema: {
        derived_students: "Contains deduplicated student records extracted from opportunities",
        opportunity_student_map: "Links opportunities to derived students with confidence scores",
        student_columns: {
          first_name: "Student first name",
          last_name: "Student last name",
          full_name: "Combined student name",
          family_id: "ID of the associated family"
        }
      },
      opportunitySchema: {
        table: "fivetran_views.opportunity",
        columns: {
          stage_name: "Opportunity stage",
          grade_c: "Student grade",
          student_first_name_c: "Student first name in opportunity",
          student_last_name_c: "Student last name in opportunity",
          school_year_c: "School year (e.g. 25/26)",
          campus_c: "Reference to campus_c.id",
          account_id: "Reference to account.id",
          is_deleted: "Deletion status",
          created_date: "Creation timestamp"
        }
      },
      timelineData: "Student timelines use school_year_c from the opportunity table and visual indicators (green for enrolled, blue for applications, gray for other stages)",
      campusData: "campus_c table contains campus names and IDs",
      metricsViews: [
        "lead_metrics_daily", 
        "lead_metrics_weekly", 
        "lead_metrics_monthly",
        "current_period_metrics",
        "combined_lead_metrics"
      ]
    }
  });
  
  return response;
}

// Example tasks you can use:
const exampleTasks = [
  "List all functions in the fivetran_views schema",
  "Explain how student timelines work with the derived_students table",
  "Show me the structure of the opportunity table in fivetran_views schema",
  "Get lead metrics for Birmingham campus",
  "Find families with students in the 25/26 school year",
  "Show how student data is deduplicated in the system",
  "Explain the relationship between opportunities and derived students",
  "What columns are available in the campus_c table?",
  "How are student names extracted from opportunities?",
  "Get latest lead metrics from the combined_lead_metrics view"
];

// Get task from command line or use default
const task = process.argv[2] || "List all functions in the fivetran_views schema and explain what each one does";

console.log("\n📊 Primer GTM Supabase Agent");
console.log("=".repeat(50));
console.log("Example tasks you can run:");
exampleTasks.forEach((example, i) => console.log(`${i+1}. ${example}`));
console.log("=".repeat(50));

runPrimerGtmAgent(task)
  .then(response => {
    console.log("\n--- Agent Response ---");
    console.log(response.output);
  })
  .catch(err => {
    console.error("Error running Primer GTM agent:", err);
    if (err.message.includes('API key')) {
      console.log("\nTIP: Make sure your OpenAI API key is set properly in the .env file");
      console.log("Current key:", process.env.OPENAI_API_KEY ? "Set (starts with " + process.env.OPENAI_API_KEY.substring(0, 10) + "...)" : "(not set)");
      console.log("\nAlso check your Composio API key:");
      console.log("Current key:", process.env.COMPOSIO_API_KEY ? "Set (starts with " + process.env.COMPOSIO_API_KEY.substring(0, 10) + "...)" : "(not set)");
    }
    if (err.message.includes('Supabase')) {
      console.log("\nTIP: Check your Supabase connection settings in the .env file");
      console.log("Current URL:", process.env.VITE_SUPABASE_URL || "(not set)");
      console.log("Current Key:", process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "(not set)");
      console.log("Connected Account ID:", "2d9cccd5-7906-4ba2-9777-62ab0da1fda4");
    }
  });
