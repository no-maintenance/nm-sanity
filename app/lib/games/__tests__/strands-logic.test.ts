import {describe, it, expect} from 'vitest';
import {
  indexToPosition,
  positionToIndex,
  areAdjacent,
  isValidPath,
  getWordFromPath,
  spansOppositeEdges,
  matchesThemeWord,
  isValidHintWord,
  calculateWordScore,
  isGameComplete,
  formatTime,
  getNeighbors,
} from '../strands-logic';

describe('Strands Logic - Position Utilities', () => {
  it('should convert index to position correctly', () => {
    expect(indexToPosition(0)).toEqual({row: 0, col: 0});
    expect(indexToPosition(7)).toEqual({row: 1, col: 1});
    expect(indexToPosition(8)).toEqual({row: 1, col: 2});
    expect(indexToPosition(47)).toEqual({row: 7, col: 5});
  });

  it('should convert position to index correctly', () => {
    expect(positionToIndex({row: 0, col: 0})).toBe(0);
    expect(positionToIndex({row: 1, col: 1})).toBe(7);
    expect(positionToIndex({row: 1, col: 2})).toBe(8);
    expect(positionToIndex({row: 7, col: 5})).toBe(47);
  });

  it('should convert back and forth between index and position', () => {
    for (let i = 0; i < 48; i++) {
      const pos = indexToPosition(i);
      expect(positionToIndex(pos)).toBe(i);
    }
  });
});

describe('Strands Logic - Adjacency', () => {
  it('should identify horizontally adjacent cells', () => {
    expect(areAdjacent(0, 1)).toBe(true); // right
    expect(areAdjacent(1, 0)).toBe(true); // left
  });

  it('should identify vertically adjacent cells', () => {
    expect(areAdjacent(0, 6)).toBe(true); // down
    expect(areAdjacent(6, 0)).toBe(true); // up
  });

  it('should identify diagonally adjacent cells', () => {
    expect(areAdjacent(0, 7)).toBe(true); // down-right
    expect(areAdjacent(1, 6)).toBe(true); // down-left
    expect(areAdjacent(7, 0)).toBe(true); // up-left
  });

  it('should not identify non-adjacent cells', () => {
    expect(areAdjacent(0, 2)).toBe(false); // too far right
    expect(areAdjacent(0, 16)).toBe(false); // too far down
    expect(areAdjacent(0, 10)).toBe(false); // too far diagonal
  });

  it('should not identify cell as adjacent to itself', () => {
    expect(areAdjacent(0, 0)).toBe(false);
    expect(areAdjacent(15, 15)).toBe(false);
  });
});

describe('Strands Logic - Path Validation', () => {
  it('should validate a simple horizontal path', () => {
    const path = [0, 1, 2, 3]; // horizontal
    expect(isValidPath(path)).toBe(true);
  });

  it('should validate a simple vertical path', () => {
    const path = [0, 6, 12, 18]; // vertical
    expect(isValidPath(path)).toBe(true);
  });

  it('should validate a diagonal path', () => {
    const path = [0, 7, 14, 21]; // diagonal
    expect(isValidPath(path)).toBe(true);
  });

  it('should validate a zigzag path', () => {
    const path = [0, 1, 8, 9, 15]; // right, down-right, right, down
    expect(isValidPath(path)).toBe(true);
  });

  it('should invalidate a path with non-adjacent cells', () => {
    const path = [0, 2, 4]; // skipping cells
    expect(isValidPath(path)).toBe(false);
  });

  it('should validate empty or single-cell paths', () => {
    expect(isValidPath([])).toBe(true);
    expect(isValidPath([0])).toBe(true);
  });
});

describe('Strands Logic - Word Formation', () => {
  const grid = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUV';

  it('should get word from horizontal path', () => {
    const path = [0, 1, 2, 3]; // A, B, C, D
    expect(getWordFromPath(grid, path)).toBe('ABCD');
  });

  it('should get word from vertical path', () => {
    const path = [0, 8, 16]; // A, I, Q
    expect(getWordFromPath(grid, path)).toBe('AIQ');
  });

  it('should get word from complex path', () => {
    const path = [0, 1, 9, 10]; // A, B, J, K
    expect(getWordFromPath(grid, path)).toBe('ABJK');
  });

  it('should handle single letter', () => {
    const path = [5]; // F
    expect(getWordFromPath(grid, path)).toBe('F');
  });
});

describe('Strands Logic - Spangram Detection', () => {
  it('should detect top-to-bottom span', () => {
    const path = [0, 6, 12, 18, 24, 30, 36, 42]; // top to bottom
    expect(spansOppositeEdges(path)).toBe(true);
  });

  it('should detect left-to-right span', () => {
    const path = [0, 1, 2, 3, 4, 5, 6, 7]; // left to right
    expect(spansOppositeEdges(path)).toBe(true);
  });

  it('should detect complex spanning path', () => {
    const path = [0, 1, 9, 17, 25, 33, 41, 42, 43, 44, 45, 46, 47]; // touches top-left and bottom-right
    expect(spansOppositeEdges(path)).toBe(true);
  });

  it('should not detect non-spanning paths', () => {
    const path = [13, 14, 19, 20]; // middle of grid
    expect(spansOppositeEdges(path)).toBe(false);
  });

  it('should not span if only touches one edge', () => {
    const path = [0, 1, 2]; // only top edge
    expect(spansOppositeEdges(path)).toBe(false);
  });

  it('should not span if touches adjacent edges', () => {
    const path = [0, 8, 16]; // top and left edges
    expect(spansOppositeEdges(path)).toBe(false);
  });
});

describe('Strands Logic - Theme Word Matching', () => {
  const themeWords = [
    {word: 'SAND', isSpangram: false},
    {word: 'WAVE', isSpangram: false},
    {word: 'SEASHORE', isSpangram: true},
  ];

  it('should match exact theme word', () => {
    const result = matchesThemeWord('SAND', themeWords);
    expect(result.match).toBe(true);
    expect(result.isSpangram).toBe(false);
    expect(result.themeWord).toBe('SAND');
  });

  it('should match spangram', () => {
    const result = matchesThemeWord('SEASHORE', themeWords);
    expect(result.match).toBe(true);
    expect(result.isSpangram).toBe(true);
    expect(result.themeWord).toBe('SEASHORE');
  });

  it('should match case-insensitively', () => {
    const result = matchesThemeWord('sand', themeWords);
    expect(result.match).toBe(true);
    expect(result.themeWord).toBe('SAND');
  });

  it('should not match non-theme words', () => {
    const result = matchesThemeWord('BEACH', themeWords);
    expect(result.match).toBe(false);
    expect(result.isSpangram).toBe(false);
  });

  it('should not match partial words', () => {
    const result = matchesThemeWord('SAN', themeWords);
    expect(result.match).toBe(false);
  });
});

describe('Strands Logic - Hint Word Validation', () => {
  const themeWords = [{word: 'SAND'}, {word: 'WAVE'}];

  it('should accept valid hint words (4+ letters)', () => {
    expect(isValidHintWord('ABLE', themeWords)).toBe(true);
    expect(isValidHintWord('HELLO', themeWords)).toBe(true);
    expect(isValidHintWord('WORLD', themeWords)).toBe(true);
  });

  it('should reject short words (< 4 letters)', () => {
    expect(isValidHintWord('THE', themeWords)).toBe(false);
    expect(isValidHintWord('AN', themeWords)).toBe(false);
    expect(isValidHintWord('A', themeWords)).toBe(false);
  });

  it('should reject theme words', () => {
    expect(isValidHintWord('SAND', themeWords)).toBe(false);
    expect(isValidHintWord('WAVE', themeWords)).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isValidHintWord('able', themeWords)).toBe(true);
    expect(isValidHintWord('sand', themeWords)).toBe(false);
  });

  it('should respect custom min length', () => {
    expect(isValidHintWord('HELLO', themeWords, 5)).toBe(true);
    expect(isValidHintWord('WORD', themeWords, 5)).toBe(false);
  });
});

describe('Strands Logic - Scoring', () => {
  const scoring = {pointsPerWord: 10, spangramBonus: 50};

  it('should calculate normal word score', () => {
    expect(calculateWordScore('SAND', false, scoring)).toBe(10);
  });

  it('should calculate spangram score with bonus', () => {
    expect(calculateWordScore('SEASHORE', true, scoring)).toBe(60); // 10 + 50
  });

  it('should handle different scoring configs', () => {
    const customScoring = {pointsPerWord: 5, spangramBonus: 25};
    expect(calculateWordScore('WORD', false, customScoring)).toBe(5);
    expect(calculateWordScore('WORD', true, customScoring)).toBe(30);
  });
});

describe('Strands Logic - Game Completion', () => {
  const themeWords = [{word: 'SAND'}, {word: 'WAVE'}, {word: 'SEASHORE'}];

  it('should detect incomplete game', () => {
    const foundWords = ['SAND'];
    expect(isGameComplete(foundWords, themeWords)).toBe(false);
  });

  it('should detect complete game', () => {
    const foundWords = ['SAND', 'WAVE', 'SEASHORE'];
    expect(isGameComplete(foundWords, themeWords)).toBe(true);
  });

  it('should be case-insensitive', () => {
    const foundWords = ['sand', 'wave', 'seashore'];
    expect(isGameComplete(foundWords, themeWords)).toBe(true);
  });

  it('should handle words in different order', () => {
    const foundWords = ['SEASHORE', 'SAND', 'WAVE'];
    expect(isGameComplete(foundWords, themeWords)).toBe(true);
  });

  it('should detect empty state', () => {
    expect(isGameComplete([], themeWords)).toBe(false);
  });
});

describe('Strands Logic - Time Formatting', () => {
  it('should format seconds correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(59)).toBe('0:59');
  });

  it('should format minutes correctly', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(120)).toBe('2:00');
  });

  it('should pad seconds with zero', () => {
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(125)).toBe('2:05');
  });

  it('should handle large times', () => {
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(3661)).toBe('61:01');
  });
});

describe('Strands Logic - Neighbor Calculation', () => {
  it('should get all 8 neighbors for center cell', () => {
    const neighbors = getNeighbors(8); // row 1, col 2
    expect(neighbors).toHaveLength(8);
    expect(neighbors).toContain(1); // up-left
    expect(neighbors).toContain(2); // up
    expect(neighbors).toContain(3); // up-right
    expect(neighbors).toContain(7); // left
    expect(neighbors).toContain(9); // right
    expect(neighbors).toContain(13); // down-left
    expect(neighbors).toContain(14); // down
    expect(neighbors).toContain(15); // down-right
  });

  it('should get 3 neighbors for top-left corner', () => {
    const neighbors = getNeighbors(0);
    expect(neighbors).toHaveLength(3);
    expect(neighbors).toContain(1); // right
    expect(neighbors).toContain(6); // down
    expect(neighbors).toContain(7); // down-right
  });

  it('should get 3 neighbors for bottom-right corner', () => {
    const neighbors = getNeighbors(47);
    expect(neighbors).toHaveLength(3);
    expect(neighbors).toContain(46); // left
    expect(neighbors).toContain(41); // up
    expect(neighbors).toContain(40); // up-left
  });

  it('should get 5 neighbors for edge cell (not corner)', () => {
    const neighbors = getNeighbors(4); // top edge, middle
    expect(neighbors).toHaveLength(5);
  });
});
