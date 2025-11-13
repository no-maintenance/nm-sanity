/**
 * Game logic utilities for Strands word puzzle
 */

import type {CanonicalGrid, SanityCanonicalGrid} from './canonical-grid.types';

const GRID_ROWS = 8;
const GRID_COLS = 6;

export type Position = {row: number; col: number};
export type CellIndex = number;

// GridData now only supports string (for empty fallback) or canonical formats
export type GridData = string | CanonicalGrid | SanityCanonicalGrid;

/**
 * Convert 1D grid index to 2D position
 */
export function indexToPosition(index: number): Position {
  return {
    row: Math.floor(index / GRID_COLS),
    col: index % GRID_COLS,
  };
}

/**
 * Convert 2D position to 1D grid index
 */
export function positionToIndex(pos: Position): number {
  return pos.row * GRID_COLS + pos.col;
}

/**
 * Check if two cells are adjacent (including diagonals)
 */
export function areAdjacent(index1: number, index2: number): boolean {
  const pos1 = indexToPosition(index1);
  const pos2 = indexToPosition(index2);

  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);

  // Adjacent if both differences are <= 1 and not the same cell
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Validate a selection path (all cells must be adjacent)
 */
export function isValidPath(path: number[]): boolean {
  if (path.length < 2) return true;

  for (let i = 1; i < path.length; i++) {
    if (!areAdjacent(path[i - 1], path[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize a string by removing all invisible Unicode characters
 * and keeping only A-Z letters
 */
function sanitizeGridString(str: string): string {
  // Remove zero-width spaces and other invisible Unicode characters
  // Then keep only A-Z letters (uppercase)
  return str
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u2000-\u200F\u202A-\u202E\u205F-\u206F]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

/**
 * Convert grid format to string
 */
export function gridToString(grid: GridData): string {
  if (typeof grid === 'string') {
    return sanitizeGridString(grid);
  }

  // Handle CanonicalGrid or SanityCanonicalGrid formats
  if (grid && typeof grid === 'object' && 'cells' in grid && Array.isArray(grid.cells)) {
    return grid.cells.join('');
  }

  // Fallback for unexpected format
  console.error('Invalid grid format:', grid);
  return '';
}

/**
 * Get the word formed by a path through the grid
 */
export function getWordFromPath(grid: GridData, path: number[]): string {
  const gridString = gridToString(grid);
  return path.map((index) => gridString[index]).filter(Boolean).join('');
}

/**
 * Check if a path spans opposite edges (for spangram validation)
 */
export function spansOppositeEdges(path: number[]): boolean {
  let touchesTop = false;
  let touchesBottom = false;
  let touchesLeft = false;
  let touchesRight = false;

  for (const index of path) {
    const {row, col} = indexToPosition(index);
    if (row === 0) touchesTop = true;
    if (row === GRID_ROWS - 1) touchesBottom = true;
    if (col === 0) touchesLeft = true;
    if (col === GRID_COLS - 1) touchesRight = true;
  }

  return (touchesTop && touchesBottom) || (touchesLeft && touchesRight);
}

/**
 * Normalize a word by removing invisible Unicode characters and trimming
 */
function normalizeWord(word: string): string {
  return word
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u2000-\u200F\u202A-\u202E\u205F-\u206F]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Check if a word matches a theme word
 */
export function matchesThemeWord(
  word: string,
  themeWords: Array<{word: string; isSpangram: boolean}>,
): {match: boolean; isSpangram: boolean; themeWord?: string} {
  const normalizedWord = normalizeWord(word);

  for (const themeWord of themeWords) {
    const normalizedThemeWord = normalizeWord(themeWord.word);
    if (normalizedThemeWord === normalizedWord) {
      return {
        match: true,
        isSpangram: themeWord.isSpangram,
        themeWord: themeWord.word,
      };
    }
  }

  return {match: false, isSpangram: false};
}

/**
 * Check if a word is a valid hint word (4+ letters, not a theme word)
 */
export function isValidHintWord(
  word: string,
  themeWords: Array<{word: string}>,
  minLength: number = 4,
): boolean {
  if (word.length < minLength) return false;

  const upperWord = word.toUpperCase();
  const isThemeWord = themeWords.some((tw) => tw.word.toUpperCase() === upperWord);

  return !isThemeWord;
}

/**
 * Word validation result types
 */
export type WordValidationType =
  | 'theme-word'           // It's a theme word - should be handled separately
  | 'wrong-path'           // Correct theme word but wrong path selected
  | 'already-discovered'   // Already in the discovered hint word bank
  | 'not-english'          // Not a valid English word
  | 'too-short'            // Less than 4 letters - no hint credit
  | 'valid-hint-word'      // Valid English word, 4+ letters, earns hint credit
  | 'validation-error';    // API or network error during validation

export type WordValidationResult = {
  type: WordValidationType;
  word: string;
  message: string;
  grantsHintProgress: boolean;
  isThemeWord: boolean;
  isSpangram: boolean;
};

/**
 * Comprehensive word validation for Strands game
 * Handles theme words, hint words, and English dictionary validation
 *
 * @param word - The word to validate
 * @param path - The path of cells forming the word
 * @param themeWords - Array of theme words
 * @param discoveredHintWords - Set of already discovered hint words
 * @param validateWithDatamuse - Function to validate with Datamuse API
 * @param canonicalPaths - Optional map of theme words to their canonical paths
 * @param puzzleHintWords - Optional array of pre-validated hint words for this puzzle
 * @returns Validation result with type, message, and hint progress info
 */
export async function validateWord(
  word: string,
  path: number[],
  themeWords: Array<{word: string; isSpangram: boolean}>,
  discoveredHintWords: Set<string>,
  validateWithDatamuse: (word: string) => Promise<{isValid: boolean; error?: string}>,
  canonicalPaths?: Record<string, number[]>,
  puzzleHintWords?: string[],
): Promise<WordValidationResult> {
  const upperWord = normalizeWord(word);

  // Step 1: Check if it's a theme word
  const themeMatch = matchesThemeWord(upperWord, themeWords);
  if (themeMatch.match) {
    // Check if we have canonical paths and if this path matches
    if (canonicalPaths) {
      const canonicalPath = canonicalPaths[upperWord];
      console.log('[validateWord] Checking canonical path for', upperWord);
      console.log('[validateWord] Submitted path:', path);
      console.log('[validateWord] Canonical path:', canonicalPath);
      if (canonicalPath && canonicalPath.length > 0) {
        // Check if the selected path matches the canonical path (forward or reversed)
        // The grid generator randomly reverses words, so the canonical path might spell the word backwards
        const pathMatchesForward =
          path.length === canonicalPath.length &&
          path.every((index, i) => index === canonicalPath[i]);

        const pathMatchesReversed =
          path.length === canonicalPath.length &&
          path.every((index, i) => index === canonicalPath[canonicalPath.length - 1 - i]);

        const pathMatches = pathMatchesForward || pathMatchesReversed;

        console.log('[validateWord] Path matches (forward):', pathMatchesForward);
        console.log('[validateWord] Path matches (reversed):', pathMatchesReversed);
        console.log('[validateWord] Path matches (either):', pathMatches);

        if (!pathMatches) {
          console.log('[validateWord] Path mismatch details:');
          path.forEach((index, i) => {
            const canonicalForward = canonicalPath[i];
            const canonicalReversed = canonicalPath[canonicalPath.length - 1 - i];
            console.log(`  Position ${i}: submitted=${index}, canonical_fwd=${canonicalForward}, canonical_rev=${canonicalReversed}`);
          });
        }

        if (!pathMatches) {
          return {
            type: 'wrong-path',
            word: upperWord,
            message: `"${upperWord}" is correct, but you used the wrong path! Try a different route.`,
            grantsHintProgress: false,
            isThemeWord: false,  // Don't mark as found since path is wrong
            isSpangram: false,
          };
        }
      }
    }

    return {
      type: 'theme-word',
      word: upperWord,
      message: themeMatch.isSpangram
        ? 'Spangram found!'
        : 'Theme word found!',
      grantsHintProgress: false,
      isThemeWord: true,
      isSpangram: themeMatch.isSpangram,
    };
  }

  // Step 2: Check if already discovered as hint word (normalize for comparison)
  const normalizedDiscoveredWords = new Set(
    Array.from(discoveredHintWords).map(w => normalizeWord(w))
  );
  if (normalizedDiscoveredWords.has(upperWord)) {
    return {
      type: 'already-discovered',
      word: upperWord,
      message: `You already found "${upperWord}"`,
      grantsHintProgress: false,
      isThemeWord: false,
      isSpangram: false,
    };
  }

  // Step 3: Check puzzle-specific hint words (fast, no API call)
  let isValid = false;
  if (puzzleHintWords && puzzleHintWords.length > 0) {
    const normalizedPuzzleWords = puzzleHintWords.map(w => normalizeWord(w));
    if (normalizedPuzzleWords.includes(upperWord)) {
      isValid = true;
      console.log(`[Validation] Word "${upperWord}" found in puzzle hint words (no API call)`);
    }
  }

  // Step 4: Validate with Datamuse API if not found in puzzle hint words
  if (!isValid) {
    try {
      const validation = await validateWithDatamuse(upperWord);

      if (!validation.isValid) {
        return {
          type: 'not-english',
          word: upperWord,
          message: validation.error || 'Not a valid English word',
          grantsHintProgress: false,
          isThemeWord: false,
          isSpangram: false,
        };
      }
      isValid = true;
    } catch (error) {
      console.error('Word validation error:', error);
      return {
        type: 'validation-error',
        word: upperWord,
        message: 'Unable to validate word - please try again',
        grantsHintProgress: false,
        isThemeWord: false,
        isSpangram: false,
      };
    }
  }

  // Step 5: Check length requirement (4+ letters)
    if (upperWord.length < 4) {
      return {
        type: 'too-short',
        word: upperWord,
        message: `"${upperWord}" is too short (need 4+ letters for hint credit)`,
        grantsHintProgress: false,
        isThemeWord: false,
        isSpangram: false,
      };
    }

  // Step 6: Valid hint word!
  return {
    type: 'valid-hint-word',
    word: upperWord,
    message: `Found "${upperWord}"! Progress toward next hint`,
    grantsHintProgress: true,
    isThemeWord: false,
    isSpangram: false,
  };
}

/**
 * Calculate score for a found word
 */
export function calculateWordScore(
  word: string,
  isSpangram: boolean,
  scoring: {pointsPerWord: number; spangramBonus: number},
): number {
  if (isSpangram) {
    return scoring.pointsPerWord + scoring.spangramBonus;
  }
  return scoring.pointsPerWord;
}

/**
 * Get all cells that use the given indices (for highlighting)
 */
export function getUsedCells(foundWords: Array<{path: number[]}>): Set<number> {
  const used = new Set<number>();
  for (const word of foundWords) {
    for (const index of word.path) {
      used.add(index);
    }
  }
  return used;
}

/**
 * Check if game is complete (all theme words found)
 */
export function isGameComplete(
  foundWords: string[],
  themeWords: Array<{word: string}>,
): boolean {
  const foundSet = new Set(foundWords.map((w) => w.toUpperCase()));
  return themeWords.every((tw) => foundSet.has(tw.word.toUpperCase()));
}

/**
 * Format time in MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get neighbor indices for a cell
 */
export function getNeighbors(index: number): number[] {
  const {row, col} = indexToPosition(index);
  const neighbors: number[] = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < GRID_ROWS && newCol >= 0 && newCol < GRID_COLS) {
        neighbors.push(positionToIndex({row: newRow, col: newCol}));
      }
    }
  }

  return neighbors;
}

/**
 * Find a valid path for a word in the grid using DFS
 * Returns the first valid path found, or null if word cannot be formed
 */
export function findWordPath(grid: GridData, word: string): number[] | null {
  const gridString = gridToString(grid);
  const upperWord = word.toUpperCase();

  if (upperWord.length === 0) return null;

  // DFS helper function
  function searchPath(
    currentPath: number[],
    remainingWord: string,
    visited: Set<number>
  ): number[] | null {
    // Base case: found the complete word
    if (remainingWord.length === 0) {
      return currentPath;
    }

    const currentIndex = currentPath[currentPath.length - 1];
    const nextLetter = remainingWord[0];
    const neighbors = getNeighbors(currentIndex);

    // Try each adjacent cell
    for (const neighborIndex of neighbors) {
      if (visited.has(neighborIndex)) continue;
      if (gridString[neighborIndex] !== nextLetter) continue;

      // Explore this path
      const newPath = [...currentPath, neighborIndex];
      const newVisited = new Set(visited);
      newVisited.add(neighborIndex);

      const result = searchPath(newPath, remainingWord.slice(1), newVisited);
      if (result) return result;
    }

    return null;
  }

  // Try starting from each cell that matches the first letter
  for (let startIndex = 0; startIndex < gridString.length; startIndex++) {
    if (gridString[startIndex] !== upperWord[0]) continue;

    const visited = new Set<number>([startIndex]);
    const result = searchPath([startIndex], upperWord.slice(1), visited);
    if (result) return result;
  }

  return null;
}

/**
 * Theme word colors (excluding spangram)
 */
export const THEME_COLORS = [
  'bg-blue-200',
  'bg-green-200',
  'bg-yellow-200',
  'bg-pink-200',
  'bg-purple-200',
  'bg-orange-200',
  'bg-cyan-200',
  'bg-rose-200',
] as const;

/**
 * Spangram color
 */
export const SPANGRAM_COLOR = 'bg-amber-300';

/**
 * Hint word color
 */
export const HINT_COLOR = 'bg-gray-100';

/**
 * Get color for a theme word based on its index (excluding spangram)
 */
export function getThemeWordColor(
  themeWordIndex: number,
  isSpangram: boolean,
): string {
  if (isSpangram) {
    return SPANGRAM_COLOR;
  }
  return THEME_COLORS[themeWordIndex % THEME_COLORS.length];
}

/**
 * Assign colors to cells for a found word
 */
export function assignCellColors(
  path: number[],
  color: string,
  existingColors: {[key: number]: string[]},
): {[key: number]: string[]} {
  const newCellColors = {...existingColors};
  path.forEach(index => {
    if (!newCellColors[index]) {
      newCellColors[index] = [];
    }
    newCellColors[index].push(color);
  });
  return newCellColors;
}

/**
 * Calculate hint progress after finding a valid hint word
 */
export function calculateHintProgress(
  currentProgress: number,
  increment: number = 1,
): {newProgress: number; grantsNewHint: boolean} {
  const newProgress = currentProgress + increment;
  const grantsNewHint = newProgress >= 3;
  
  return {
    newProgress: grantsNewHint ? 0 : newProgress,
    grantsNewHint,
  };
}

/**
 * Result of word submission processing
 */
export interface WordSubmissionResult {
  success: boolean;
  type: 'theme-word' | 'hint-word' | 'invalid' | 'already-found' | 'wrong-path';
  isSpangram?: boolean;
  color?: string;
  grantsHintProgress: boolean;
  grantsNewHint: boolean;
  newHintProgress: number;
  cellColors: {[key: number]: string[]};
}

/**
 * Process word submission result and return updated game state
 */
export function processWordSubmission(
  validation: WordValidationResult,
  path: number[],
  existingCellColors: {[key: number]: string[]},
  themeWords: Array<{word: string; isSpangram: boolean}>,
  currentHintProgress: number,
): WordSubmissionResult {
  // Handle theme word
  if (validation.type === 'theme-word') {
    const normalizedValidationWord = normalizeWord(validation.word);

    // Get the original index in the full theme words array (including spangram)
    // Then calculate color index by counting only non-spangram words before it
    const fullIndex = themeWords.findIndex(tw => normalizeWord(tw.word) === normalizedValidationWord);

    // Count how many non-spangram words come before this one
    const colorIndex = themeWords
      .slice(0, fullIndex)
      .filter(tw => !tw.isSpangram)
      .length;

    const color = getThemeWordColor(colorIndex, validation.isSpangram);
    const cellColors = assignCellColors(path, color, existingCellColors);

    return {
      success: true,
      type: 'theme-word',
      isSpangram: validation.isSpangram,
      color,
      grantsHintProgress: false,
      grantsNewHint: false,
      newHintProgress: currentHintProgress,
      cellColors,
    };
  }

  // Handle valid hint word
  // Hint words don't get visual indicators when discovered
  if (validation.type === 'valid-hint-word' && validation.grantsHintProgress) {
    const hintProgress = calculateHintProgress(currentHintProgress);

    return {
      success: true,
      type: 'hint-word',
      grantsHintProgress: true,
      grantsNewHint: hintProgress.grantsNewHint,
      newHintProgress: hintProgress.newProgress,
      cellColors: existingCellColors, // Don't modify cell colors for hint words
    };
  }

  // Handle wrong path
  if (validation.type === 'wrong-path') {
    return {
      success: false,
      type: 'wrong-path',
      grantsHintProgress: false,
      grantsNewHint: false,
      newHintProgress: currentHintProgress,
      cellColors: existingCellColors,
    };
  }

  // Invalid or already found
  return {
    success: false,
    type: validation.type === 'already-discovered' ? 'already-found' : 'invalid',
    grantsHintProgress: false,
    grantsNewHint: false,
    newHintProgress: currentHintProgress,
    cellColors: existingCellColors,
  };
}
