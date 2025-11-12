import type {SanityStrandsPuzzle} from './strands.queries';

/**
 * Mock puzzle data for testing and development
 * Theme: Ocean Life
 *
 * Grid (8x6 = 48 cells):
 * S H A R K W
 * E D O L P H
 * A L P H I N
 * W H A L E S
 * E I N K T U
 * E N C O R A
 * D E H T A L
 * S T A R F I
 *
 * Theme Words with Canonical Paths:
 * 1. DOLPHIN (spangram) - spans top to bottom
 * 2. SHARK
 * 3. WHALE
 * 4. SEAWEED
 * 5. CORAL
 * 6. STARFISH
 */

export const MOCK_STRANDS_PUZZLE: SanityStrandsPuzzle = {
  _id: 'mock-puzzle-ocean-life',
  _type: 'strandsPuzzle',
  title: 'Strands #42',
  slug: {
    current: 'ocean-life-puzzle',
  },
  puzzleMode: 'auto',

  // Theme words with spangram marked
  themeWords: [
    {
      word: 'DOLPHIN',
      isSpangram: true, // Spans from top to bottom
    },
    {
      word: 'SHARK',
      isSpangram: false,
    },
    {
      word: 'WHALE',
      isSpangram: false,
    },
    {
      word: 'SEAWEED',
      isSpangram: false,
    },
    {
      word: 'CORAL',
      isSpangram: false,
    },
  ],

  // Primary grid field with flat cell array
  canonicalGrid: {
    cells: [
      'S', 'H', 'A', 'R', 'K', 'W', // Row 0 (indices 0-5)
      'E', 'D', 'O', 'L', 'P', 'H', // Row 1 (indices 6-11)
      'A', 'L', 'P', 'H', 'I', 'N', // Row 2 (indices 12-17)
      'W', 'H', 'A', 'L', 'E', 'S', // Row 3 (indices 18-23)
      'E', 'I', 'N', 'K', 'T', 'U', // Row 4 (indices 24-29)
      'E', 'N', 'C', 'O', 'R', 'A', // Row 5 (indices 30-35)
      'D', 'E', 'H', 'T', 'A', 'L', // Row 6 (indices 36-41)
      'S', 'T', 'A', 'R', 'F', 'I', // Row 7 (indices 42-47)
    ],
    themePaths: JSON.stringify({
      'DOLPHIN': {word: 'DOLPHIN', path: [7, 8, 9, 10, 11, 16, 17], isSpangram: true, color: 'bg-yellow-400'},
      'SHARK': {word: 'SHARK', path: [0, 1, 2, 3, 4], isSpangram: false, color: 'bg-blue-400'},
      'WHALE': {word: 'WHALE', path: [18, 19, 20, 21, 22], isSpangram: false, color: 'bg-green-400'},
      'SEAWEED': {word: 'SEAWEED', path: [0, 6, 12, 18, 24, 30, 36], isSpangram: false, color: 'bg-red-400'},
      'CORAL': {word: 'CORAL', path: [32, 33, 34, 35, 41], isSpangram: false, color: 'bg-purple-400'},
    }),
    hintPaths: JSON.stringify({}),
    metadata: {
      generatedAt: new Date().toISOString(),
      algorithm: 'manual',
      dimensions: {rows: 8, cols: 6},
      totalHintWords: 18,
    },
  },

  gridLocked: true,

  // Grid metadata with canonical paths
  gridMetadata: {
    generatedAt: new Date().toISOString(),
    hintWordCount: 18,
    algorithm: 'backtracking-v2',
    // Canonical paths as JSON string (verified adjacent paths!)
    canonicalPaths: JSON.stringify({
      'DOLPHIN': [7, 8, 9, 10, 11, 16, 17], // D(7)->O(8)->L(9)->P(10)->H(11)->I(16)->N(17) - valid adjacent path
      'SHARK': [0, 1, 2, 3, 4], // S(0)->H(1)->A(2)->R(3)->K(4) - valid adjacent path
      'WHALE': [18, 19, 20, 21, 22], // W(18)->H(19)->A(20)->L(21)->E(22) - valid adjacent path (Path 3 from analysis)
      'SEAWEED': [0, 6, 12, 18, 24, 30, 36], // S(0)->E(6)->A(12)->W(18)->E(24)->E(30)->D(36) - valid adjacent path (vertical)
      'CORAL': [32, 33, 34, 35, 41], // C(32)->O(33)->R(34)->A(35)->L(41) - valid adjacent path (Path 1 from analysis)
    }),
  },

  // Pre-validated hint words that exist in the grid
  hintWords: [
    'HALE',
    'WALE',
    'ORCA',
    'HATE',
    'PINE',
    'SHIN',
    'KALE',
    'EARL',
    'HARK',
    'STAR',
    'FISH',
    'HALT',
    'PEAK',
    'SINK',
    'INKS',
    'ALPS',
    'HEAL',
    'DEAL',
  ],

  // Theme information
  theme: {
    category: 'Things you find in the ocean',
    clue: 'Dive deep for marine creatures',
  },

  // Gameplay settings
  difficulty: 'medium',
  hintMode: 'standard',
  timeLimit: 0, // Unlimited

  scoring: {
    pointsPerWord: 100,
    spangramBonus: 200,
  },

  reward: {
    enabled: true,
    type: 'message',
    message: 'Great job! You discovered all the ocean creatures! 🐬',
  },

  status: 'published',
  puzzleNumber: 42,
};

/**
 * Alternative mock puzzle - simpler for quick testing
 * Theme: Colors
 */
export const MOCK_SIMPLE_PUZZLE: SanityStrandsPuzzle = {
  _id: 'mock-puzzle-colors',
  _type: 'strandsPuzzle',
  title: 'Strands #1',
  slug: {
    current: 'colors-puzzle',
  },
  puzzleMode: 'auto',

  themeWords: [
    {word: 'RAINBOW', isSpangram: true},
    {word: 'RED', isSpangram: false},
    {word: 'BLUE', isSpangram: false},
    {word: 'GREEN', isSpangram: false},
  ],

  // Primary grid field with flat cell array
  canonicalGrid: {
    cells: [
      'R', 'A', 'I', 'N', 'B', 'O', // Row 0 (indices 0-5)
      'E', 'D', 'G', 'R', 'E', 'W', // Row 1 (indices 6-11)
      'D', 'L', 'U', 'E', 'N', 'A', // Row 2 (indices 12-17)
      'T', 'I', 'M', 'E', 'S', 'V', // Row 3 (indices 18-23)
      'H', 'N', 'K', 'L', 'O', 'E', // Row 4 (indices 24-29)
      'E', 'T', 'S', 'P', 'T', 'R', // Row 5 (indices 30-35)
      'M', 'E', 'A', 'N', 'S', 'Y', // Row 6 (indices 36-41)
      'S', 'U', 'N', 'K', 'I', 'T', // Row 7 (indices 42-47)
    ],
    themePaths: JSON.stringify({
      'RAINBOW': {word: 'RAINBOW', path: [0, 1, 2, 3, 4, 5, 11], isSpangram: true, color: 'bg-yellow-400'},
      'RED': {word: 'RED', path: [0, 6, 12], isSpangram: false, color: 'bg-red-500'},
      'BLUE': {word: 'BLUE', path: [4, 10, 14, 15], isSpangram: false, color: 'bg-blue-500'},
      'GREEN': {word: 'GREEN', path: [8, 9, 15, 16, 17], isSpangram: false, color: 'bg-green-500'},
    }),
    hintPaths: JSON.stringify({}),
    metadata: {
      generatedAt: new Date().toISOString(),
      algorithm: 'manual',
      dimensions: {rows: 8, cols: 6},
      totalHintWords: 12,
    },
  },

  gridLocked: true,

  gridMetadata: {
    generatedAt: new Date().toISOString(),
    hintWordCount: 12,
    algorithm: 'backtracking-v2',
    canonicalPaths: JSON.stringify({
      'RAINBOW': [0, 1, 2, 3, 4, 5], // Top row
      'RED': [0, 6, 12], // R->E->D vertical
      'BLUE': [4, 10, 16, 22], // B->L->U->E diagonal
      'GREEN': [8, 14, 20, 21, 15], // G->R->E->E->N
    }),
  },

  hintWords: ['TIME', 'MEAN', 'SINK', 'THEM', 'RAIN', 'KING'],

  theme: {
    category: 'Rainbow colors',
    clue: 'Bright hues',
  },

  difficulty: 'easy',
  hintMode: 'standard',
  timeLimit: 0,

  scoring: {
    pointsPerWord: 100,
    spangramBonus: 200,
  },

  status: 'published',
  puzzleNumber: 1,
};

/**
 * Helper to convert table grid to string format
 */
export function gridToString(grid: {rows: Array<{cells: string[]}>} | string): string {
  if (typeof grid === 'string') return grid;
  return grid.rows.map(row => row.cells.join('')).join('');
}
