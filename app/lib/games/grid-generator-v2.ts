/**
 * Strands Grid Generator V2
 * Based on customstrandsnyt.com algorithm
 *
 * Key improvements:
 * - All 48 letters must be used (no fillers)
 * - BFS-based spangram placement
 * - Subset sum partitioning
 * - Longest path word placement
 */

const GRID_ROWS = 8;
const GRID_COLS = 6;
const GRID_SIZE = GRID_ROWS * GRID_COLS; // 48

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
  canonicalPaths?: Record<string, number[]>;
  hintPaths?: Record<string, number[]>; // Paths for discovered hint words
  warning?: string;
}

interface Position {
  row: number;
  col: number;
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
 * Note: Randomly removes some diagonal connections to make placement harder/more interesting
 */
function getNeighbors(index: number, removedDiagonals: Set<string> = new Set()): number[] {
  const {row, col} = indexToPosition(index);
  const neighbors: number[] = [];

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (newRow >= 0 && newRow < GRID_ROWS && newCol >= 0 && newCol < GRID_COLS) {
      const neighborIndex = positionToIndex({row: newRow, col: newCol});

      // Check if this is a diagonal and if it's been removed
      const isDiagonal = Math.abs(dr) === 1 && Math.abs(dc) === 1;
      if (isDiagonal) {
        const edge = `${index}-${neighborIndex}`;
        if (removedDiagonals.has(edge)) continue;
      }

      neighbors.push(neighborIndex);
    }
  }

  return neighbors;
}

/**
 * Create a set of removed diagonal edges
 * For each pair of diagonals, randomly remove one
 */
function createRemovedDiagonals(): Set<string> {
  const removed = new Set<string>();

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const index = positionToIndex({row, col});

      // Check right-diagonals (top-right and bottom-right)
      if (col < GRID_COLS - 1) {
        const topRight = positionToIndex({row: row - 1, col: col + 1});
        const bottomRight = positionToIndex({row: row + 1, col: col + 1});

        // Randomly remove one of the diagonal pair if both exist
        if (row > 0 && row < GRID_ROWS - 1 && Math.random() < 0.5) {
          const toRemove = Math.random() < 0.5 ? topRight : bottomRight;
          removed.add(`${index}-${toRemove}`);
          removed.add(`${toRemove}-${index}`);
        }
      }
    }
  }

  return removed;
}

/**
 * BFS to find shortest path from start to any cell on target border
 * Only traverses through empty cells (except the start cell)
 */
function bfsShortestPath(
  start: number,
  targetBorder: 'top' | 'bottom' | 'left' | 'right',
  grid: string[],
  removedDiagonals: Set<string>
): number[] | null {
  const queue: {index: number; path: number[]}[] = [{index: start, path: [start]}];
  const visited = new Set<number>([start]);

  const isTargetReached = (index: number): boolean => {
    const {row, col} = indexToPosition(index);
    switch (targetBorder) {
      case 'top': return row === 0;
      case 'bottom': return row === GRID_ROWS - 1;
      case 'left': return col === 0;
      case 'right': return col === GRID_COLS - 1;
    }
  };

  while (queue.length > 0) {
    const {index, path} = queue.shift()!;

    if (isTargetReached(index)) {
      return path;
    }

    const neighbors = getNeighbors(index, removedDiagonals);
    for (const neighbor of neighbors) {
      // Only traverse through empty cells or if it's the target border
      if (!visited.has(neighbor) && (grid[neighbor] === '' || isTargetReached(neighbor))) {
        visited.add(neighbor);
        queue.push({index: neighbor, path: [...path, neighbor]});
      }
    }
  }

  return null;
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
 * Place spangram across the grid using BFS
 * Re-runs BFS after placing each letter as per the recipe
 * Ensures the spangram spans opposite edges to divide the grid
 */
function placeSpangram(
  word: string,
  grid: string[],
  removedDiagonals: Set<string>
): {success: boolean; path: number[]} {
  // Try multiple random starting positions
  for (let attempt = 0; attempt < 50; attempt++) {
    // Clear grid for this attempt
    grid.fill('');

    // Randomly choose horizontal or vertical
    const isHorizontal = Math.random() < 0.5;
    const targetBorder: 'top' | 'bottom' | 'left' | 'right' = isHorizontal ? 'right' : 'bottom';

    // Get starting edge
    let startingEdge: number[];
    if (isHorizontal) {
      startingEdge = Array.from({length: GRID_ROWS}, (_, i) => i * GRID_COLS);
    } else {
      startingEdge = Array.from({length: GRID_COLS}, (_, i) => i);
    }

    const startIndex = startingEdge[Math.floor(Math.random() * startingEdge.length)];
    const placedPath: number[] = [];
    let currentIndex = startIndex;

    // Place spangram letter by letter, re-running BFS each time
    let success = true;
    for (let i = 0; i < word.length; i++) {
      // Place current letter
      grid[currentIndex] = word[i];
      placedPath.push(currentIndex);

      // If not the last letter, find next position via BFS
      if (i < word.length - 1) {
        const path = bfsShortestPath(currentIndex, targetBorder, grid, removedDiagonals);

        if (!path || path.length < 2) {
          // Failed to find path to border
          success = false;
          break;
        }

        // Next position is the second element in the path (first is current)
        currentIndex = path[1];
      }
    }

    // Check if this placement spans opposite edges
    if (success && checkSpansOppositeEdges(placedPath)) {
      return {success: true, path: placedPath};
    }
  }

  return {success: false, path: []};
}

/**
 * Partition grid geometrically based on which side of the spangram each cell is on
 * Uses a line-based partitioning approach
 */
function partitionGridBFS(
  spangramPath: number[],
  removedDiagonals: Set<string>
): {region1: Set<number>; region2: Set<number>} {
  const spangramSet = new Set(spangramPath);
  const allIndices = Array.from({length: GRID_SIZE}, (_, i) => i);
  const availableIndices = allIndices.filter(i => !spangramSet.has(i));

  if (availableIndices.length === 0) {
    return {region1: new Set(), region2: new Set()};
  }

  // Get the average position of the spangram to determine the dividing line
  const spangramPositions = spangramPath.map(idx => indexToPosition(idx));
  const avgRow = spangramPositions.reduce((sum, p) => sum + p.row, 0) / spangramPath.length;
  const avgCol = spangramPositions.reduce((sum, p) => sum + p.col, 0) / spangramPath.length;

  // Determine if spangram is more horizontal or vertical
  const minRow = Math.min(...spangramPositions.map(p => p.row));
  const maxRow = Math.max(...spangramPositions.map(p => p.row));
  const minCol = Math.min(...spangramPositions.map(p => p.col));
  const maxCol = Math.max(...spangramPositions.map(p => p.col));

  const rowSpan = maxRow - minRow;
  const colSpan = maxCol - minCol;

  const region1 = new Set<number>();
  const region2 = new Set<number>();

  // Partition based on orientation
  if (colSpan >= rowSpan) {
    // Horizontal spangram - partition by rows
    for (const idx of availableIndices) {
      const pos = indexToPosition(idx);
      if (pos.row < avgRow) {
        region1.add(idx);
      } else {
        region2.add(idx);
      }
    }
  } else {
    // Vertical spangram - partition by columns
    for (const idx of availableIndices) {
      const pos = indexToPosition(idx);
      if (pos.col < avgCol) {
        region1.add(idx);
      } else {
        region2.add(idx);
      }
    }
  }

  // Ensure both regions have at least some cells
  if (region1.size === 0 || region2.size === 0) {
    // Fallback: split roughly in half
    const sorted = [...availableIndices].sort();
    const mid = Math.floor(sorted.length / 2);
    return {
      region1: new Set(sorted.slice(0, mid)),
      region2: new Set(sorted.slice(mid))
    };
  }

  return {region1, region2};
}

/**
 * Subset sum to partition words into two groups
 */
function subsetSum(words: string[], target: number): {success: boolean; subset1: string[]; subset2: string[]} {
  const n = words.length;
  const lengths = words.map(w => w.length);

  // DP table
  const dp: boolean[][] = Array(n + 1).fill(null).map(() => Array(target + 1).fill(false));
  dp[0][0] = true;

  // Fill DP table
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= target; j++) {
      dp[i][j] = dp[i - 1][j]; // Don't include word i-1

      if (j >= lengths[i - 1]) {
        dp[i][j] = dp[i][j] || dp[i - 1][j - lengths[i - 1]]; // Include word i-1
      }
    }
  }

  if (!dp[n][target]) {
    return {success: false, subset1: [], subset2: []};
  }

  // Backtrack to find subset
  const subset1: string[] = [];
  const subset2: string[] = [];
  let i = n;
  let j = target;

  while (i > 0 && j > 0) {
    if (!dp[i - 1][j] && j >= lengths[i - 1] && dp[i - 1][j - lengths[i - 1]]) {
      subset1.push(words[i - 1]);
      j -= lengths[i - 1];
    } else {
      subset2.push(words[i - 1]);
    }
    i--;
  }

  return {success: true, subset1, subset2};
}

/**
 * Find a long path in a region using greedy DFS with timeout
 * This is much faster than finding the truly longest path
 */
function findLongestPath(
  availableIndices: Set<number>,
  targetLength: number,
  removedDiagonals: Set<string>,
  timeoutMs: number = 5000
): number[] | null {
  const startTime = Date.now();
  let longestPath: number[] = [];

  // Try only a subset of starting points to avoid timeout
  const startPoints = Array.from(availableIndices);
  const maxStartPoints = Math.min(10, startPoints.length);

  for (let i = 0; i < maxStartPoints; i++) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      console.log('Longest path search timed out');
      break;
    }

    const start = startPoints[i];
    const path = greedyDfsPath(
      start,
      availableIndices,
      new Set(),
      removedDiagonals,
      targetLength,
      startTime,
      timeoutMs
    );

    if (path && path.length > longestPath.length) {
      longestPath = path;
      if (longestPath.length >= targetLength) {
        return longestPath;
      }
    }
  }

  return longestPath.length >= targetLength ? longestPath : null;
}

/**
 * Greedy DFS that stops when target length is reached or timeout occurs
 * Much faster than exhaustive search
 */
function greedyDfsPath(
  current: number,
  available: Set<number>,
  visited: Set<number>,
  removedDiagonals: Set<string>,
  targetLength: number,
  startTime: number,
  timeoutMs: number
): number[] | null {
  // Check timeout
  if (Date.now() - startTime > timeoutMs) {
    return null;
  }

  visited.add(current);

  // Early termination if we reached target
  if (visited.size >= targetLength) {
    const result = Array.from(visited);
    visited.delete(current);
    return result;
  }

  const neighbors = getNeighbors(current, removedDiagonals)
    .filter(n => available.has(n) && !visited.has(n))
    .sort(() => Math.random() - 0.5); // Randomize for variety

  let longestPath: number[] = Array.from(visited);

  for (const neighbor of neighbors) {
    const path = greedyDfsPath(
      neighbor,
      available,
      visited,
      removedDiagonals,
      targetLength,
      startTime,
      timeoutMs
    );

    if (path) {
      if (path.length >= targetLength) {
        visited.delete(current);
        return path;
      }
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }
  }

  visited.delete(current);
  return longestPath;
}

/**
 * Place words along a path
 */
function placeWordsAlongPath(
  words: string[],
  path: number[],
  grid: string[]
): {success: boolean; canonicalPaths: Record<string, number[]>} {
  const canonicalPaths: Record<string, number[]> = {};

  // Shuffle words for randomness
  const shuffledWords = [...words].sort(() => Math.random() - 0.5);

  let pathIndex = 0;
  for (const word of shuffledWords) {
    const wordPath: number[] = [];

    // Randomly reverse word
    const actualWord = Math.random() < 0.5 ? word : word.split('').reverse().join('');

    for (let i = 0; i < actualWord.length; i++) {
      if (pathIndex >= path.length) {
        return {success: false, canonicalPaths: {}};
      }

      grid[path[pathIndex]] = actualWord[i];
      wordPath.push(path[pathIndex]);
      pathIndex++;
    }

    // Store canonical path using original word
    canonicalPaths[word.toUpperCase()] = wordPath;
  }

  return {success: true, canonicalPaths};
}

/**
 * Main generation function using customstrandsnyt algorithm
 */
export async function generateStrandsGrid(options: {
  themeWords: ThemeWord[];
  ensureHints?: boolean;
  minHintWords?: number;
}): Promise<GenerationResult> {
  const {themeWords} = options;

  const spangram = themeWords.find(w => w.isSpangram);
  const otherWords = themeWords.filter(w => !w.isSpangram);

  if (!spangram) {
    return {
      success: false,
      grid: '',
      hintWordCount: 0,
      placedHintWords: [],
      foundHintWords: [],
      hintPaths: {},
      warning: 'No spangram found in theme words',
    };
  }

  // Validate total length = 48
  const totalLength = themeWords.reduce((sum, w) => sum + w.word.length, 0);
  if (totalLength !== GRID_SIZE) {
    return {
      success: false,
      grid: '',
      hintWordCount: 0,
      placedHintWords: [],
      foundHintWords: [],
      warning: `Total word length must be exactly 48 characters (currently ${totalLength})`,
    };
  }

  // Try up to 10 times
  console.log(`🎮 Starting grid generation with ${themeWords.length} words`);

  for (let attempt = 0; attempt < 10; attempt++) {
    console.log(`\n📝 Attempt ${attempt + 1}/10`);

    const grid: string[] = new Array(GRID_SIZE).fill('');
    const removedDiagonals = createRemovedDiagonals();
    const canonicalPaths: Record<string, number[]> = {};

    // Step 1: Place spangram
    console.log(`  ➡️  Placing spangram: ${spangram.word}`);
    const spangramResult = placeSpangram(spangram.word.toUpperCase(), grid, removedDiagonals);
    if (!spangramResult.success) {
      console.log('  ❌ Failed to place spangram');
      continue;
    }

    // Log spangram details
    const spangramPositions = spangramResult.path.map(idx => indexToPosition(idx));
    const minRow = Math.min(...spangramPositions.map(p => p.row));
    const maxRow = Math.max(...spangramPositions.map(p => p.row));
    const minCol = Math.min(...spangramPositions.map(p => p.col));
    const maxCol = Math.max(...spangramPositions.map(p => p.col));
    console.log(`  ✅ Spangram placed (${spangramResult.path.length} cells)`);
    console.log(`     Path: ${spangramResult.path.map(idx => `[${indexToPosition(idx).row},${indexToPosition(idx).col}]`).join(' → ')}`);
    console.log(`     Spans: rows ${minRow}-${maxRow}, cols ${minCol}-${maxCol}`);
    console.log(`     Touches edges: ${checkSpansOppositeEdges(spangramResult.path) ? '✓' : '✗'}`);

    canonicalPaths[spangram.word.toUpperCase()] = spangramResult.path;

    // Step 2: Use BFS to partition grid into two regions
    console.log(`  ➡️  Partitioning grid into two regions using BFS`);
    const {region1, region2} = partitionGridBFS(spangramResult.path, removedDiagonals);
    console.log(`  ✅ Region 1: ${region1.size} cells, Region 2: ${region2.size} cells`);

    if (region1.size === 0 || region2.size === 0) {
      console.log('  ❌ One region is empty');
      continue;
    }

    // Step 3: Partition words using subset sum to match region sizes
    const targetLength1 = region1.size;
    const targetLength2 = region2.size;

    console.log(`  ➡️  Partitioning ${otherWords.length} words to fit regions (${targetLength1} vs ${targetLength2} cells)`);
    const partition = subsetSum(otherWords.map(w => w.word), targetLength1);
    if (!partition.success) {
      console.log('  ❌ Failed to partition words');
      continue;
    }
    console.log(`  ✅ Partitioned into groups: [${partition.subset1.join(', ')}] (${partition.subset1.reduce((sum, w) => sum + w.length, 0)} letters) and [${partition.subset2.join(', ')}] (${partition.subset2.reduce((sum, w) => sum + w.length, 0)} letters)`);

    // Step 4: Find longest paths for each partition in their respective regions

    const targetLen1 = partition.subset1.reduce((sum, w) => sum + w.length, 0);
    console.log(`  ➡️  Finding path for group 1 in region 1 (need ${targetLen1} cells)`);
    const path1 = findLongestPath(region1, targetLen1, removedDiagonals);
    if (!path1) {
      console.log('  ❌ Failed to find path for group 1');
      continue;
    }
    console.log(`  ✅ Found path with ${path1.length} cells`);

    const targetLen2 = partition.subset2.reduce((sum, w) => sum + w.length, 0);
    console.log(`  ➡️  Finding path for group 2 in region 2 (need ${targetLen2} cells)`);
    const path2 = findLongestPath(region2, targetLen2, removedDiagonals);
    if (!path2) {
      console.log('  ❌ Failed to find path for group 2');
      continue;
    }
    console.log(`  ✅ Found path with ${path2.length} cells`);

    // Step 5: Place words along paths
    console.log(`  ➡️  Placing words along paths`);
    const result1 = placeWordsAlongPath(partition.subset1, path1, grid);
    if (!result1.success) {
      console.log('  ❌ Failed to place group 1 words');
      continue;
    }

    const result2 = placeWordsAlongPath(partition.subset2, path2, grid);
    if (!result2.success) {
      console.log('  ❌ Failed to place group 2 words');
      continue;
    }

    // Merge canonical paths
    Object.assign(canonicalPaths, result1.canonicalPaths, result2.canonicalPaths);

    // Success!
    console.log(`\n✅ Grid generation successful on attempt ${attempt + 1}!`);

    // Debug: Check for empty cells
    const emptyCells = grid.filter(cell => cell === '').length;
    if (emptyCells > 0) {
      console.log(`⚠️  WARNING: ${emptyCells} cells are still empty!`);
      console.log(`  Grid length: ${grid.join('').length} (should be 48)`);
    }

    return {
      success: true,
      grid: grid.join(''),
      hintWordCount: 0,
      placedHintWords: [],
      foundHintWords: [],
      canonicalPaths,
      hintPaths: {}, // Hint paths will be discovered separately
    };
  }

  console.log('\n❌ Failed to generate grid after 10 attempts');

  // Failed after all attempts
  return {
    success: false,
    grid: '',
    hintWordCount: 0,
    placedHintWords: [],
    foundHintWords: [],
    hintPaths: {},
    warning: 'Failed to generate grid after 10 attempts. Try different words or word lengths.',
  };
}
