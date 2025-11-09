/**
 * Game logic utilities for Strands word puzzle
 */

const GRID_ROWS = 6;
const GRID_COLS = 8;

export type Position = {row: number; col: number};
export type CellIndex = number;

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
 * Get the word formed by a path through the grid
 */
export function getWordFromPath(grid: string, path: number[]): string {
  return path.map((index) => grid[index]).join('');
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
 * Check if a word matches a theme word
 */
export function matchesThemeWord(
  word: string,
  themeWords: Array<{word: string; isSpangram: boolean}>,
): {match: boolean; isSpangram: boolean; themeWord?: string} {
  const upperWord = word.toUpperCase();

  for (const themeWord of themeWords) {
    if (themeWord.word.toUpperCase() === upperWord) {
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
