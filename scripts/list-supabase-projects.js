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

async function listSupabaseProjects() {
  console.log("Setting up agent to list Supabase projects...");
  
  // Initialize OpenAI chat model
  const llm = new ChatOpenAI({
    model: "gpt-4-turbo",
    temperature: 0,
  });

  // Pull the standard OpenAI functions agent prompt
  const prompt = await pull("hwchase17/openai-functions-agent");

  // Set up Composio toolset with just the project listing action
  const apiKey = process.env.COMPOSIO_API_KEY || "e73t7ope78jraacknx7m2h";
  console.log(`Using Composio API Key: ${apiKey.substring(0, 5)}...`);
  
  const toolset = new LangchainToolSet({ apiKey });
  const tools = await toolset.getTools({ 
    actions: ["SUPABASE_LIST_ALL_PROJECTS"],
    // No need for schema-specific options here
  });

  // Create and configure the agent
  const agent = await createOpenAIFunctionsAgent({llm, tools, prompt});
  const agentExecutor = new AgentExecutor({ agent, tools, verbose: true });

  // Run the agent with a simple task to list projects
  console.log("\nRunning agent to list all Supabase projects...");
  
  try {
    const response = await agentExecutor.invoke({ 
      input: "List all Supabase projects I have access to"
    });
    
    console.log("\n--- Agent Response ---");
    console.log(response.output);
    
    return response;
  } catch (error) {
    console.error("Error running agent:", error);
    
    if (error.message.includes('API key')) {
      console.log("\nTIP: Make sure your OpenAI API key is set properly in the .env file");
      console.log("Current key:", process.env.OPENAI_API_KEY ? 
        "Set (starts with " + process.env.OPENAI_API_KEY.substring(0, 10) + "...)" : 
        "(not set)");
    }
    
    throw error;
  }
}

// Execute the function
listSupabaseProjects()
  .then(() => console.log("Finished listing Supabase projects"))
  .catch(err => console.error("Failed to list Supabase projects:", err));
