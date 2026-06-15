import {describe, it, expect} from 'vitest';
import {
  getWordFromPath,
  matchesThemeWord,
  isValidHintWord,
  calculateWordScore,
  isGameComplete,
  spansOppositeEdges,
} from '../strands-logic';

describe('Game Scenarios - Complete Gameplay Flows', () => {
  // Sample beach-themed puzzle (48 chars: 6 rows × 8 cols)
  // Grid layout with SAND vertically in first column (positions 0, 8, 16, 24)
  const beachPuzzle = {
    grid: 'SARWAVEFANTOCOLENINGHARDDESTHHDDREESEENRUEFGHIJK',
    themeWords: [
      {word: 'SAND', isSpangram: false},
      {word: 'WAVE', isSpangram: false},
      {word: 'SHELL', isSpangram: false},
      {word: 'TIDE', isSpangram: false},
      {word: 'CORAL', isSpangram: false},
      {word: 'SEASHORE', isSpangram: true},
    ],
    scoring: {pointsPerWord: 10, spangramBonus: 50},
  };

  describe('Finding Theme Words', () => {
    it('should find SAND in the grid', () => {
      // SAND vertically in first column: positions [0, 8, 16, 24]
      const path = [0, 8, 16, 24]; // S, A, N, D
      const word = getWordFromPath(beachPuzzle.grid, path);

      expect(word).toBe('SAND');

      const match = matchesThemeWord(word, beachPuzzle.themeWords);
      expect(match.match).toBe(true);
      expect(match.isSpangram).toBe(false);
    });

    it('should calculate correct score for theme word', () => {
      const word = 'SAND';
      const score = calculateWordScore(word, false, beachPuzzle.scoring);
      expect(score).toBe(10);
    });

    it('should calculate correct score for spangram', () => {
      const word = 'SEASHORE';
      const score = calculateWordScore(word, true, beachPuzzle.scoring);
      expect(score).toBe(60); // 10 + 50 bonus
    });
  });

  describe('Hint Word System', () => {
    it('should accept valid 4-letter hint words', () => {
      const hintWord = 'STAR';
      const isValid = isValidHintWord(hintWord, beachPuzzle.themeWords);
      expect(isValid).toBe(true);
    });

    it('should reject theme words as hints', () => {
      const themeWord = 'SAND';
      const isValid = isValidHintWord(themeWord, beachPuzzle.themeWords);
      expect(isValid).toBe(false);
    });

    it('should reject words under 4 letters', () => {
      const shortWord = 'THE';
      const isValid = isValidHintWord(shortWord, beachPuzzle.themeWords);
      expect(isValid).toBe(false);
    });

    it('should simulate 3-word hint accumulation', () => {
      const hintWords = ['STAR', 'WORD', 'ABLE'];
      let hintCount = 0;
      let availableHints = 0;

      hintWords.forEach((word) => {
        if (isValidHintWord(word, beachPuzzle.themeWords)) {
          hintCount++;
          if (hintCount >= 3) {
            availableHints++;
            hintCount = 0; // Reset counter
          }
        }
      });

      expect(availableHints).toBe(1);
    });
  });

  describe('Game Progression', () => {
    it('should track game progress correctly', () => {
      const foundWords = ['SAND'];
      const totalWords = beachPuzzle.themeWords.length;
      const progress = (foundWords.length / totalWords) * 100;

      expect(progress).toBeCloseTo(16.67, 1); // 1 of 6 words
    });

    it('should detect incomplete game', () => {
      const foundWords = ['SAND', 'WAVE', 'SHELL'];
      const isComplete = isGameComplete(foundWords, beachPuzzle.themeWords);
      expect(isComplete).toBe(false);
    });

    it('should detect complete game', () => {
      const foundWords = ['SAND', 'WAVE', 'SHELL', 'TIDE', 'CORAL', 'SEASHORE'];
      const isComplete = isGameComplete(foundWords, beachPuzzle.themeWords);
      expect(isComplete).toBe(true);
    });

    it('should calculate total score for complete game', () => {
      const foundWords = [
        {word: 'SAND', isSpangram: false},
        {word: 'WAVE', isSpangram: false},
        {word: 'SHELL', isSpangram: false},
        {word: 'TIDE', isSpangram: false},
        {word: 'CORAL', isSpangram: false},
        {word: 'SEASHORE', isSpangram: true},
      ];

      const totalScore = foundWords.reduce((sum, fw) => {
        return sum + calculateWordScore(fw.word, fw.isSpangram, beachPuzzle.scoring);
      }, 0);

      expect(totalScore).toBe(110); // 5 * 10 + 60
    });
  });

  describe('Spangram Validation Scenarios', () => {
    it('should validate spangram spans top to bottom', () => {
      // Path that touches top (row 0) and bottom (row 7)
      const path = [0, 6, 12, 18, 24, 30, 36, 42];
      expect(spansOppositeEdges(path)).toBe(true);
    });

    it('should validate spangram spans left to right', () => {
      // Path that touches left (col 0) and right (col 7)
      const path = [0, 1, 2, 3, 4, 5, 6, 7];
      expect(spansOppositeEdges(path)).toBe(true);
    });

    it('should reject spangram that doesn\'t span', () => {
      // Path in middle of grid
      const path = [18, 19, 20, 27, 28];
      expect(spansOppositeEdges(path)).toBe(false);
    });

    it('should detect zigzag spangram', () => {
      // Complex path from top-left to bottom-right
      const path = [0, 1, 9, 17, 25, 33, 41, 47];
      expect(spansOppositeEdges(path)).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid word submission', () => {
      const invalidWord = 'NOTINPUZZLE';
      const match = matchesThemeWord(invalidWord, beachPuzzle.themeWords);
      expect(match.match).toBe(false);
    });

    it('should handle duplicate word submission', () => {
      const foundWords = ['SAND', 'WAVE'];
      const attemptedWord = 'SAND';

      const alreadyFound = foundWords.some(
        (w) => w.toUpperCase() === attemptedWord.toUpperCase()
      );

      expect(alreadyFound).toBe(true);
    });

    it('should handle word too short error', () => {
      const shortWord = 'AN';
      const isValidHint = isValidHintWord(shortWord, beachPuzzle.themeWords);
      expect(isValidHint).toBe(false);
    });
  });

  describe('Perfect Game Scenario', () => {
    it('should simulate a perfect game (no hints used)', () => {
      const gameState = {
        foundWords: [] as string[],
        score: 0,
        hintsUsed: 0,
        hintWordCount: 0,
      };

      // Find all theme words in order
      const wordsToFind = ['SAND', 'WAVE', 'SHELL', 'TIDE', 'CORAL', 'SEASHORE'];

      wordsToFind.forEach((word) => {
        const match = matchesThemeWord(word, beachPuzzle.themeWords);
        if (match.match) {
          gameState.foundWords.push(word);
          gameState.score += calculateWordScore(
            word,
            match.isSpangram,
            beachPuzzle.scoring
          );
        }
      });

      expect(gameState.foundWords.length).toBe(6);
      expect(gameState.score).toBe(110);
      expect(gameState.hintsUsed).toBe(0);

      const isPerfect = isGameComplete(
        gameState.foundWords,
        beachPuzzle.themeWords
      ) && gameState.hintsUsed === 0;

      expect(isPerfect).toBe(true);
    });
  });

  describe('Game with Hints Scenario', () => {
    it('should simulate game with hint usage', () => {
      const gameState = {
        foundWords: [] as string[],
        hintWordCount: 0,
        availableHints: 0,
        hintsUsed: 0,
      };

      // Find hint words
      const hintWords = ['STAR', 'WORD', 'ABLE', 'NEAR', 'HEAR', 'DEAR'];

      hintWords.forEach((word) => {
        if (isValidHintWord(word, beachPuzzle.themeWords)) {
          gameState.hintWordCount++;

          // Every 3 hint words = 1 hint
          if (gameState.hintWordCount % 3 === 0) {
            gameState.availableHints++;
          }
        }
      });

      expect(gameState.availableHints).toBe(2); // 6 words / 3 = 2 hints

      // Use a hint
      if (gameState.availableHints > 0) {
        gameState.availableHints--;
        gameState.hintsUsed++;
        gameState.hintWordCount = Math.max(0, gameState.hintWordCount - 3);
      }

      expect(gameState.hintsUsed).toBe(1);
      expect(gameState.availableHints).toBe(1);
    });
  });

  describe('Time Challenge Scenario', () => {
    it('should track elapsed time', () => {
      let timeElapsed = 0;
      const timeLimit = 300; // 5 minutes

      // Simulate 2 minutes of gameplay
      timeElapsed = 120;

      expect(timeElapsed).toBeLessThan(timeLimit);

      const timeRemaining = timeLimit - timeElapsed;
      expect(timeRemaining).toBe(180);
    });

    it('should detect time limit exceeded', () => {
      const timeElapsed = 350;
      const timeLimit = 300;

      const hasTimedOut = timeLimit > 0 && timeElapsed >= timeLimit;
      expect(hasTimedOut).toBe(true);
    });
  });

  describe('Multi-Player Consistency', () => {
    it('should ensure all players see same grid', () => {
      // In real implementation, grid comes from Sanity CMS
      const player1Grid = beachPuzzle.grid;
      const player2Grid = beachPuzzle.grid;

      expect(player1Grid).toBe(player2Grid);
      expect(player1Grid.length).toBe(48);
    });

    it('should ensure deterministic word positions', () => {
      // Same path should always give same word
      const path = [0, 1, 2, 3];
      const word1 = getWordFromPath(beachPuzzle.grid, path);
      const word2 = getWordFromPath(beachPuzzle.grid, path);

      expect(word1).toBe(word2);
    });
  });
});
