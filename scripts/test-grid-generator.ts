#!/usr/bin/env npx tsx
/**
 * Test script to verify grid generator works independently
 */

import {generateStrandsGrid} from '../app/lib/games/grid-generator';

async function testGridGeneration() {
  console.log('🧪 Testing Grid Generator...\n');

  const testCases = [
    {
      name: 'Strands #1 Words',
      themeWords: [
        {word: 'SHADOW', isSpangram: false},
        {word: 'LIGHT', isSpangram: false},
        {word: 'MEMORY', isSpangram: true},
        {word: 'TIME', isSpangram: false},
        {word: 'SILENCE', isSpangram: false},
        {word: 'STILL', isSpangram: false},
        {word: 'TRACE', isSpangram: false},
        {word: 'FORMS', isSpangram: false},
        {word: 'SPACE', isSpangram: false},
      ],
    },
    {
      name: 'Simple Test',
      themeWords: [
        {word: 'SPANS', isSpangram: true},
        {word: 'TEST', isSpangram: false},
        {word: 'WORD', isSpangram: false},
      ],
    },
  ];

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Theme words: ${testCase.themeWords.map(w => w.word).join(', ')}\n`);

    try {
      const result = await generateStrandsGrid({
        themeWords: testCase.themeWords,
        ensureHints: true,
        minHintWords: 10,
      });

      if (result.success) {
        console.log('✅ Grid generated successfully!');
        console.log(`   Grid size: ${result.grid.length} characters`);
        console.log(`   Hint words found: ${result.hintWordCount}`);
        console.log(`   Canonical paths generated: ${Object.keys(result.canonicalPaths || {}).length} words\n`);

        // Show canonical paths for words with multiple possible paths
        if (result.canonicalPaths) {
          console.log('📍 Canonical Paths:');
          for (const [word, path] of Object.entries(result.canonicalPaths)) {
            console.log(`   ${word}: [${path.join(', ')}]`);

            // Check if this is STILL and show the path
            if (word === 'STILL') {
              console.log(`   ⚠️  STILL path enforced - only this path will be accepted!`);
            }
          }
          console.log();
        }

        // Display the grid
        console.log('📊 Generated Grid:');
        const GRID_COLS = 6;
        const GRID_ROWS = 8;
        for (let row = 0; row < GRID_ROWS; row++) {
          let rowStr = '   ';
          for (let col = 0; col < GRID_COLS; col++) {
            const index = row * GRID_COLS + col;
            rowStr += `${result.grid[index]} `;
          }
          console.log(rowStr);
        }
      } else {
        console.log(`❌ Grid generation failed: ${result.warning || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }

    console.log('\n' + '─'.repeat(50) + '\n');
  }
}

// Run the test
testGridGeneration().catch(console.error);