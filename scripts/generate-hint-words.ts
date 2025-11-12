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

import {generateHintWords, formatHintWordSummary, exportForSanity, getTopHintWords} from '../app/lib/games/hint-word-generator';
import {gridToString} from '../app/lib/games/strands-logic';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: any = {
    minLength: 4,
    maxLength: 15,
    maxWords: 500,
    format: 'text',
    includeThreeLetters: false,
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
  console.log(`
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

  --format <type>          Output format: text, json, sanity
                          - text: Human-readable summary (default)
                          - json: Full JSON output
                          - sanity: Format for Sanity import
                          - top20: Top 20 hint words only

  --output <file>          Save results to file (default: stdout)

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

  // Validate grid length
  if (options.grid && options.grid.length !== 48) {
    console.error(`Error: Grid must be exactly 48 characters (got ${options.grid.length})\n`);
    process.exit(1);
  }

  console.error('🔍 Generating hint words...\n');
  console.error(`Grid: ${options.grid.substring(0, 20)}...`);
  if (options.themeWords) {
    console.error(`Theme words to exclude: ${options.themeWords.join(', ')}`);
  }
  console.error(`Options: ${options.minLength}-${options.maxLength} letters, max ${options.maxWords} words\n`);

  // Progress tracking
  let lastProgress = 0;
  const progressCallback = (progress: {current: number; total: number; word?: string}) => {
    if (progress.current > lastProgress) {
      lastProgress = progress.current;
      process.stderr.write(`\r⏳ Found ${progress.current} words... ${progress.word || ''}`);
    }
  };

  // Generate hint words
  const result = await generateHintWords(
    options.grid,
    options.themeWords || [],
    {
      minLength: options.minLength,
      maxLength: options.maxLength,
      maxWords: options.maxWords,
      includeThreeLetters: options.includeThreeLetters,
      progressCallback,
    }
  );

  process.stderr.write('\r✅ Complete!                                           \n\n');

  // Format output based on format option
  let output = '';

  switch (options.format) {
    case 'json':
      output = JSON.stringify(result, null, 2);
      break;

    case 'sanity':
      output = JSON.stringify(exportForSanity(result), null, 2);
      break;

    case 'top20':
      const top20 = getTopHintWords(result, 20);
      output = JSON.stringify({
        words: top20.map(w => w.word),
        count: top20.length,
      }, null, 2);
      break;

    case 'text':
    default:
      output = formatHintWordSummary(result);
      break;
  }

  // Output results
  if (options.output) {
    const outputPath = path.resolve(options.output);
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.error(`\n💾 Results saved to: ${outputPath}`);
  } else {
    console.log(output);
  }

  // Print summary to stderr (so it doesn't interfere with piped output)
  if (!options.output) {
    console.error('\n---');
    console.error(`✨ Found ${result.totalWordsFound} unique words in ${result.processingStats.duration}ms`);
    console.error(`📊 Cache hit rate: ${Math.round((result.processingStats.cacheHits / (result.processingStats.apiCalls + result.processingStats.cacheHits)) * 100)}%`);
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
