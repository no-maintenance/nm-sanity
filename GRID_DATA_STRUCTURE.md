# Grid Data Structure Documentation

## Overview

This document describes the data structure used for Strands puzzle grids in the Sanity CMS and how it's integrated into the game components.

## Data Structure

### Complete Puzzle Schema

```typescript
interface SanityStrandsPuzzle {
  _id: string;
  _type: 'strandsPuzzle';
  title: string;
  slug: { current: string };
  puzzleMode: 'auto' | 'manual';

  // Theme words with spangram designation
  themeWords: Array<{
    word: string;           // Normalized uppercase word
    isSpangram: boolean;    // True for the word that spans opposite edges
  }>;

  // Grid data - supports both string and table formats
  generatedGrid: string | {
    rows: Array<{
      cells: string[]       // 6 cells per row (A-Z uppercase letters)
    }>                      // 8 rows total = 48 cells
  };

  gridLocked: boolean;      // Prevents accidental regeneration

  // Critical metadata for game validation
  gridMetadata?: {
    generatedAt: string;               // ISO datetime
    hintWordCount: number;             // Number of valid hint words found
    algorithm: string;                 // e.g., "backtracking-v2"
    canonicalPaths?: string;           // JSON: Record<string, number[]>
  };

  // Pre-validated hint words (optional, improves performance)
  hintWords?: string[];

  // Theme information
  theme: {
    category: string;       // What connects the words
    clue: string;          // Player-facing hint
    emoji?: string;        // Visual theme indicator
  };

  // Gameplay settings
  difficulty: 'easy' | 'medium' | 'hard';
  hintMode: 'standard' | 'none';
  timeLimit: number;      // Minutes (0 = unlimited)
  scoring: {
    pointsPerWord: number;
    spangramBonus: number;
  };
  reward?: { /* optional completion reward */ };
  status: 'draft' | 'ready' | 'published' | 'scheduled';
  publishDate?: string;
  expiryDate?: string;
  puzzleNumber?: number;
}
```

## Grid Format

### Cell Indexing

The grid uses a 1D index system in row-major order:

```text
8 rows × 6 columns = 48 cells total

Row 0: [0,  1,  2,  3,  4,  5 ]
Row 1: [6,  7,  8,  9,  10, 11]
Row 2: [12, 13, 14, 15, 16, 17]
Row 3: [18, 19, 20, 21, 22, 23]
Row 4: [24, 25, 26, 27, 28, 29]
Row 5: [30, 31, 32, 33, 34, 35]
Row 6: [36, 37, 38, 39, 40, 41]
Row 7: [42, 43, 44, 45, 46, 47]
```

### Conversion Functions

```typescript
// Convert 1D index to 2D position
function indexToPosition(index: number): {row: number, col: number} {
  return {
    row: Math.floor(index / 6),
    col: index % 6
  };
}

// Convert 2D position to 1D index
function positionToIndex(pos: {row: number, col: number}): number {
  return pos.row * 6 + pos.col;
}
```

## Canonical Paths

### Purpose

Canonical paths ensure that each theme word can only be found using the **intended** path through the grid. This prevents:

- Finding the same word via multiple alternative paths
- Leaving orphaned letters that don't form valid words
- Puzzle inconsistencies across different solutions

### Structure

Stored as a **JSON string** in `gridMetadata.canonicalPaths`:

```typescript
// Parsed structure
type CanonicalPaths = Record<string, number[]>;

// Example
{
  "DOLPHIN": [7, 2, 3, 9, 10, 14, 17],  // D→O→L→P→H→I→N
  "SHARK": [0, 1, 2, 3, 4],              // S→H→A→R→K
  "WHALE": [18, 19, 20, 21, 22]          // W→H→A→L→E
}
```

### Usage in Validation

```typescript
// In validateWord function (strands-logic.ts)
if (canonicalPaths) {
  const canonicalPath = canonicalPaths[word.toUpperCase()];
  if (canonicalPath && canonicalPath.length > 0) {
    // Verify the player's path matches the canonical path
    const pathMatches =
      path.length === canonicalPath.length &&
      path.every((index, i) => index === canonicalPath[i]);

    if (!pathMatches) {
      return {
        type: 'wrong-path',
        message: `"${word}" is correct, but you used the wrong path!`,
        // ... word not counted as found
      };
    }
  }
}
```

## Grid Generation

### Auto-Generation Process

When using `puzzleMode: 'auto'`, the grid is generated using:

```typescript
// grid-generator.ts
const result = await generateStrandsGrid({
  themeWords: [
    {word: 'DOLPHIN', isSpangram: true},
    {word: 'SHARK', isSpangram: false},
    // ... more words
  ],
  ensureHints: true,
  minHintWords: 15
});

// Result includes:
// - grid: string (48 letters)
// - canonicalPaths: Record<string, number[]>
// - hintWordCount: number
// - placedHintWords: string[]
// - foundHintWords: string[]
```

### Generation Steps

1. **Place Spangram** - Must span opposite edges (top↔bottom or left↔right)
2. **Place Theme Words** - Using depth-first search to find valid paths
3. **Place Hint Words** - Strategic placement of findable English words
4. **Fill Remaining Cells** - Smart letter selection based on common digraphs
5. **Validate Hint Availability** - Ensure minimum hint words are findable
6. **Store Canonical Paths** - Record the intended path for each theme word

## Mock Data Example

See `app/lib/games/mock-puzzle-data.ts` for complete examples:

```typescript
export const MOCK_STRANDS_PUZZLE: SanityStrandsPuzzle = {
  _id: 'mock-puzzle-ocean-life',
  title: 'Strands #42',
  themeWords: [
    {word: 'DOLPHIN', isSpangram: true},
    {word: 'SHARK', isSpangram: false},
    // ... more words
  ],
  generatedGrid: {
    rows: [
      {cells: ['S', 'H', 'A', 'R', 'K', 'W']},
      // ... 7 more rows
    ]
  },
  gridMetadata: {
    canonicalPaths: JSON.stringify({
      'DOLPHIN': [7, 2, 3, 9, 10, 14, 17],
      'SHARK': [0, 1, 2, 3, 4],
      // ... paths for all theme words
    })
  },
  hintWords: ['HALE', 'WALE', 'ORCA', /* ... */],
  // ... rest of puzzle configuration
};
```

## Integration with Game Components

### Data Flow

1. **Loader** (`routes/games.$slug.tsx`) - Fetches puzzle from Sanity
2. **Normalization** - Removes invisible Unicode characters from words
3. **StrandsGame Component** - Main game container
4. **useStrandsGame Hook** - Manages game state and validates submissions
5. **validateWord Function** - Checks canonical paths if available

### Key Components

#### useStrandsGame Hook

```typescript
// app/hooks/games/use-strands-game.ts
const canonicalPaths = puzzle.gridMetadata?.canonicalPaths
  ? JSON.parse(puzzle.gridMetadata.canonicalPaths)
  : undefined;

const validation = await validateWord(
  word,
  pathSnapshot,
  themeWords,
  discoveredHintWords,
  validateEnglishWord,
  canonicalPaths,  // ← Passed to validation
  puzzle.hintWords
);
```

#### gridToString Utility

```typescript
// app/lib/games/strands-logic.ts
export function gridToString(grid: GridData): string {
  if (typeof grid === 'string') {
    return sanitizeGridString(grid);
  }

  // Convert table format to string
  return grid.rows
    .map(row => row.cells.join(''))
    .join('');
}
```

## Testing with Mock Data

### Demo Route

Visit `/games/demo` to test with mock data:

```typescript
// app/routes/($locale).games.demo.tsx
import {MOCK_STRANDS_PUZZLE} from '~/lib/games/mock-puzzle-data';

export default function StrandsGameDemo() {
  return <StrandsGame puzzle={MOCK_STRANDS_PUZZLE} />;
}
```

### Debug Component

The `PuzzleDebugInfo` component provides:

- Visual grid with canonical path highlighting
- Path visualization for each theme word
- Hint word listing
- Metadata inspection

Enable by clicking "Show Debug Info" button in bottom-right corner.

## Migration

For existing puzzles without canonical paths, use the migration script:

```bash
npm run migrate:canonical-paths
```

See `CANONICAL_PATHS_MIGRATION.md` for details.

## Best Practices

### 1. Always Lock Grids in Production

```typescript
gridLocked: true  // Prevents accidental regeneration
```

### 2. Validate Total Character Count

Theme words must total exactly 48 characters:

```typescript
const totalChars = themeWords.reduce((sum, w) => sum + w.word.length, 0);
// totalChars must equal 48
```

### 3. Ensure Spangram Length

Spangrams must be at least 6 characters to span opposite edges:

```typescript
if (spangram.word.length < 6) {
  throw new Error('Spangram too short');
}
```

### 4. Pre-validate Hint Words

Store common hint words in `hintWords` array to avoid API calls:

```typescript
hintWords: ['HALE', 'WALE', 'ORCA', /* ... */]
```

### 5. Normalize Words

Always normalize words to remove invisible Unicode:

```typescript
function normalizeWord(word: string): string {
  return word
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u2000-\u200F\u202A-\u202E\u205F-\u206F]/g, '')
    .trim()
    .toUpperCase();
}
```

## Troubleshooting

### Issue: "Wrong path" error for valid word

**Cause**: Player found word using non-canonical path

**Solution**: Canonical paths are working as intended. Player needs to find the word using the intended route.

### Issue: Grid not displaying

**Cause**: Invalid grid format

**Solution**: Ensure grid is either:
- String: Exactly 48 uppercase letters
- Table: 8 rows with 6 cells each

### Issue: Hint words not validating

**Cause**: Missing hint words array or Datamuse API error

**Solution**:
1. Add pre-validated hint words to `puzzle.hintWords`
2. Check Datamuse API connectivity
3. Verify word is at least 4 characters

## Related Files

- `app/lib/games/strands.queries.ts` - Type definitions and queries
- `app/lib/games/strands-logic.ts` - Core game logic and validation
- `app/lib/games/grid-generator.ts` - Auto-generation algorithm
- `app/lib/games/mock-puzzle-data.ts` - Example mock data
- `app/hooks/games/use-strands-game.ts` - Game state management
- `app/components/games/strands-game.tsx` - Main game component
- `app/components/games/strands-board.tsx` - Grid rendering
- `app/components/games/puzzle-debug-info.tsx` - Debug visualization
- `app/sanity/schema/documents/strands-puzzle.tsx` - Sanity schema

## API Reference

See `STRANDS_GAME_SPEC.md` for complete game specification and API documentation.
