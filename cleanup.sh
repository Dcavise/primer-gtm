#!/bin/bash

# Project Cleanup Script for React/TypeScript Projects
# This script removes unnecessary files while preserving core source files and configs
# Created: $(date "+%Y-%m-%d")

# Set color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}     React Project Cleanup Script                          ${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo

# Function to prompt for confirmation
confirm() {
    echo -e "${YELLOW}$1${NC}"
    read -p "Continue? (y/n): " choice
    case "$choice" in 
      y|Y ) return 0;;
      * ) return 1;;
    esac
}

# Get project root directory
PROJECT_ROOT="$(pwd)"
echo -e "${GREEN}Project root directory:${NC} $PROJECT_ROOT"
echo

# Verify we're in the right directory by checking for essential files
if [ ! -f "$PROJECT_ROOT/package.json" ] || [ ! -d "$PROJECT_ROOT/src" ]; then
    echo -e "${RED}Error: Couldn't find package.json or src/ directory.${NC}"
    echo -e "${RED}Please run this script from the root of your React project.${NC}"
    exit 1
fi

# List of directories and files to preserve
PRESERVE_DIRS=(
    "src"
    "public"
    "docs"
    "supabase"
    ".git"
)

PRESERVE_FILES=(
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "tsconfig.app.json"
    "tsconfig.node.json"
    "vite.config.ts"
    "postcss.config.js"
    "tailwind.config.ts"
    "eslint.config.js"
    "components.json"
    ".env"
    ".gitignore"
    ".prettierrc"
    ".eslintrc.js"
    "vitest.config.ts"
    "README.md"
    "REFACTORING.md"
    "LEAD_METRICS_README.md"
    "SALESFORCE_FIXES.md"
    "CLAUDE.md"
    "cleanup.sh"  # Don't delete this script itself
)

# List of patterns to explicitly remove
REMOVE_PATTERNS=(
    "node_modules"
    "dist"
    "build"
    ".cursor"
    "*.log"
    "*.backup"
    "*.bak"
    "tmp_*"
    "test_*"
    "debug.js"
    "check_*.js"
    "*.env.mcp"
    "debug_supabase_mcp.js"
    "setup_supabase_mcp.js"
    "Screenshot*"
)

# Function to check if a file/directory should be preserved
should_preserve() {
    local path="$1"
    local basename=$(basename "$path")
    
    # Check if it's in the list of directories to preserve
    for dir in "${PRESERVE_DIRS[@]}"; do
        if [[ "$basename" == "$dir" ]]; then
            return 0  # 0 means true in bash
        fi
    done
    
    # Check if it's in the list of files to preserve
    for file in "${PRESERVE_FILES[@]}"; do
        if [[ "$basename" == "$file" ]]; then
            return 0
        fi
    done
    
    return 1  # 1 means false in bash
}

# Function to check if a file/directory matches removal patterns
matches_removal_pattern() {
    local path="$1"
    local basename=$(basename "$path")
    
    for pattern in "${REMOVE_PATTERNS[@]}"; do
        if [[ "$basename" == $pattern ]]; then
            return 0
        fi
    done
    
    return 1
}

# List files to be deleted
echo -e "${BLUE}Files and directories that will be deleted:${NC}"
find "$PROJECT_ROOT" -mindepth 1 -maxdepth 1 | while read path; do
    if should_preserve "$path"; then
        continue
    fi
    
    if matches_removal_pattern "$path"; then
        echo -e "${RED}$(basename "$path")${NC} - Matched removal pattern"
    else
        echo -e "${YELLOW}$(basename "$path")${NC} - Not in preserve list"
    fi
done

echo
if ! confirm "The above files and directories will be PERMANENTLY DELETED."; then
    echo -e "${RED}Operation cancelled.${NC}"
    exit 0
fi

# Create a backup directory for SQL and other useful files
echo -e "${BLUE}Creating backup directory for potentially useful files...${NC}"
mkdir -p "$PROJECT_ROOT/backup_before_cleanup"

# Move SQL files to the backup directory
find "$PROJECT_ROOT" -maxdepth 1 -name "*.sql" -exec mv {} "$PROJECT_ROOT/backup_before_cleanup/" \;
echo -e "${GREEN}Moved SQL files to backup directory.${NC}"

# Delete files and directories that aren't in the preserve list
echo -e "${BLUE}Removing unnecessary files and directories...${NC}"
find "$PROJECT_ROOT" -mindepth 1 -maxdepth 1 | while read path; do
    if should_preserve "$path"; then
        echo -e "${GREEN}Preserving:${NC} $(basename "$path")"
        continue
    fi
    
    # Extra caution for node_modules since it's large and expected
    if [[ "$(basename "$path")" == "node_modules" ]]; then
        echo -e "${YELLOW}Removing node_modules directory...${NC}"
        rm -rf "$path"
        continue
    fi
    
    echo -e "${RED}Removing:${NC} $(basename "$path")"
    rm -rf "$path"
done

# Clean up backup directory if empty
if [ ! "$(ls -A "$PROJECT_ROOT/backup_before_cleanup")" ]; then
    rmdir "$PROJECT_ROOT/backup_before_cleanup"
    echo -e "${YELLOW}Removed empty backup directory.${NC}"
fi

# Recommend git status
echo
echo -e "${BLUE}===========================================================${NC}"
echo -e "${GREEN}Cleanup complete!${NC}"
echo -e "${YELLOW}Recommended next steps:${NC}"
echo -e "1. Run ${BLUE}git status${NC} to see what files were removed"
echo -e "2. Run ${BLUE}npm install${NC} to reinstall dependencies"
echo -e "3. Run ${BLUE}npm run build${NC} to verify your project still builds correctly"
echo -e "${BLUE}===========================================================${NC}"