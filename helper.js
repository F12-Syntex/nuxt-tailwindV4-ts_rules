import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

function sanitizeLinks(text) {
  if (!text) return text;
  // Match typical URLs, including protocol-relative //example.com/path
  // This aims to avoid matching emails or bare domains without scheme.
  const urlRegex = /\b((https?:)?\/\/[^\s)'"<>]+)\b/gi;

  return text.replace(urlRegex, (match) => {
    try {
      // Normalize to a URL object; if protocol-relative, add http:
      const normalized = match.startsWith('//') ? `http:${match}` : match;
      const u = new URL(normalized);
      const route = u.pathname && u.pathname !== '' ? u.pathname : '/';
      return `${route} <LINK EMITED FOR SAFTEY>`;
    } catch {
      // If URL constructor fails, attempt a fallback for edge cases
      // Extract path after domain if possible
      const pathMatch = match.replace(/^(https?:)?\/\//i, '').split('/');
      if (pathMatch.length > 1) {
        const route = `/${pathMatch.slice(1).join('/')}`;
        return `${route} <LINK EMITED FOR SAFTEY>`;
      }
      return `/ <LINK EMITED FOR SAFTEY>`;
    }
  });
}

function getAllFiles(dirPath, arrayOfFiles = [], isRoot = false) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === 'node_modules' || file.startsWith('.')) return;
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles, false);
    } else {
      // Exclude certain files
      if (
        file.endsWith('.lock') ||
        file.endsWith('.md') ||
        file === '.gitignore' ||
        file.endsWith('.json')
      ) return;

      // NEW: When at project root, include only Vue files
      if (isRoot) {
        if (!file.endsWith('.vue')) return;
        arrayOfFiles.push(fullPath);
        return;
      }

      // Non-root files: include as before
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function searchFilesByName(files, ...substrings) {
  const lowered = substrings.map(s => s.toLowerCase());
  return files.filter(file => {
    const name = path.basename(file).toLowerCase();
    return lowered.some(sub => name.includes(sub));
  });
}

function searchFilesByContent(files, searchTerm) {
  return files.filter(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      return false;
    }
  });
}

function getFilesByExtension(files, extension) {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return files.filter(file => file.endsWith(ext));
}

function getRecentlyModified(files, hours = 24) {
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  return files
    .filter(file => {
      try {
        const stats = fs.statSync(file);
        return stats.mtimeMs > cutoffTime;
      } catch {
        return false;
      }
    })
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
}

function listFiles(files) {
  console.log('\n📁 Files included:');
  files.forEach((file, index) => console.log(`  ${index + 1}. ${file}`));
  console.log(`\n📊 Total: ${files.length} file(s)`);
}

function copyToClipboard(text, fileList) {
  const platform = process.platform;
  let command;

  if (platform === 'darwin') command = 'pbcopy';
  else if (platform === 'win32') command = 'clip';
  else command = 'xclip -selection clipboard';

  const child = exec(command, error => {
    if (error) {
      console.error('❌ Error copying to clipboard:', error);
      console.log('\n--- Content that would be copied ---');
      console.log(text);
    } else {
      console.log('✅ Content copied to clipboard!');
      if (fileList) listFiles(fileList);
    }
  });

  child.stdin.write(text);
  child.stdin.end();
}

function buildOutput(files) {
  let output = '';

  files.forEach(filePath => {
    if (filePath.endsWith('.ico')) return;

    const content = fs.readFileSync(filePath, 'utf8');
    let finalContent = content;

    if (filePath.endsWith('.csv')) {
      const lines = content.split(/\r?\n/).slice(0, 3);
      finalContent = lines.join('\n') + '\n... (truncated CSV preview)\n';
    } else {
      const lines = content.split(/\r?\n/);
      if (lines.length > 300)
        finalContent = lines.slice(0, 300).join('\n') + '\n... (truncated after 300 lines)\n';
    }

    // Sanitize links in the final content
    finalContent = sanitizeLinks(finalContent);

    output += `File: ${filePath}\n`;
    output += `${finalContent}\n\n`;
  });

  return output;
}

// 🌳 Dot-notation file tree
function buildTreeOutput(dirPath) {
  const files = [];

  function recurse(currentDir, isRoot = false) {
    const entries = fs.readdirSync(currentDir);
    entries.forEach(entry => {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);

      if (entry === 'node_modules' || entry.startsWith('.')) return;

      if (stat.isDirectory()) {
        recurse(fullPath, false);
      } else if (
        !entry.endsWith('.lock') &&
        !entry.endsWith('.md') &&
        entry !== '.gitignore' &&
        !entry.endsWith('.json')
      ) {
        // At the root, include only .vue files in the tree
        if (isRoot && !entry.endsWith('.vue')) return;

        const relative = path.relative(dirPath, fullPath);
        const dotted = relative.replace(/[\\/]/g, '.');
        files.push(dotted);
      }
    });
  }

  recurse(dirPath, true);
  // Sanitize in case any dotted paths include links (unlikely)
  const joined = files.join('\n');
  return sanitizeLinks(joined);
}

function showHelp() {
  const text = `
📚 Code Helper - Smart Codebase Navigator

Commands:
  tree        Show dot-notation absolute file paths (src.a.b.c) — root includes only .vue files
  name ...    Search filenames containing substring(s)
  content ... Search files by content term
  ext ...     Filter by extension
  recent ...  Show recently modified files
  list        Copy all relevant files
  ? or help   Show this help message

Example:
  node helper tree
  node helper name service
`;
  console.log(text);
  copyToClipboard(text.trim());
}

function main() {
  try {
    const currentDir = process.cwd();
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase();
    const argument = args[1];

    if (command === '?' || command === 'help') {
      showHelp();
      return;
    }

    if (command === 'tree') {
      console.log('📂 Project Structure (dot format):');
      const output = buildTreeOutput(currentDir);
      console.log(output);
      copyToClipboard(output);
      return;
    }

    console.log('🔄 Processing files...');
    // Root includes only .vue files due to new isRoot behavior
    const allFiles = getAllFiles(currentDir, [], true);
    let selectedFiles = allFiles;
    let output = '';

    if (command === 'name' && args.length > 1) {
      selectedFiles = searchFilesByName(allFiles, ...args.slice(1));
      console.log(`🔍 Searching filenames: ${args.slice(1).join(', ')}`);
      const structure = buildTreeOutput(currentDir);
      const files = buildOutput(selectedFiles);
      output = `<structure>\n${structure}\n\n<files>\n${files}`;
    } else if (command === 'content' && argument) {
      selectedFiles = searchFilesByContent(allFiles, argument);
      console.log(`🔍 Searching for content "${argument}"...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'ext' && argument) {
      selectedFiles = getFilesByExtension(allFiles, argument);
      console.log(`🔍 Files with extension "${argument}"...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'recent') {
      const hours = argument ? parseInt(argument, 10) : 24;
      selectedFiles = getRecentlyModified(allFiles, hours);
      console.log(`⏰ Files modified in last ${hours}h...`);
      output = buildOutput(selectedFiles);
    } else if (command === 'list') {
      console.log('📋 Listing all files...');
      output = buildOutput(selectedFiles);
    } else if (command && command !== 'name') {
      console.log(`⚠️ Unknown command: "${command}"`);
      console.log('💡 Use "node helper ?" for help');
      return;
    } else {
      console.log('📋 Copying all files (with truncation rules)...');
      output = buildOutput(selectedFiles);
    }

    if (selectedFiles.length === 0) {
      console.log('❌ No files found matching criteria');
      return;
    }

    copyToClipboard(output, selectedFiles);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();