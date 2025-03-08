/**
 * Utility script to help identify potentially unused files and imports in the codebase
 * Run with: node find-unused.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, 'src');
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'public'];
const IGNORE_FILES = ['vite-env.d.ts', 'env.d.ts', 'index.ts', 'index.js', 'main.tsx'];

// Helper to find all source files
function findSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !IGNORE_DIRS.includes(file)) {
      findSourceFiles(filePath, fileList);
    } else if (
      stat.isFile() && 
      FILE_EXTENSIONS.includes(path.extname(file)) &&
      !IGNORE_FILES.includes(file)
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Helper to extract imports from a file
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  
  const imports = [];
  let match;
  while (match = importRegex.exec(content)) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Helper to look for file references
function findFileReferences(filename, allFiles) {
  // We need to be careful with the grep search pattern to avoid false positives
  const searchName = path.basename(filename, path.extname(filename));
  
  try {
    // Use grep to look for references to this file
    const grepResult = execSync(`grep -r "${searchName}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" ${SRC_DIR} | grep -v "${filename}"`, { stdio: 'pipe' }).toString();
    
    return grepResult.split('\n').filter(line => line.trim() !== '').length > 0;
  } catch (error) {
    // grep returns exit code 1 if no matches found, which is not an error for us
    return false;
  }
}

// Main function to find unused files
function findUnusedFiles() {
  const allFiles = findSourceFiles(SRC_DIR);
  console.log(`Found ${allFiles.length} source files`);
  
  const potentiallyUnused = allFiles.filter(file => {
    const hasReferences = findFileReferences(file, allFiles);
    return !hasReferences;
  });
  
  console.log('\nPotentially unused files:');
  potentiallyUnused.forEach(file => {
    console.log(`- ${path.relative(__dirname, file)}`);
  });
}

// Run the analysis
console.log('Analyzing codebase for unused files...');
findUnusedFiles();