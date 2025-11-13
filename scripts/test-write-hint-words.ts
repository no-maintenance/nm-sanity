#!/usr/bin/env tsx
/**
 * Test script to write hint words directly to a Sanity puzzle
 * Usage: npx tsx scripts/test-write-hint-words.ts --puzzle-id "strands-2"
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

// Test words from the output
const testWords = [
  'AREA', 'AREAE', 'CAPE', 'CAPES', 'CELL', 'CELLS', 'CERE', 'CERES', 'COIL', 'COILS',
  'COLE', 'COLES', 'COLT', 'COLTS', 'CREME', 'CREMES', 'DALE', 'DALES', 'ELEM', 'ELMS',
  'EMIT', 'EMITS', 'FEMME', 'FEMMES', 'HELL', 'HELLS', 'HERO', 'HEROES', 'HONE', 'HONES',
  'HONEY', 'ILLS', 'IRES', 'ITEM', 'ITEMS', 'LILT', 'LIRE', 'LITE', 'LORE', 'LORES',
  'MELL', 'MELLS', 'MELT', 'MELTS', 'MEMO', 'MEMOS', 'MERE', 'MITE', 'MITES', 'MOLE',
  'MOLES', 'MOLT', 'MOLTS', 'MOREL', 'MORELS', 'MORT', 'MORTS', 'OILS', 'OMER', 'OMERS',
  'ONCE', 'PACE', 'PACES', 'RICE', 'RICES', 'RILE', 'RILES', 'ROIL', 'ROILS', 'ROLE',
  'ROLES', 'SELL', 'SELLS', 'SEME', 'SHELL', 'SHELLS', 'SHONE', 'SILO', 'SILT', 'SIRE',
  'SIRES', 'SITE', 'SITES', 'SLOE', 'SMELL', 'SMELLS', 'SMELT', 'SMELTS', 'SOME', 'SPATE',
  'STEM', 'STEMS', 'TELL', 'TELLS', 'TILL', 'TILLS', 'TRICE', 'TRICES'
];

async function main() {
  const puzzleId = process.argv.find(arg => arg.startsWith('--puzzle-id'))?.split('=')[1] || 
                   process.argv[process.argv.indexOf('--puzzle-id') + 1];
  
  if (!puzzleId) {
    console.error('Error: --puzzle-id is required');
    console.error('Usage: npx tsx scripts/test-write-hint-words.ts --puzzle-id "strands-2"');
    process.exit(1);
  }

  const editorToken = process.env.SANITY_EDITOR_KEY;
  if (!editorToken) {
    console.error('Error: SANITY_EDITOR_KEY environment variable is required');
    process.exit(1);
  }

  const writeClient = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token: editorToken,
    useCdn: false,
  });

  console.error(`📡 Looking up puzzle: ${puzzleId}\n`);

  // First, try to find the puzzle by slug or ID
  const query = groq`*[_id == $id || (_type == "strandsPuzzle" && slug.current == $id)][0] {
    _id,
    _type,
    title,
    slug,
    hintWords
  }`;

  const puzzle = await writeClient.fetch(query, {id: puzzleId});

  if (!puzzle) {
    console.error(`❌ Puzzle not found: ${puzzleId}\n`);
    process.exit(1);
  }

  console.error(`✅ Found puzzle: ${puzzle.title || puzzle._id}`);
  console.error(`📝 Current hint words: ${puzzle.hintWords?.length || 0} words\n`);

  console.error(`💾 Writing ${testWords.length} hint words to puzzle...\n`);

  try {
    const result = await writeClient
      .patch(puzzle._id)
      .set({hintWords: testWords})
      .commit();

    console.error(`✅ Successfully saved ${testWords.length} hint words!`);
    console.error(`📄 Document ID: ${result._id}`);
    console.error(`🔄 Revision: ${result._rev}\n`);

    // Verify by reading back
    console.error('🔍 Verifying write...\n');
    const verifyQuery = groq`*[_id == $id][0] {
      _id,
      hintWords
    }`;
    const verified = await writeClient.fetch(verifyQuery, {id: puzzle._id});
    
    if (verified?.hintWords?.length === testWords.length) {
      console.error(`✅ Verification successful! Found ${verified.hintWords.length} hint words in document\n`);
      console.error(`First 10 words: ${verified.hintWords.slice(0, 10).join(', ')}...\n`);
    } else {
      console.error(`⚠️  Verification mismatch: Expected ${testWords.length}, got ${verified?.hintWords?.length || 0}\n`);
    }
  } catch (error) {
    console.error(`❌ Failed to save hint words:`, error);
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      if (error.message.includes('token')) {
        console.error(`\n💡 Check that SANITY_EDITOR_KEY has write permissions`);
      }
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

