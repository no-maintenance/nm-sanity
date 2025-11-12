/**
 * Helper script to find valid adjacent paths for words in the grid
 * Run with: npx tsx scripts/find-word-paths.ts
 */

const grid = [
  'S', 'H', 'A', 'R', 'K', 'W',  // Row 0
  'E', 'D', 'O', 'L', 'P', 'H',  // Row 1
  'A', 'L', 'P', 'H', 'I', 'N',  // Row 2
  'W', 'H', 'A', 'L', 'E', 'S',  // Row 3
  'E', 'I', 'N', 'K', 'T', 'U',  // Row 4
  'E', 'N', 'C', 'O', 'R', 'A',  // Row 5
  'O', 'C', 'T', 'O', 'P', 'U',  // Row 6
  'S', 'U', 'N', 'K', 'I', 'T',  // Row 7
];

const GRID_ROWS = 8;
const GRID_COLS = 6;

function indexToPosition(index: number): {row: number; col: number} {
  return {
    row: Math.floor(index / GRID_COLS),
    col: index % GRID_COLS,
  };
}

function getNeighbors(index: number): number[] {
  const {row, col} = indexToPosition(index);
  const neighbors: number[] = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < GRID_ROWS && newCol >= 0 && newCol < GRID_COLS) {
        neighbors.push(newRow * GRID_COLS + newCol);
      }
    }
  }

  return neighbors;
}

function findWordPath(word: string): number[][] {
  const paths: number[][] = [];

  function dfs(charIndex: number, currentPath: number[], visited: Set<number>) {
    if (charIndex === word.length) {
      paths.push([...currentPath]);
      return;
    }

    const lastIndex = currentPath[currentPath.length - 1];
    const neighbors = getNeighbors(lastIndex);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor) && grid[neighbor] === word[charIndex]) {
        visited.add(neighbor);
        currentPath.push(neighbor);
        dfs(charIndex + 1, currentPath, visited);
        currentPath.pop();
        visited.delete(neighbor);
      }
    }
  }

  // Find all starting positions for first character
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === word[0]) {
      const visited = new Set<number>([i]);
      dfs(1, [i], visited);
    }
  }

  return paths;
}

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

// Words to find
const words = ['SHARK', 'WHALE', 'DOLPHIN', 'SEAWEED', 'CORAL', 'OCTOPUS'];

console.log('Finding paths for words in grid...\n');

for (const word of words) {
  console.log(`\n${word}:`);
  const paths = findWordPath(word);

  if (paths.length === 0) {
    console.log('  ❌ No valid path found!');
  } else {
    console.log(`  ✓ Found ${paths.length} possible path(s)`);

    // Show first few paths
    const showCount = Math.min(paths.length, 3);
    for (let i = 0; i < showCount; i++) {
      const path = paths[i];
      const pathStr = path.map(idx => `${grid[idx]}(${idx})`).join(' → ');
      const spans = checkSpansOppositeEdges(path);
      console.log(`  Path ${i + 1}: [${path.join(', ')}]`);
      console.log(`         ${pathStr}`);
      if (word === 'DOLPHIN' && spans) {
        console.log(`         ⭐ SPANS OPPOSITE EDGES!`);
      }
    }

    if (paths.length > showCount) {
      console.log(`  ... and ${paths.length - showCount} more paths`);
    }
  }
}
