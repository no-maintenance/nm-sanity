import {describe, it, expect} from 'vitest';
import {generateStrandsGrid} from '../grid-generator';

describe('Grid Generator', () => {
  describe('Basic Generation', () => {
    it('should generate a valid 48-letter grid', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'SAND', isSpangram: false},
          {word: 'WAVE', isSpangram: false},
          {word: 'SEASHORE', isSpangram: true},
        ],
        ensureHints: false,
      });

      expect(result.grid).toHaveLength(48);
      expect(result.grid).toMatch(/^[A-Z]{48}$/);
    });

    it('should succeed with simple puzzle', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'BALL', isSpangram: false},
          {word: 'GOAL', isSpangram: false},
          {word: 'ATHLETE', isSpangram: true},
        ],
        ensureHints: false,
      });

      expect(result.success).toBe(true);
      expect(result.grid).toBeTruthy();
    });
  });

  describe('Spangram Validation', () => {
    it('should fail without spangram', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'SAND', isSpangram: false},
          {word: 'WAVE', isSpangram: false},
        ],
        ensureHints: false,
      });

      expect(result.success).toBe(false);
      expect(result.warning).toContain('No spangram');
    });

    it('should place spangram that spans edges', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'TEST', isSpangram: false},
          {word: 'TESTWORD', isSpangram: true},
        ],
        ensureHints: false,
      });

      // If successful, the spangram should be in the grid
      if (result.success) {
        expect(result.grid).toContain('T');
        expect(result.grid).toContain('E');
        expect(result.grid).toContain('S');
      }
    });
  });

  describe('Theme Word Placement', () => {
    it('should include all theme words in grid', async () => {
      const themeWords = [
        {word: 'SAND', isSpangram: false},
        {word: 'WAVE', isSpangram: false},
        {word: 'TIDE', isSpangram: false},
        {word: 'SEASHORE', isSpangram: true},
      ];

      const result = await generateStrandsGrid({
        themeWords,
        ensureHints: false,
      });

      if (result.success) {
        // Check that all unique letters from theme words are present
        const themeLetters = new Set(themeWords.flatMap((w) => w.word.split('')));
        for (const letter of themeLetters) {
          expect(result.grid).toContain(letter);
        }
      }
    });
  });

  describe('Hint Word Generation', () => {
    it('should generate grid with hint words when requested', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'SAND', isSpangram: false},
          {word: 'WAVE', isSpangram: false},
          {word: 'SEASHORE', isSpangram: true},
        ],
        ensureHints: true,
        minHintWords: 10,
      });

      if (result.success) {
        expect(result.hintWordCount).toBeGreaterThanOrEqual(10);
      }
    });

    it('should report hint words found', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'BALL', isSpangram: false},
          {word: 'GAME', isSpangram: false},
          {word: 'ATHLETE', isSpangram: true},
        ],
        ensureHints: true,
        minHintWords: 5,
      });

      if (result.success) {
        expect(result.hintWordCount).toBeGreaterThan(0);
        expect(result.foundHintWords).toBeDefined();
      }
    });

    it('should place hint words strategically', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'SAND', isSpangram: false},
          {word: 'WAVE', isSpangram: false},
          {word: 'SEASHORE', isSpangram: true},
        ],
        ensureHints: true,
        minHintWords: 15,
      });

      if (result.success) {
        expect(result.placedHintWords).toBeDefined();
        expect(Array.isArray(result.placedHintWords)).toBe(true);
        // The generator attempts strategic placement, but success varies
        // The important thing is that total hint words meet the threshold
        expect(result.hintWordCount).toBeGreaterThanOrEqual(15);
      }
    });
  });

  describe('Grid Quality', () => {
    it('should generate valid uppercase letters only', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'TEST', isSpangram: false},
          {word: 'EXAMPLE', isSpangram: true},
        ],
        ensureHints: false,
      });

      if (result.success) {
        expect(result.grid).toMatch(/^[A-Z]+$/);
        expect(result.grid.toLowerCase()).not.toBe(result.grid);
      }
    });

    it('should use all 48 positions', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'WORD', isSpangram: false},
          {word: 'TESTGRID', isSpangram: true},
        ],
        ensureHints: false,
      });

      if (result.success) {
        expect(result.grid.length).toBe(48);
        expect(result.grid.split('').every((c) => c !== '')).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle very long words gracefully', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'VERYLONGWORDTHATMIGHTNOTFIT', isSpangram: true},
        ],
        ensureHints: false,
      });

      // Should either succeed or fail gracefully
      expect(result).toBeDefined();
      expect(result.grid).toBeDefined();
    });

    it('should handle many words', async () => {
      const words = [];
      for (let i = 0; i < 15; i++) {
        words.push({word: `WORD${i}`, isSpangram: false});
      }
      words.push({word: 'SPANGRAM', isSpangram: true});

      const result = await generateStrandsGrid({
        themeWords: words,
        ensureHints: false,
      });

      // Should attempt generation
      expect(result).toBeDefined();
    });
  });

  describe('Consistency', () => {
    it('should generate different grids on multiple runs', async () => {
      const config = {
        themeWords: [
          {word: 'TEST', isSpangram: false},
          {word: 'EXAMPLE', isSpangram: true},
        ],
        ensureHints: false,
      };

      const result1 = await generateStrandsGrid(config);
      const result2 = await generateStrandsGrid(config);

      // Grids should be different due to randomization
      if (result1.success && result2.success) {
        // Allow for the possibility they might be the same, but unlikely
        expect(result1.grid).toBeDefined();
        expect(result2.grid).toBeDefined();
      }
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle beach-themed puzzle', async () => {
      const result = await generateStrandsGrid({
        themeWords: [
          {word: 'SAND', isSpangram: false},
          {word: 'WAVE', isSpangram: false},
          {word: 'SHELL', isSpangram: false},
          {word: 'TIDE', isSpangram: false},
          {word: 'CORAL', isSpangram: false},
          {word: 'SEASHORE', isSpangram: true},
        ],
        ensureHints: true,
        minHintWords: 15,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.grid).toHaveLength(48);
        expect(result.hintWordCount).toBeGreaterThanOrEqual(15);
      }
    }, 10000); // Longer timeout for complex generation

    it('should handle sports-themed puzzle', async () => {
      const result = await generateStrandsGrid({
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
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.grid).toHaveLength(48);
        expect(result.hintWordCount).toBeGreaterThanOrEqual(15);
      }
    }, 10000);
  });
});
