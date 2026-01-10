const fs = require('fs');
const path = require('path');

// Configuration
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const OUTPUT_FILE = 'FULL_PROJECT_CODE.txt';

// Directories and files to exclude
const EXCLUDE_DIRS = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '_backup'
];

const EXCLUDE_FILES = [
    'package-lock.json',
    'FULL_PROJECT_CODE.txt',
    'consolidate-code.js',
    'EliteMarts_Source_Code.pdf'
];

// File extensions to include
const INCLUDE_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx',
    '.json', '.mjs', '.cjs',
    '.css', '.scss', '.sass',
    '.html', '.md',
    '.env.local', '.env.local.template',
    '.gitignore', '.txt'
];

let totalSize = 0;
let fileCount = 0;
let output = '';

// Header
output += '='.repeat(80) + '\n';
output += 'ELITEMARTS E-COMMERCE PROJECT - COMPLETE SOURCE CODE\n';
output += '='.repeat(80) + '\n';
output += `Generated: ${new Date().toLocaleString()}\n`;
output += `Size Limit: ${MAX_SIZE_MB}MB\n`;
output += '='.repeat(80) + '\n\n';

function shouldIncludeFile(filePath, fileName) {
    // Check if file should be excluded
    if (EXCLUDE_FILES.includes(fileName)) {
        return false;
    }

    // Check extension
    const ext = path.extname(fileName);
    const hasValidExt = INCLUDE_EXTENSIONS.includes(ext) || fileName.startsWith('.env');

    return hasValidExt;
}

function shouldIncludeDir(dirName) {
    return !EXCLUDE_DIRS.includes(dirName) && !dirName.startsWith('.');
}

function getRelativePath(fullPath) {
    return path.relative(process.cwd(), fullPath);
}

function processFile(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = getRelativePath(filePath);

        // Calculate size with formatting
        const fileHeader = `\n${'='.repeat(80)}\n`;
        const fileInfo = `FILE: ${relativePath}\n`;
        const fileSeparator = `${'-'.repeat(80)}\n`;
        const fileFooter = `\n${'='.repeat(80)}\n`;

        const formattedContent = fileHeader + fileInfo + fileSeparator + content + fileFooter;
        const contentSize = Buffer.byteLength(formattedContent, 'utf8');

        // Check if adding this file would exceed limit
        if (totalSize + contentSize > MAX_SIZE_BYTES) {
            console.log(`⚠️  Size limit reached. Skipping: ${relativePath}`);
            return false;
        }

        output += formattedContent;
        totalSize += contentSize;
        fileCount++;

        console.log(`✓ Added: ${relativePath} (${(contentSize / 1024).toFixed(2)} KB)`);
        return true;
    } catch (error) {
        console.error(`✗ Error reading ${filePath}:`, error.message);
        return true; // Continue processing
    }
}

function traverseDirectory(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);

        // Process files first, then directories
        const files = [];
        const dirs = [];

        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                if (shouldIncludeDir(item)) {
                    dirs.push(fullPath);
                }
            } else if (stats.isFile()) {
                if (shouldIncludeFile(fullPath, item)) {
                    files.push(fullPath);
                }
            }
        });

        // Process files
        for (const file of files) {
            if (!processFile(file)) {
                return false; // Size limit reached
            }
        }

        // Process subdirectories
        for (const dir of dirs) {
            if (!traverseDirectory(dir)) {
                return false; // Size limit reached
            }
        }

        return true;
    } catch (error) {
        console.error(`Error traversing ${dirPath}:`, error.message);
        return true;
    }
}

// Main execution
console.log('🚀 Starting code consolidation...\n');
console.log(`📁 Project: ${process.cwd()}`);
console.log(`📊 Size limit: ${MAX_SIZE_MB}MB\n`);

const startTime = Date.now();
traverseDirectory(process.cwd());

// Add footer
output += '\n' + '='.repeat(80) + '\n';
output += 'END OF PROJECT CODE\n';
output += '='.repeat(80) + '\n';
output += `Total Files: ${fileCount}\n`;
output += `Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;
output += `Generated: ${new Date().toLocaleString()}\n`;
output += '='.repeat(80) + '\n';

// Write output file
fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('\n' + '='.repeat(80));
console.log('✅ CONSOLIDATION COMPLETE!');
console.log('='.repeat(80));
console.log(`📄 Output file: ${OUTPUT_FILE}`);
console.log(`📊 Total files: ${fileCount}`);
console.log(`💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB / ${MAX_SIZE_MB} MB`);
console.log(`⏱️  Duration: ${duration}s`);
console.log('='.repeat(80));
