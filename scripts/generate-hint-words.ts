#!/usr/bin/env tsx
/**
 * CLI Script: Generate Hint Words from Strands Grid
 *
 * Usage:
 *   npx tsx scripts/generate-hint-words.ts --grid "ABCDEF..." [options]
 *   npx tsx scripts/generate-hint-words.ts --puzzle-id "puzzle-123" [options]
 *
 * Options:
 *   --grid <string>          Grid letters (48 characters)
 *   --puzzle-id <string>     Load grid from Sanity puzzle
 *   --theme-words <words>    Comma-separated theme words to exclude
 *   --min-length <number>    Minimum word length (default: 4)
 *   --max-length <number>    Maximum word length (default: 15)
 *   --max-words <number>     Maximum words to find (default: 500)
 *   --output <file>          Save results to JSON file
 *   --include-3-letter       Include 3-letter words
 *   --format <type>          Output format: text, json, sanity (default: text)
 */

import Anthropic from '@anthropic-ai/sdk';
import {getGridString} from '../app/lib/games/grid-utils';
import {parseCanonicalGrid, isCanonicalGrid} from '../app/lib/games/canonical-grid.types';
import type {SanityStrandsPuzzle} from '../app/lib/games/strands.queries';
import {areAdjacent, getNeighbors} from '../app/lib/games/strands-logic';
import {createClient} from '@sanity/client';
import groq from 'groq';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
}

// Initialize Anthropic client
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}
const anthropic = new Anthropic({apiKey: anthropicApiKey});

// Initialize Sanity client
const projectId = process.env.PUBLIC_SANITY_STUDIO_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || 'np4gh1g3';
const dataset = process.env.PUBLIC_SANITY_STUDIO_DATASET || process.env.SANITY_STUDIO_DATASET || 'production';
const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// Create write client with editor token for --save operations
function getSanityWriteClient() {
  const editorToken = process.env.SANITY_EDITOR_KEY;
  if (!editorToken) {
    throw new Error('SANITY_EDITOR_KEY environment variable is required for --save operations');
  }
  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token: editorToken,
    useCdn: false,
  });
}

/**
 * Format grid as a visual table (8 rows × 6 columns) with cell indices
 */
function formatGridAsTable(grid: string): string {
  const rows: string[] = [];
  rows.push('   ' + Array.from({length: 6}, (_, i) => `  ${i} `).join(' '));
  rows.push('   ' + '-----'.repeat(6));
  
  for (let row = 0; row < 8; row++) {
    const rowStart = row * 6;
    const cells = grid.substring(rowStart, rowStart + 6).split('').map((c, i) => {
      const index = rowStart + i;
      return `${c}(${index.toString().padStart(2, '0')})`;
    });
    rows.push(`${row} | ${cells.join(' | ')} |`);
  }
  
  return rows.join('\n');
}

/**
 * Check if a word can be formed from the grid by finding a valid path
 */
function canFormWord(grid: string, word: string): boolean {
  const wordUpper = word.toUpperCase();
  const gridLetters = grid.split('');

  // DFS to find if word can be formed
  function findPath(startIndex: number, wordIndex: number, visited: Set<number>): boolean {
    if (wordIndex >= wordUpper.length) {
      return true; // Found complete word
    }

    if (gridLetters[startIndex] !== wordUpper[wordIndex]) {
      return false;
    }

    if (wordIndex === wordUpper.length - 1) {
      return true; // Last letter matches
    }

    // Try all adjacent neighbors
    const neighbors = getNeighbors(startIndex);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const newVisited = new Set(visited);
        newVisited.add(neighbor);
        if (findPath(neighbor, wordIndex + 1, newVisited)) {
          return true;
        }
      }
    }

    return false;
  }

  // Try starting from each cell that has the first letter
  for (let i = 0; i < 48; i++) {
    if (gridLetters[i] === wordUpper[0]) {
      const visited = new Set<number>([i]);
      if (findPath(i, 0, visited)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generate hint words using Claude API
 */
async function generateHintWordsWithClaude(
  grid: string,
  themeWords: string[],
  existingHintWords: string[],
  options: {
    minLength: number;
    maxLength: number;
    maxWords: number;
  }
): Promise<string[]> {
  const gridTable = formatGridAsTable(grid);
  const existingWordsList = existingHintWords.length > 0 
    ? `\n\nEXISTING HINT WORDS (DO NOT INCLUDE THESE):\n${existingHintWords.map((w, i) => `${i + 1}. ${w}`).join('\n')}`
    : '\n\nEXISTING HINT WORDS: None (generate all valid words)';

  // Create a flat grid with indices for reference
  const gridWithIndices = grid.split('').map((letter, idx) => `${letter}(${idx})`).join(' ');
  
  const prompt = `You are analyzing a Strands word puzzle grid to discover valid hint words. CRITICAL: You must verify that each word can actually be formed by tracing a path through adjacent cells in the grid.

GRID LAYOUT (8 rows × 6 columns = 48 cells):
Each cell shows: LETTER(INDEX)
${gridTable}

CELL INDEXING:
Cells are numbered 0-47 in row-major order:
Row 0: 00-05, Row 1: 06-11, Row 2: 12-17, Row 3: 18-23
Row 4: 24-29, Row 5: 30-35, Row 6: 36-41, Row 7: 42-47

FLAT GRID REFERENCE:
${gridWithIndices}

RULES FOR VALID HINT WORDS:
1. Must be 4 or more letters long (minimum ${options.minLength}, maximum ${options.maxLength})
2. Must be valid English words (common words preferred)
3. Cannot be theme words: ${themeWords.join(', ') || 'N/A'}
4. MUST be formable by selecting adjacent cells (including diagonals)
   - Adjacent means: same row/col (horizontal/vertical) OR diagonal
   - Example: Cell 0 is adjacent to cells 1, 6, 7
   - Example: Cell 7 is adjacent to cells 1, 6, 8, 12, 13
5. Each cell can only be used once per word
6. You must be able to trace a valid path through the grid for each word${existingHintWords.length > 0 ? '\n7. MUST NOT include any words from the existing hint words list below' : ''}

HOW TO VERIFY A WORD CAN BE FORMED:
1. Find the first letter of the word in the grid
2. From that cell, find an adjacent cell (including diagonals) with the next letter
3. Continue tracing adjacent cells until you've spelled the entire word
4. If you cannot trace a valid path, the word is NOT valid
5. Example: To verify "WORD" starting at cell 0 (W), check if:
   - Cell 0 (W) → adjacent cell with O → adjacent cell with R → adjacent cell with D
   - All cells must be adjacent to each other in sequence

${existingWordsList}

CRITICAL INSTRUCTIONS:
- You MUST verify each word can be traced through adjacent cells before including it
- Do NOT guess or assume words exist - only include words you can verify
- Trace paths carefully: each letter must be in a cell adjacent to the previous letter
- Generate ${options.maxWords} unique, VERIFIABLE hint words
- Focus on common, recognizable English words that you can confirm exist in the grid
- ${existingHintWords.length > 0 ? 'ONLY generate NEW words that are NOT in the existing list' : 'Generate all valid words'}
- Return ONLY a comma-separated list of uppercase words (e.g., "WORD1,WORD2,WORD3")
- Do not include any explanations, just the words

OUTPUT FORMAT:
Return only the comma-separated list of words, nothing else.`;

  console.error('🤖 Calling Claude API to generate hint words...\n');

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const responseText = content.text.trim();
    
    // Parse comma-separated words
    const words = responseText
      .split(',')
      .map((w: string) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w: string) => w.length >= options.minLength && w.length <= options.maxLength)
      .filter((w: string) => !themeWords.includes(w))
      .filter((w: string) => !existingHintWords.includes(w));

    // Remove duplicates
    const uniqueWords: string[] = Array.from(new Set(words));

    // Validate that each word can actually be formed from the grid
    console.error('🔍 Validating words can be formed from grid...\n');
    const validWords: string[] = [];
    const invalidWords: string[] = [];
    
    for (const word of uniqueWords) {
      if (canFormWord(grid, word)) {
        validWords.push(word);
      } else {
        invalidWords.push(word);
      }
    }

    if (invalidWords.length > 0) {
      console.error(`⚠️  Filtered out ${invalidWords.length} invalid words that cannot be formed from grid:\n   ${invalidWords.slice(0, 10).join(', ')}${invalidWords.length > 10 ? '...' : ''}\n`);
    }

    console.error(`✅ Claude generated ${validWords.length} valid hint words (${uniqueWords.length - validWords.length} filtered out)\n`);
    return validWords;
  } catch (error) {
    console.error('❌ Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Load puzzle from Sanity by ID or slug
 */
async function loadPuzzleFromSanity(puzzleId: string): Promise<SanityStrandsPuzzle | null> {
  const query = groq`*[_id == $id || (_type == "strandsPuzzle" && slug.current == $id)][0] {
    _id,
    _type,
    title,
    slug,
    themeWords[] {
      word,
      isSpangram
    },
    canonicalGrid,
    hintWords,
  }`;

  return await sanityClient.fetch<SanityStrandsPuzzle>(query, {id: puzzleId});
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: any = {
    minLength: 4,
    maxLength: 15,
    maxWords: 500,
    format: 'text',
    includeThreeLetters: false,
    save: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--grid':
        options.grid = args[++i];
        break;
      case '--puzzle-id':
        options.puzzleId = args[++i];
        break;
      case '--theme-words':
        options.themeWords = args[++i].split(',').map((w: string) => w.trim());
        break;
      case '--min-length':
        options.minLength = parseInt(args[++i], 10);
        break;
      case '--max-length':
        options.maxLength = parseInt(args[++i], 10);
        break;
      case '--max-words':
        options.maxWords = parseInt(args[++i], 10);
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--include-3-letter':
        options.includeThreeLetters = true;
        break;
      case '--save':
        options.save = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  process.stdout.write(`
Strands Hint Word Generator
============================

Discovers all valid English words in a Strands game grid.

USAGE:
  npx tsx scripts/generate-hint-words.ts --grid "ABCDEF..." [options]

OPTIONS:
  --grid <string>          Grid letters (48 characters)
                          Example: "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUV"

  --theme-words <words>    Comma-separated theme words to exclude
                          Example: "BASEBALL,FOOTBALL,TENNIS"

  --min-length <number>    Minimum word length (default: 4)
  --max-length <number>    Maximum word length (default: 15)
  --max-words <number>     Maximum words to find (default: 500)

  --include-3-letter       Include 3-letter words (default: false)

  --format <type>          Output format: text, json, sanity, csv, comma, sanity-paste
                          - text: Human-readable summary (default)
                          - json: Full JSON output
                          - sanity: Format for Sanity import
                          - top20: Top 20 hint words only
                          - csv/comma: Comma-delimited list of words
                          - sanity-paste: JSON array format (copy the array from output)

  --output <file>          Save results to file (default: stdout)

  --save                   Save hint words back to Sanity puzzle
                          (requires --puzzle-id, merges with existing words)

  --help, -h               Show this help message

EXAMPLES:

  # Basic usage with grid string
  npx tsx scripts/generate-hint-words.ts --grid "STARABLECAREFASTLATEMADENAMEOPEN..."

  # Exclude theme words
  npx tsx scripts/generate-hint-words.ts \\
    --grid "STARABLECARE..." \\
    --theme-words "STAR,CARE,LATE"

  # Save to JSON file
  npx tsx scripts/generate-hint-words.ts \\
    --grid "STARABLECARE..." \\
    --format json \\
    --output results.json

  # Get top 20 hint words for Sanity
  npx tsx scripts/generate-hint-words.ts \\
    --grid "STARABLECARE..." \\
    --theme-words "BASEBALL,SOFTBALL" \\
    --format top20

  # Include 3-letter words and find more words
  npx tsx scripts/generate-hint-words.ts \\
    --grid "STARABLECARE..." \\
    --include-3-letter \\
    --max-words 1000

  # Load from Sanity puzzle and output comma-delimited
  npx tsx scripts/generate-hint-words.ts \\
    --puzzle-id "puzzle-slug-or-id" \\
    --format comma

  # Generate and save hint words to Sanity puzzle
  npx tsx scripts/generate-hint-words.ts \\
    --puzzle-id "puzzle-slug-or-id" \\
    --format comma \\
    --save

  # Generate hint words for manual paste into Sanity Studio
  npx tsx scripts/generate-hint-words.ts \\
    --puzzle-id "puzzle-slug-or-id" \\
    --format sanity-paste \\
    --output words.txt
`);
}

// Main execution
async function main() {
  const options = parseArgs();

  // Validate required options
  if (!options.grid && !options.puzzleId) {
    console.error('Error: Either --grid or --puzzle-id is required\n');
    printHelp();
    process.exit(1);
  }

  // Validate --save requires --puzzle-id
  if (options.save && !options.puzzleId) {
    console.error('Error: --save requires --puzzle-id\n');
    printHelp();
    process.exit(1);
  }

  let grid: string | undefined;
  let themeWords: string[] = options.themeWords || [];
  let existingHintWords: string[] = [];
  let puzzleId: string | undefined;

  // Load from Sanity if puzzle-id provided
  if (options.puzzleId) {
    console.error(`📡 Loading puzzle from Sanity: ${options.puzzleId}\n`);
    const puzzle = await loadPuzzleFromSanity(options.puzzleId);

    if (!puzzle) {
      console.error(`❌ Puzzle not found: ${options.puzzleId}\n`);
      process.exit(1);
    }

    puzzleId = puzzle._id;
    console.error(`✅ Found puzzle: ${puzzle.title || puzzle._id}\n`);

    // Extract grid from canonicalGrid
    if (!puzzle.canonicalGrid) {
      console.error('❌ Puzzle has no canonicalGrid\n');
      process.exit(1);
    }

    grid = getGridString(puzzle);
    if (!grid || grid.length !== 48) {
      console.error(`❌ Invalid grid: expected 48 characters, got ${grid?.length || 0}\n`);
      process.exit(1);
    }

    // Extract theme words from canonicalGrid.themePaths
    if (puzzle.canonicalGrid && isCanonicalGrid(puzzle.canonicalGrid)) {
      const canonicalGrid = parseCanonicalGrid(puzzle.canonicalGrid);
      themeWords = Object.keys(canonicalGrid.themePaths).map(w => w.toUpperCase());
      console.error(`🎯 Theme words from puzzle: ${themeWords.join(', ')}\n`);
    }

    // Get existing hint words
    if (puzzle.hintWords && Array.isArray(puzzle.hintWords)) {
      existingHintWords = puzzle.hintWords.map(w => w.toUpperCase());
      console.error(`📝 Existing hint words: ${existingHintWords.length} words\n`);
    }
  } else {
    grid = options.grid;
  }

  // Validate grid length
  if (!grid || grid.length !== 48) {
    console.error(`Error: Grid must be exactly 48 characters (got ${grid?.length || 0})\n`);
    process.exit(1);
  }

  console.error('🔍 Generating hint words with Claude...\n');
  console.error(`Grid: ${grid}`);
  if (themeWords.length > 0) {
    console.error(`Theme words to exclude: ${themeWords.join(', ')}`);
  }
  console.error(`Options: ${options.minLength}-${options.maxLength} letters, max ${options.maxWords} words\n`);

  // Generate hint words using Claude
  const startTime = Date.now();
  const generatedWords = await generateHintWordsWithClaude(
    grid,
    themeWords,
    existingHintWords,
    {
      minLength: options.minLength,
      maxLength: options.maxLength,
      maxWords: options.maxWords,
    }
  );

  // Merge with existing hint words (avoid duplicates)
  const allWords = new Set<string>(existingHintWords);
  generatedWords.forEach(w => allWords.add(w.toUpperCase()));
  const mergedWords = Array.from(allWords).sort();

  const newWordsCount = mergedWords.length - existingHintWords.length;
  const duration = Date.now() - startTime;

  if (existingHintWords.length > 0) {
    console.error(`📊 Merged ${newWordsCount} new words with ${existingHintWords.length} existing words\n`);
  }

  // Format output based on format option
  let output = '';

  switch (options.format) {
    case 'json':
      output = JSON.stringify({
        words: mergedWords,
        count: mergedWords.length,
        newWords: newWordsCount,
        existingWords: existingHintWords.length,
        duration,
      }, null, 2);
      break;

    case 'sanity':
      output = JSON.stringify({
        words: mergedWords.map(w => ({word: w, difficulty: 'medium'})),
        metadata: {
          generatedAt: new Date().toISOString(),
          totalWords: mergedWords.length,
        },
      }, null, 2);
      break;

    case 'top20':
      output = JSON.stringify({
        words: mergedWords.slice(0, 20),
        count: Math.min(20, mergedWords.length),
      }, null, 2);
      break;

    case 'csv':
    case 'comma':
      output = mergedWords.join(',');
      break;

    case 'sanity-paste':
      // JSON array format that can be copied and pasted into Sanity Studio
      // In Sanity Studio, you can paste this JSON array directly into the field
      output = JSON.stringify(mergedWords, null, 2);
      break;

    case 'text':
    default:
      output = `=== HINT WORD ANALYSIS ===\n\n`;
      output += `Total Words: ${mergedWords.length}\n`;
      output += `New Words: ${newWordsCount}\n`;
      output += `Existing Words: ${existingHintWords.length}\n`;
      output += `Processing Time: ${duration}ms\n\n`;
      output += `Words:\n${mergedWords.join(', ')}\n`;
      break;
  }

  // Output results
  if (options.output) {
    const outputPath = path.resolve(options.output);
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.error(`\n💾 Results saved to: ${outputPath}`);
  } else {
    process.stdout.write(output + '\n');
  }

  // Save to Sanity if requested
  if (options.save && puzzleId) {
    console.error(`\n💾 Saving hint words to Sanity puzzle...`);
    console.error(`📝 Puzzle ID: ${puzzleId}`);
    console.error(`📝 Words to save: ${mergedWords.length} words\n`);
    try {
      const writeClient = getSanityWriteClient();
      const result = await writeClient
        .patch(puzzleId)
        .set({hintWords: mergedWords})
        .commit();

      console.error(`✅ Saved ${mergedWords.length} hint words to puzzle`);
      console.error(`📄 Document ID: ${result._id}`);
      console.error(`🔄 Revision: ${result._rev}\n`);

      // Verify by reading back
      console.error('🔍 Verifying write...\n');
      const verifyQuery = groq`*[_id == $id][0] {
        _id,
        hintWords
      }`;
      const verified = await writeClient.fetch(verifyQuery, {id: puzzleId});
      
      if (verified?.hintWords?.length === mergedWords.length) {
        console.error(`✅ Verification successful! Found ${verified.hintWords.length} hint words in document\n`);
        console.error(`First 10 words: ${verified.hintWords.slice(0, 10).join(', ')}...\n`);
      } else {
        console.error(`⚠️  Verification mismatch: Expected ${mergedWords.length}, got ${verified?.hintWords?.length || 0}\n`);
        if (verified?.hintWords) {
          console.error(`Actual words: ${verified.hintWords.slice(0, 10).join(', ')}...\n`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to save hint words:`, error);
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        if (error.message.includes('SANITY_EDITOR_KEY')) {
          console.error(`\n💡 Make sure SANITY_EDITOR_KEY is set in your .env file`);
        }
        if (error.message.includes('not found') || error.message.includes('404')) {
          console.error(`\n💡 Puzzle ID "${puzzleId}" may not exist or you may not have write permissions`);
        }
      }
      process.exit(1);
    }
  }

  // Print summary to stderr
  if (!options.output) {
    console.error('\n---');
    console.error(`✨ Generated ${newWordsCount} new words in ${duration}ms`);
    console.error(`📝 Total hint words: ${mergedWords.length}`);
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
