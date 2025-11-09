/**
 * Test script for grid generation
 * Run with: npx tsx app/lib/games/test-grid-generator.ts
 */

import {generateStrandsGrid} from './grid-generator';

async function testGridGeneration() {
  console.log('🎮 Testing Strands Grid Generation\n');

  // Sample beach-themed puzzle
  const beachPuzzle = {
    themeWords: [
      {word: 'SAND', isSpangram: false},
      {word: 'WAVE', isSpangram: false},
      {word: 'SHELL', isSpangram: false},
      {word: 'TIDE', isSpangram: false},
      {word: 'CORAL', isSpangram: false},
      {word: 'SEASHORE', isSpangram: true}, // This is the spangram
    ],
    ensureHints: true,
    minHintWords: 15,
  };

  console.log('Theme: Beach');
  console.log('Words to place:', beachPuzzle.themeWords.map((w) => w.word).join(', '));
  console.log('Spangram:', beachPuzzle.themeWords.find((w) => w.isSpangram)?.word);
  console.log('\nGenerating grid...\n');

  const result = await generateStrandsGrid(beachPuzzle);

  if (result.success) {
    console.log('✅ Grid generation successful!\n');

    // Display the grid
    console.log('Generated Grid (6x8):');
    console.log('─'.repeat(33));
    for (let row = 0; row < 6; row++) {
      const rowLetters = result.grid
        .slice(row * 8, (row + 1) * 8)
        .split('')
        .join(' ');
      console.log(`│ ${rowLetters} │`);
    }
    console.log('─'.repeat(33));

    console.log(`\nHint words available: ${result.hintWordCount}`);
    console.log(
      `\nPlaced hint words (${result.placedHintWords.length}):`,
      result.placedHintWords.join(', '),
    );
    console.log(
      `\nSample discoverable hints (${result.foundHintWords.length}):`,
      result.foundHintWords.slice(0, 10).join(', '),
    );
  } else {
    console.log('❌ Grid generation failed');
    if (result.warning) {
      console.log(`⚠️  Warning: ${result.warning}`);
    }
  }

  console.log('\n' + '='.repeat(50));

  // Test another theme
  console.log('\n🎮 Testing with Sports theme\n');

  const sportsPuzzle = {
    themeWords: [
      {word: 'BALL', isSpangram: false},
      {word: 'GOAL', isSpangram: false},
      {word: 'TEAM', isSpangram: false},
      {word: 'PLAY', isSpangram: false},
      {word: 'SCORE', isSpangram: false},
      {word: 'ATHLETE', isSpangram: true},
    ],
    ensureHints: true,
    minHintWords: 15,
  };

  console.log('Theme: Sports');
  console.log('Words to place:', sportsPuzzle.themeWords.map((w) => w.word).join(', '));
  console.log('Spangram:', sportsPuzzle.themeWords.find((w) => w.isSpangram)?.word);
  console.log('\nGenerating grid...\n');

  const result2 = await generateStrandsGrid(sportsPuzzle);

  if (result2.success) {
    console.log('✅ Grid generation successful!\n');

    console.log('Generated Grid (6x8):');
    console.log('─'.repeat(33));
    for (let row = 0; row < 6; row++) {
      const rowLetters = result2.grid
        .slice(row * 8, (row + 1) * 8)
        .split('')
        .join(' ');
      console.log(`│ ${rowLetters} │`);
    }
    console.log('─'.repeat(33));

    console.log(`\nHint words available: ${result2.hintWordCount}`);
  } else {
    console.log('❌ Grid generation failed');
    if (result2.warning) {
      console.log(`⚠️  Warning: ${result2.warning}`);
    }
  }
}

testGridGeneration().catch(console.error);
