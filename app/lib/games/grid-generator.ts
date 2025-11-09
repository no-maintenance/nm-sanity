import {HINT_WORD_LIBRARY, HIGH_FREQ_LETTERS, COMMON_DIGRAPHS} from './word-lists';

const GRID_ROWS = 6;
const GRID_COLS = 8;
const GRID_SIZE = GRID_ROWS * GRID_COLS; // 48

type GridCell = string;
type Grid = GridCell[];
type Position = {row: number; col: number};

interface ThemeWord {
  word: string;
  isSpangram: boolean;
}

interface GenerationResult {
  success: boolean;
  grid: string;
  hintWordCount: number;
  placedHintWords: string[];
  foundHintWords: string[];
  warning?: string;
}

/**
 * Convert 1D index to 2D position
 */
function indexToPosition(index: number): Position {
  return {
    row: Math.floor(index / GRID_COLS),
    col: index % GRID_COLS,
  };
}

/**
 * Convert 2D position to 1D index
 */
function positionToIndex(pos: Position): number {
  return pos.row * GRID_COLS + pos.col;
}

/**
 * Get all valid neighbor indices for a given cell
 */
function getNeighbors(index: number): number[] {
  const {row, col} = indexToPosition(index);
  const neighbors: number[] = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue; // Skip self
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
 * Check if a word can be placed starting from a given position
 */
function canPlaceWord(
  grid: Grid,
  word: string,
  startIndex: number,
  used: boolean[],
): {canPlace: boolean; path: number[]} {
  const visited = new Set<number>();
  const path: number[] = [];

  function dfs(index: number, charIndex: number): boolean {
    if (charIndex === word.length) {
      return true; // Successfully placed all characters
    }

    visited.add(index);
    path.push(index);

    const neighbors = getNeighbors(index);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor) && !used[neighbor]) {
        // Try placing next character here
        const success = dfs(neighbor, charIndex + 1);
        if (success) return true;
      }
    }

    // Backtrack
    visited.delete(index);
    path.pop();
    return false;
  }

  if (used[startIndex]) {
    return {canPlace: false, path: []};
  }

  const result = dfs(startIndex, 1); // Start from second character
  return {canPlace: result, path};
}

/**
 * Place a word in the grid
 */
function placeWord(grid: Grid, word: string, path: number[], used: boolean[]): void {
  for (let i = 0; i < word.length; i++) {
    const index = path[i];
    grid[index] = word[i];
    used[index] = true;
  }
}

/**
 * Try to place the spangram (must touch opposite edges)
 */
function placeSpangram(
  grid: Grid,
  word: string,
  used: boolean[],
): {success: boolean; path: number[]} {
  // Try all edge cells
  const topEdge = Array.from({length: GRID_COLS}, (_, i) => i);
  const bottomEdge = Array.from({length: GRID_COLS}, (_, i) => (GRID_ROWS - 1) * GRID_COLS + i);
  const leftEdge = Array.from({length: GRID_ROWS}, (_, i) => i * GRID_COLS);
  const rightEdge = Array.from({length: GRID_ROWS}, (_, i) => i * GRID_COLS + (GRID_COLS - 1));

  const edgePairs = [
    {start: topEdge, name: 'top-bottom'},
    {start: leftEdge, name: 'left-right'},
  ];

  // Try multiple random starting positions
  for (let attempt = 0; attempt < 100; attempt++) {
    const pairIdx = Math.floor(Math.random() * edgePairs.length);
    const startEdge = edgePairs[pairIdx].start;
    const startCell = startEdge[Math.floor(Math.random() * startEdge.length)];

    if (used[startCell]) continue;

    // Try to place word using DFS with spanning check
    const result = tryPlaceSpanningWord(grid, word, startCell, used);
    if (result.success) {
      return result;
    }
  }

  return {success: false, path: []};
}

/**
 * Attempt to place a word that spans opposite edges
 */
function tryPlaceSpanningWord(
  grid: Grid,
  word: string,
  startIndex: number,
  used: boolean[],
): {success: boolean; path: number[]} {
  const visited = new Set<number>();
  const path: number[] = [];

  function dfs(index: number, charIndex: number): boolean {
    if (charIndex === word.length) {
      // Check if path spans opposite edges
      return checkSpansOppositeEdges(path);
    }

    visited.add(index);
    path.push(index);

    const neighbors = getNeighbors(index);
    // Shuffle for randomness
    const shuffled = neighbors.sort(() => Math.random() - 0.5);

    for (const neighbor of shuffled) {
      if (!visited.has(neighbor) && !used[neighbor]) {
        if (dfs(neighbor, charIndex + 1)) return true;
      }
    }

    visited.delete(index);
    path.pop();
    return false;
  }

  const result = dfs(startIndex, 1);
  return {success: result, path: result ? path : []};
}

/**
 * Check if a path spans opposite edges of the grid
 */
function checkSpansOppositeEdges(path: number[]): boolean {
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
 * Try to place a hint word in available spaces
 */
function tryPlaceHintWord(
  grid: Grid,
  word: string,
  availableIndices: number[],
  used: boolean[],
): boolean {
  // Shuffle available indices for randomness
  const shuffled = [...availableIndices].sort(() => Math.random() - 0.5);

  for (const startIdx of shuffled) {
    if (used[startIdx]) continue;

    const {canPlace, path} = canPlaceWord(grid, word, startIdx, used);
    if (canPlace && path.length === word.length) {
      placeWord(grid, word, path, used);
      return true;
    }
  }

  return false;
}

/**
 * Smart letter selection based on neighbors
 */
function chooseSmartLetter(grid: Grid, index: number): string {
  const neighbors = getNeighbors(index);
  const neighborLetters = neighbors.map((n) => grid[n]).filter((l) => l);

  // Handle special cases
  if (neighborLetters.includes('Q')) return 'U';

  // Try to form common digraphs
  for (const digraph of COMMON_DIGRAPHS) {
    if (neighborLetters.includes(digraph[0]) && Math.random() > 0.6) {
      return digraph[1];
    }
  }

  // Use frequency distribution
  const weights = HIGH_FREQ_LETTERS.split('').map((letter, i) => ({
    letter,
    weight: HIGH_FREQ_LETTERS.length - i,
  }));

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const {letter, weight} of weights) {
    random -= weight;
    if (random <= 0) return letter;
  }

  return 'E';
}

/**
 * Find all possible words of a given minimum length in the grid
 */
function findAllPossibleWords(grid: Grid, minLength: number = 4): string[] {
  const words = new Set<string>();
  const wordList = new Set([
    ...HINT_WORD_LIBRARY[3],
    ...HINT_WORD_LIBRARY[4],
    ...HINT_WORD_LIBRARY[5],
  ]);

  function dfs(index: number, visited: Set<number>, currentWord: string) {
    if (currentWord.length >= minLength) {
      if (wordList.has(currentWord)) {
        words.add(currentWord);
      }
    }

    if (currentWord.length > 8) return; // Don't search too long

    const neighbors = getNeighbors(index);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        dfs(neighbor, visited, currentWord + grid[neighbor]);
        visited.delete(neighbor);
      }
    }
  }

  // Start DFS from each cell
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[i]) {
      const visited = new Set<number>([i]);
      dfs(i, visited, grid[i]);
    }
  }

  return Array.from(words);
}

/**
 * Main grid generation function
 */
export async function generateStrandsGrid(options: {
  themeWords: ThemeWord[];
  ensureHints?: boolean;
  minHintWords?: number;
}): Promise<GenerationResult> {
  const {themeWords, ensureHints = true, minHintWords = 15} = options;

  const spangram = themeWords.find((w) => w.isSpangram);
  const otherWords = themeWords.filter((w) => !w.isSpangram);

  if (!spangram) {
    return {
      success: false,
      grid: '',
      hintWordCount: 0,
      placedHintWords: [],
      foundHintWords: [],
      warning: 'No spangram found in theme words',
    };
  }

  let bestGrid: string | null = null;
  let bestScore = 0;
  let bestPlacedHints: string[] = [];

  // Try multiple times to generate a good grid
  for (let attempt = 0; attempt < 10; attempt++) {
    const grid: Grid = new Array(GRID_SIZE).fill('');
    const used = new Array(GRID_SIZE).fill(false);

    // Step 1: Place spangram
    const spangramResult = placeSpangram(grid, spangram.word, used);
    if (!spangramResult.success) {
      continue; // Try again
    }
    placeWord(grid, spangram.word, spangramResult.path, used);

    // Step 2: Place other theme words
    let allThemeWordsPlaced = true;
    for (const {word} of otherWords) {
      let placed = false;
      for (let i = 0; i < GRID_SIZE; i++) {
        if (!used[i]) {
          const {canPlace, path} = canPlaceWord(grid, word, i, used);
          if (canPlace) {
            placeWord(grid, word, path, used);
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        allThemeWordsPlaced = false;
        break;
      }
    }

    if (!allThemeWordsPlaced) {
      continue; // Try again
    }

    // Step 3: Strategic hint word placement
    const placedHintWords: string[] = [];
    const emptyIndices = grid.map((cell, i) => (!used[i] ? i : -1)).filter((i) => i >= 0);

    if (ensureHints && emptyIndices.length > 0) {
      // Place 3-letter words first (easier to find)
      const threeLetterWords = [...HINT_WORD_LIBRARY[3]].sort(() => Math.random() - 0.5);
      for (const word of threeLetterWords.slice(0, 5)) {
        if (tryPlaceHintWord(grid, word, emptyIndices, used)) {
          placedHintWords.push(word);
          // Update empty indices
          emptyIndices.length = 0;
          emptyIndices.push(...grid.map((cell, i) => (!used[i] ? i : -1)).filter((i) => i >= 0));
        }
      }

      // Place 4-letter words
      const fourLetterWords = [...HINT_WORD_LIBRARY[4]].sort(() => Math.random() - 0.5);
      for (const word of fourLetterWords.slice(0, 8)) {
        if (tryPlaceHintWord(grid, word, emptyIndices, used)) {
          placedHintWords.push(word);
          emptyIndices.length = 0;
          emptyIndices.push(...grid.map((cell, i) => (!used[i] ? i : -1)).filter((i) => i >= 0));
        }
      }
    }

    // Step 4: Fill remaining spaces with smart letters
    for (let i = 0; i < GRID_SIZE; i++) {
      if (!used[i]) {
        grid[i] = chooseSmartLetter(grid, i);
      }
    }

    // Step 5: Validate hint word availability
    const foundHints = findAllPossibleWords(grid, 4);
    const score = foundHints.length;

    if (score >= minHintWords) {
      return {
        success: true,
        grid: grid.join(''),
        hintWordCount: score,
        placedHintWords,
        foundHintWords: foundHints.slice(0, 20), // Sample
      };
    }

    if (score > bestScore) {
      bestGrid = grid.join('');
      bestScore = score;
      bestPlacedHints = placedHintWords;
    }
  }

  // Return best attempt
  return {
    success: bestScore >= minHintWords * 0.7, // Accept if we got 70% of target
    grid: bestGrid || '',
    hintWordCount: bestScore,
    placedHintWords: bestPlacedHints,
    foundHintWords: [],
    warning:
      bestScore < minHintWords
        ? `Only ${bestScore} hint words found (target was ${minHintWords})`
        : undefined,
  };
}
