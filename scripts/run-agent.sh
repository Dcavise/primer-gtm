#!/bin/bash

# Run the Primer GTM Supabase Agent with LangChain
# This script makes it easier to run the agent with different tasks

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Default task if none provided
DEFAULT_TASK="List all functions in the fivetran_views schema"
TASK="${1:-$DEFAULT_TASK}"

# Run the agent
echo "Starting Primer GTM Agent..."
node "$SCRIPT_DIR/supabase-langchain-agent.js" "$TASK"
