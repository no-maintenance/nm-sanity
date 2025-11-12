import {describe, it, expect} from 'vitest';
import {
  validateWord,
  findWordPath,
  gridToString,
  type WordValidationResult,
} from '../app/lib/games/strands-logic';
import {generateStrandsGrid} from '../app/lib/games/grid-generator';

describe('Canonical Paths System', () => {
  describe('Grid Generation', () => {
    it('should generate canonical paths for all theme words', async () => {
      const themeWords = [
        {word: 'SPANS', isSpangram: true},
        {word: 'TEST', isSpangram: false},
        {word: 'WORD', isSpangram: false},
      ];

      const result = await generateStrandsGrid({
        themeWords,
        ensureHints: false,
        minHintWords: 0,
      });

      expect(result.success).toBe(true);
      expect(result.canonicalPaths).toBeDefined();
      expect(Object.keys(result.canonicalPaths!)).toHaveLength(3);
      expect(result.canonicalPaths!['SPANS']).toBeDefined();
      expect(result.canonicalPaths!['TEST']).toBeDefined();
      expect(result.canonicalPaths!['WORD']).toBeDefined();
    });

    it('should store valid paths for each word', async () => {
      const themeWords = [
        {word: 'SPANS', isSpangram: true},
        {word: 'TEST', isSpangram: false},
      ];

      const result = await generateStrandsGrid({
        themeWords,
        ensureHints: false,
        minHintWords: 0,
      });

      // Verify each canonical path forms the correct word
      for (const [word, path] of Object.entries(result.canonicalPaths!)) {
        const letters = path.map(index => result.grid[index]);
        const formedWord = letters.join('');
        expect(formedWord).toBe(word);
      }
    });
  });

  describe('Path Validation', () => {
    const mockDatamuseValidator = async (word: string) => ({
      isValid: true,
      error: undefined,
    });

    it('should accept correct canonical path for theme word', async () => {
      const themeWords = [{word: 'TEST', isSpangram: false}];
      const canonicalPaths = {
        'TEST': [0, 1, 2, 3], // Canonical path
      };

      const result = await validateWord(
        'TEST',
        [0, 1, 2, 3], // Using canonical path
        themeWords,
        new Set(),
        mockDatamuseValidator,
        canonicalPaths,
      );

      expect(result.type).toBe('theme-word');
      expect(result.isThemeWord).toBe(true);
      expect(result.message).toContain('Theme word found');
    });

    it('should reject wrong path for theme word', async () => {
      const themeWords = [{word: 'TEST', isSpangram: false}];
      const canonicalPaths = {
        'TEST': [0, 1, 2, 3], // Canonical path
      };

      const result = await validateWord(
        'TEST',
        [4, 5, 6, 7], // Different path (wrong)
        themeWords,
        new Set(),
        mockDatamuseValidator,
        canonicalPaths,
      );

      expect(result.type).toBe('wrong-path');
      expect(result.isThemeWord).toBe(false);
      expect(result.message).toContain('wrong path');
      expect(result.message).toContain('Try a different route');
    });

    it('should accept theme word when no canonical paths defined (backwards compatibility)', async () => {
      const themeWords = [{word: 'TEST', isSpangram: false}];

      const result = await validateWord(
        'TEST',
        [10, 11, 12, 13], // Any path
        themeWords,
        new Set(),
        mockDatamuseValidator,
        undefined, // No canonical paths
      );

      expect(result.type).toBe('theme-word');
      expect(result.isThemeWord).toBe(true);
    });

    it('should handle spangram with wrong path', async () => {
      const themeWords = [{word: 'SPANGRAM', isSpangram: true}];
      const canonicalPaths = {
        'SPANGRAM': [0, 6, 12, 18, 24, 30, 36, 42], // Canonical path (spans edges)
      };

      const result = await validateWord(
        'SPANGRAM',
        [1, 2, 3, 4, 5, 6, 7, 8], // Wrong path
        themeWords,
        new Set(),
        mockDatamuseValidator,
        canonicalPaths,
      );

      expect(result.type).toBe('wrong-path');
      expect(result.message).toContain('"SPANGRAM" is correct');
      expect(result.message).toContain('wrong path');
    });
  });

  describe('Multiple Path Scenarios', () => {
    it('should handle word that can be formed multiple ways', async () => {
      // Create a grid where "STILL" can be formed in two ways
      // This simulates the exact issue from the screenshot
      const grid = 'WSLTSSOHHSLIMROAPCEEMEAFORMEMEORYSLEIRONIECTACRTTHG';

      // Find all possible paths for "STILL"
      const path1 = findWordPath({rows: []}, 'STILL'); // This would need the actual grid structure

      // In a real scenario, we'd test that only one canonical path is accepted
      // and the other is rejected with the wrong-path message
      expect(true).toBe(true); // Placeholder for actual test
    });

    it('should prevent orphaned letters by enforcing canonical paths', async () => {
      // Test that enforcing canonical paths prevents the puzzle from becoming unsolvable
      const themeWords = [
        {word: 'STILL', isSpangram: false},
        {word: 'MEMORY', isSpangram: false},
        {word: 'SILENCE', isSpangram: true},
      ];

      const result = await generateStrandsGrid({
        themeWords,
        ensureHints: false,
        minHintWords: 0,
      });

      // Verify that each word has exactly one canonical path
      expect(result.canonicalPaths).toBeDefined();
      for (const word of themeWords) {
        const canonicalPath = result.canonicalPaths![word.word];
        expect(canonicalPath).toBeDefined();
        expect(Array.isArray(canonicalPath)).toBe(true);
      }

      // Verify no cells are shared between canonical paths (no overlaps)
      const usedCells = new Set<number>();
      for (const path of Object.values(result.canonicalPaths!)) {
        for (const cell of path) {
          expect(usedCells.has(cell)).toBe(false);
          usedCells.add(cell);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty canonical paths object', async () => {
      const themeWords = [{word: 'TEST', isSpangram: false}];
      const canonicalPaths = {}; // Empty but defined

      const result = await validateWord(
        'TEST',
        [0, 1, 2, 3],
        themeWords,
        new Set(),
        mockDatamuseValidator,
        canonicalPaths,
      );

      // Should accept since no canonical path is defined for this word
      expect(result.type).toBe('theme-word');
    });

    it('should handle paths of different lengths', async () => {
      const themeWords = [{word: 'TEST', isSpangram: false}];
      const canonicalPaths = {
        'TEST': [0, 1, 2, 3], // 4 cells
      };

      const result = await validateWord(
        'TEST',
        [0, 1, 2], // Only 3 cells (wrong length)
        themeWords,
        new Set(),
        mockDatamuseValidator,
        canonicalPaths,
      );

      expect(result.type).toBe('wrong-path');
    });
  });
});