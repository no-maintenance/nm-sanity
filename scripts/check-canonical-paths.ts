#!/usr/bin/env npx tsx
/**
 * Script to check canonical paths for a specific Strands puzzle
 */

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

// Initialize Sanity client
const projectId = process.env.PUBLIC_SANITY_STUDIO_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || 'np4gh1g3';
const dataset = process.env.PUBLIC_SANITY_STUDIO_DATASET || process.env.SANITY_STUDIO_DATASET || 'production';

console.log(`📡 Using project: ${projectId}, dataset: ${dataset}\n`);

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface StrandsPuzzle {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  themeWords: Array<{
    word: string;
    isSpangram: boolean;
  }>;
  generatedGrid: string | {rows: Array<{cells: string[]}>};
  gridMetadata?: {
    canonicalPaths?: string;
  };
}

function gridToString(grid: any): string {
  if (typeof grid === 'string') {
    return grid.toUpperCase();
  }

  if (grid && typeof grid === 'object' && 'rows' in grid && Array.isArray(grid.rows)) {
    return grid.rows
      .map((row: any) => {
        if (row && typeof row === 'object' && 'cells' in row && Array.isArray(row.cells)) {
          return row.cells.join('');
        }
        return '';
      })
      .join('')
      .toUpperCase();
  }

  return '';
}

function visualizeGrid(gridString: string, path: number[]): void {
  const GRID_COLS = 6;
  const GRID_ROWS = 8;

  console.log('  Grid visualization:');
  for (let row = 0; row < GRID_ROWS; row++) {
    let rowStr = '  ';
    for (let col = 0; col < GRID_COLS; col++) {
      const index = row * GRID_COLS + col;
      const letter = gridString[index] || ' ';
      const pathPosition = path.indexOf(index);

      if (pathPosition >= 0) {
        // Highlight cells in the path with their order
        rowStr += `[${letter}${pathPosition + 1}] `;
      } else {
        rowStr += ` ${letter}  `;
      }
    }
    console.log(rowStr);
  }
}

async function checkCanonicalPaths(puzzleSlug: string) {
  console.log(`🔍 Fetching puzzle: ${puzzleSlug}\n`);

  // Query for the specific puzzle
  const query = groq`*[_type == "strandsPuzzle" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    themeWords[] {
      word,
      isSpangram
    },
    generatedGrid,
    gridMetadata
  }`;

  const puzzle = await client.fetch<StrandsPuzzle>(query, {slug: puzzleSlug});

  if (!puzzle) {
    console.log(`❌ Puzzle with slug "${puzzleSlug}" not found`);
    return;
  }

  console.log(`📋 Puzzle: ${puzzle.title}`);
  console.log(`📝 ID: ${puzzle._id}\n`);

  // Display theme words
  console.log('🎯 Theme Words:');
  puzzle.themeWords.forEach((tw) => {
    const badge = tw.isSpangram ? ' [SPANGRAM]' : '';
    console.log(`  - ${tw.word}${badge}`);
  });
  console.log();

  // Check if canonical paths exist
  if (!puzzle.gridMetadata?.canonicalPaths) {
    console.log('⚠️  No canonical paths defined for this puzzle');
    console.log('💡 Run the migration script to generate canonical paths\n');
    return;
  }

  // Parse and display canonical paths
  try {
    const canonicalPaths = JSON.parse(puzzle.gridMetadata.canonicalPaths);
    const gridString = gridToString(puzzle.generatedGrid);

    console.log('📍 Canonical Paths:\n');

    for (const [word, path] of Object.entries(canonicalPaths)) {
      console.log(`Word: ${word}`);
      console.log(`  Path (indices): [${(path as number[]).join(', ')}]`);

      // Show the letters that form the word
      const letters = (path as number[]).map(index => gridString[index]);
      console.log(`  Letters: ${letters.join(' → ')}`);

      // Visualize the path on the grid
      visualizeGrid(gridString, path as number[]);
      console.log();
    }

    // Display the full grid for reference
    console.log('📊 Full Grid:');
    const GRID_COLS = 6;
    const GRID_ROWS = 8;
    for (let row = 0; row < GRID_ROWS; row++) {
      let rowStr = '  ';
      for (let col = 0; col < GRID_COLS; col++) {
        const index = row * GRID_COLS + col;
        rowStr += `${gridString[index]} `;
      }
      console.log(rowStr);
    }

  } catch (error) {
    console.error('❌ Error parsing canonical paths:', error);
  }
}

// Get puzzle slug from command line argument
const puzzleSlug = process.argv[2] || 'strands-1';

// Run the check
checkCanonicalPaths(puzzleSlug).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});