#!/usr/bin/env tsx
/**
 * Add hint words to strands-1 puzzle
 */
import {createClient} from '@sanity/client';

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'a7zl88o2',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const hintWords = [
  "DAME", "MADE", "MESA", "SEAM", "MACE", "CAPE", "PACE", "RICE", "ROAM", "FORE",
  "LORE", "LIME", "SLIM", "DIME", "SLIME", "SPADE", "SHAME", "CREAM", "FOAM", "MEAT",
  "SHAD", "SHAM", "MASH", "DASH", "MICE", "LICE", "MIRE", "RILE", "SORE", "ROSE",
  "ROLE", "YORE", "FAME", "ACME", "MICA", "CITE", "CENT", "SEMI", "LEIS", "TACT",
  "SHOD", "REAM", "CAMP", "REAP", "RACE", "HAME", "LIEN", "DELI", "SOAR", "ELMS",
  "ROES", "HAMS", "DAMS", "RAMS", "FORA", "CAFE", "FACE", "AFRO", "HAMES", "SHAMS"
];

async function main() {
  try {
    console.log('Updating strands-1 puzzle with hint words...');

    const result = await client
      .patch('149c69b2-a020-4386-9ee8-3bebd7b31e95')
      .set({ hintWords })
      .commit();

    console.log('✅ Success! Added', hintWords.length, 'hint words to strands-1');
    console.log('Document ID:', result._id);
    console.log('Revision:', result._rev);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
