#!/usr/bin/env npx tsx
/**
 * Migration script to add canonical paths to existing Strands puzzles
 * This ensures older puzzles work correctly with the new path validation system
 */

import {createClient} from '@sanity/client';
import groq from 'groq';
import {findWordPath, gridToString} from '../app/lib/games/strands-logic';
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
  token: process.env.SANITY_API_WRITE_TOKEN, // Need write token for mutations
  useCdn: false,
});

interface StrandsPuzzle {
  _id: string;
  title: string;
  themeWords: Array<{
    word: string;
    isSpangram: boolean;
  }>;
  generatedGrid: string | {rows: Array<{cells: string[]}>};
  gridMetadata?: {
    canonicalPaths?: string; // JSON string of Record<string, number[]>
  };
}

async function generateCanonicalPaths(puzzle: StrandsPuzzle): Promise<Record<string, number[]> | null> {
  const canonicalPaths: Record<string, number[]> = {};

  // Convert grid to string format
  const gridString = gridToString(puzzle.generatedGrid);
  if (!gridString) {
    console.error(`  ❌ Invalid grid format for puzzle: ${puzzle.title}`);
    return null;
  }

  // Find canonical path for each theme word
  for (const themeWord of puzzle.themeWords) {
    const word = themeWord.word.toUpperCase();
    const path = findWordPath(puzzle.generatedGrid, word);

    if (!path) {
      console.error(`  ❌ Could not find path for word "${word}" in puzzle: ${puzzle.title}`);
      return null;
    }

    canonicalPaths[word] = path;
    console.log(`  ✓ Found path for "${word}": [${path.join(', ')}]`);
  }

  return canonicalPaths;
}

async function migratePuzzles() {
  console.log('🔍 Fetching Strands puzzles...\n');

  // Query all strands puzzles
  const query = groq`*[_type == "strandsPuzzle"] {
    _id,
    title,
    themeWords[] {
      word,
      isSpangram
    },
    generatedGrid,
    gridMetadata
  }`;

  const puzzles = await client.fetch<StrandsPuzzle[]>(query);
  console.log(`Found ${puzzles.length} puzzles\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const puzzle of puzzles) {
    console.log(`Processing: ${puzzle.title}`);

    // Skip if already has canonical paths
    if (puzzle.gridMetadata?.canonicalPaths) {
      try {
        const existingPaths = typeof puzzle.gridMetadata.canonicalPaths === 'string'
          ? JSON.parse(puzzle.gridMetadata.canonicalPaths) as Record<string, number[]>
          : puzzle.gridMetadata.canonicalPaths as Record<string, number[]>;
        if (Object.keys(existingPaths).length > 0) {
          console.log('  ⏭️  Already has canonical paths, skipping\n');
          skippedCount++;
          continue;
        }
      } catch (e) {
        console.log('  ⚠️  Invalid canonical paths format, regenerating...');
      }
    }

    // Skip if no grid
    if (!puzzle.generatedGrid) {
      console.log('  ⏭️  No grid generated yet, skipping\n');
      skippedCount++;
      continue;
    }

    // Generate canonical paths
    const canonicalPaths = await generateCanonicalPaths(puzzle);

    if (!canonicalPaths) {
      console.log('  ❌ Failed to generate canonical paths\n');
      errorCount++;
      continue;
    }

    // Update the puzzle with canonical paths (as JSON string)
    try {
      await client
        .patch(puzzle._id)
        .set({
          'gridMetadata.canonicalPaths': JSON.stringify(canonicalPaths, null, 2),
        })
        .commit();

      console.log('  ✅ Successfully updated with canonical paths\n');
      migratedCount++;
    } catch (error) {
      console.error(`  ❌ Failed to update puzzle: ${error}\n`);
      errorCount++;
    }
  }

  // Summary
  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Migrated: ${migratedCount} puzzles`);
  console.log(`  ⏭️  Skipped: ${skippedCount} puzzles`);
  console.log(`  ❌ Errors: ${errorCount} puzzles`);
  console.log('\n✨ Migration complete!');
}

// Run migration
migratePuzzles().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});