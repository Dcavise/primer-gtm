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

async function runSupabaseAgent(instruction) {
  console.log("Setting up Composio Supabase agent...");
  
  // Initialize OpenAI client
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("Missing OpenAI API key. Please set the OPENAI_API_KEY environment variable.");
  }
  
  const openai_client = new OpenAI({
    apiKey: openaiApiKey
  });
  
  // Initialize Composio toolset
  const composioApiKey = process.env.COMPOSIO_API_KEY || "e73t7ope78jraacknx7m2h";
  console.log(`Using Composio API Key: ${composioApiKey.substring(0, 5)}...`);
  
  // Set up the toolset with API key
  const composio_toolset = new OpenAIToolSet({
    apiKey: composioApiKey
  });
  
  // Start with listing projects to verify connection is working
  const tools = await composio_toolset.getTools({
    actions: ["SUPABASE_LIST_ALL_PROJECTS"]
  });
  
  console.log(`\nRunning Composio agent with instruction: "${instruction}"`);
  
  try {
    // Creating a chat completion request to the OpenAI model
    const response = await openai_client.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system", 
          content: "You are a helpful assistant that lists Supabase projects. Be concise and specific."
        },
        { 
          role: "user", 
          content: instruction 
        }
      ],
      tools: tools,
      tool_choice: "auto",
    });
    
    console.log("\n--- Initial OpenAI Response ---");
    console.log(response.choices[0].message.content || "No text response provided");
    
    // Check if there were any tool calls
    if (response.choices[0].message.tool_calls && response.choices[0].message.tool_calls.length > 0) {
      console.log("\n--- Processing Tool Calls ---");
      const tool_calls = response.choices[0].message.tool_calls;
      
      console.log(`Found ${tool_calls.length} tool call(s)`);
      tool_calls.forEach((toolCall, index) => {
        console.log(`Tool Call ${index + 1}: ${toolCall.function.name}`);
        console.log(`Arguments: ${toolCall.function.arguments}`);
      });
      
      // Execute the tool calls and get tool responses
      console.log("\nExecuting tool calls...");
      const tool_response = await composio_toolset.handleToolCall(response);
      
      console.log("\n--- Tool Execution Results ---");
      console.log(JSON.stringify(tool_response, null, 2));
      
      // Now get a final response from OpenAI with the tool results included
      const final_messages = [
        {
          role: "system",
          content: "You are a helpful assistant that lists Supabase projects. Be concise and specific."
        },
        {
          role: "user",
          content: instruction
        },
        response.choices[0].message,
        {
          role: "tool",
          tool_call_id: response.choices[0].message.tool_calls[0].id,
          content: JSON.stringify(tool_response)
        }
      ];
      
      const final_response = await openai_client.chat.completions.create({
        model: "gpt-4-turbo",
        messages: final_messages
      });
      
      console.log("\n--- Final Agent Response ---");
      console.log(final_response.choices[0].message.content);
      
      return final_response;
    } else {
      console.log("\nNo tool calls were made.");
      return response;
    }
  } catch (error) {
    console.error("Error running Composio agent:", error);
    
    if (error.message.includes('API key')) {
      console.log("\nTIP: Make sure your OpenAI API key is set properly in the .env file");
      console.log("Current key:", process.env.OPENAI_API_KEY ? 
        "Set (starts with " + process.env.OPENAI_API_KEY.substring(0, 10) + "...)" : 
        "(not set)");
    }
    
    throw error;
  }
}

// Get instruction from command line or use default
const instruction = process.argv[2] || "List all Supabase projects I can access";

// Execute the function
runSupabaseAgent(instruction)
  .then(() => console.log("\nComposio agent execution completed"))
  .catch(err => console.error("\nComposio agent execution failed:", err));
