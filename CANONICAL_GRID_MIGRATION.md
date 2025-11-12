# Canonical Grid Migration Guide

## Overview

This document describes the migration from `generatedGrid` to the new `canonicalGrid` field in the Strands puzzle data structure.

## What Changed

### Before (Old Structure)

```typescript
interface SanityStrandsPuzzle {
  generatedGrid: string | {rows: Array<{cells: string[]}>};
  gridMetadata?: {
    canonicalPaths?: string; // JSON string
  };
}
```

### After (New Structure)

```typescript
interface SanityStrandsPuzzle {
  generatedGrid?: string | {rows: Array<{cells: string[]}>}; // DEPRECATED
  canonicalGrid?: CanonicalGrid; // NEW: Primary grid field
  gridMetadata?: {
    canonicalPaths?: string; // Still supported for backward compatibility
  };
}
```

### New CanonicalGrid Type

```typescript
interface CanonicalGrid {
  /** Flat array of 48 letters (8 rows × 6 columns) */
  cells: string[];

  /** Theme word positions with metadata */
  themePaths: Record<string, ThemeWordPath>;

  /** Optional hint word positions */
  hintPaths?: Record<string, number[]>;

  /** Grid generation metadata */
  metadata: {
    generatedAt: string;
    algorithm: string;
    dimensions: {rows: number; cols: number};
    totalHintWords: number;
    seed?: string;
  };
}

interface ThemeWordPath {
  word: string;
  path: number[];
  isSpangram: boolean;
  color: string; // Pre-calculated color for consistency
}
```

## Benefits

1. **Unified Structure**: Grid data and paths are stored together
2. **Type Safety**: Strong typing with proper validation
3. **Performance**: No need to parse JSON strings
4. **Pre-calculated Data**: Colors and metadata stored with paths
5. **Better DX**: Clear, documented structure with utility functions

## Implementation

### 1. New Files Created

#### `app/lib/games/canonical-grid.types.ts`
- Type definitions for `CanonicalGrid`
- `CanonicalGridUtils` class with helper methods
- Type guards and validation functions

#### `app/lib/games/grid-utils.ts`
- `getGridData()` - Gets grid, preferring canonicalGrid
- `getGridString()` - Converts grid to 48-character string
- `getCanonicalPaths()` - Extracts paths from either format
- `hasCanonicalPaths()` - Checks if paths are available

### 2. Updated Files

#### `app/lib/games/strands.queries.ts`
- Added `canonicalGrid?: CanonicalGrid` field
- Marked `generatedGrid` as deprecated
- Updated GROQ query to fetch `canonicalGrid`

#### `app/components/games/game-locked-view.tsx`
- Now uses `getGridString()` and `getCanonicalPaths()`
- Passes canonical paths to `validateWord()`
- Uses canonical paths for hints if available

#### `app/components/games/strands-game.tsx`
- Now uses `getGridData()` and `getGridString()`
- Compatible with both old and new formats

#### `app/lib/games/mock-puzzle-data.ts`
- Added `canonicalGrid` field to both mock puzzles
- Marked `generatedGrid` as deprecated
- Both fields included for backward compatibility

## Migration Strategy

### Phase 1: Backward Compatibility (Current)

Both `generatedGrid` and `canonicalGrid` are supported:

```typescript
// Helper functions automatically choose the right format
const gridString = getGridString(puzzle); // Works with both formats
const paths = getCanonicalPaths(puzzle); // Extracts from either format
```

### Phase 2: Backend Changes (In Progress)

Backend will start generating `canonicalGrid` format:

```typescript
const canonicalGrid: CanonicalGrid = {
  cells: ['S', 'H', 'A', 'R', 'K', /* ... 43 more */],
  themePaths: {
    'SHARK': {
      word: 'SHARK',
      path: [0, 1, 2, 3, 4],
      isSpangram: false,
      color: 'bg-blue-200'
    },
    // ... more words
  },
  metadata: {
    generatedAt: new Date().toISOString(),
    algorithm: 'backtracking-v2',
    dimensions: {rows: 8, cols: 6},
    totalHintWords: 18
  }
};
```

### Phase 3: Full Migration (Future)

Once all puzzles use `canonicalGrid`:
1. Remove `generatedGrid` field from schema
2. Remove backward compatibility code
3. Update documentation

## Usage Examples

### Getting Grid Data

```typescript
import {getGridData, getGridString, getCanonicalPaths} from '~/lib/games/grid-utils';

// Get grid in any format
const gridData = getGridData(puzzle);

// Get as 48-character string
const gridString = getGridString(puzzle); // "SHARKW..."

// Get canonical paths
const paths = getCanonicalPaths(puzzle);
// { 'SHARK': [0, 1, 2, 3, 4], 'DOLPHIN': [...], ... }
```

### Validating Words

```typescript
import {validateWord} from '~/lib/games/strands-logic';
import {getCanonicalPaths} from '~/lib/games/grid-utils';

const canonicalPaths = getCanonicalPaths(puzzle);

const validation = await validateWord(
  word,
  path,
  themeWords,
  discoveredHintWords,
  validateEnglishWord,
  canonicalPaths, // ← Automatically uses correct format
  puzzle.hintWords
);
```

### Working with CanonicalGrid

```typescript
import {CanonicalGridUtils, isCanonicalGrid} from '~/lib/games/canonical-grid.types';

// Check if it's the new format
if (isCanonicalGrid(puzzle.canonicalGrid)) {
  // Use utility functions
  const gridString = CanonicalGridUtils.toString(puzzle.canonicalGrid);
  const tableFormat = CanonicalGridUtils.toTableFormat(puzzle.canonicalGrid);

  // Access theme paths directly
  const sharkPath = puzzle.canonicalGrid.themePaths['SHARK'];
  console.log(sharkPath.word, sharkPath.path, sharkPath.color);
}
```

## Testing

### Demo Route

The demo route at `/games/demo` uses mock data that includes both formats:

```typescript
// Mock data includes both for testing
export const MOCK_STRANDS_PUZZLE = {
  generatedGrid: { /* ... */ },  // Legacy format
  canonicalGrid: {                // New format
    cells: ['S', 'H', 'A', /* ... */],
    themePaths: { /* ... */ },
    metadata: { /* ... */ }
  }
};
```

### Validation

Run the dev server and test:

```bash
npm run dev
# Visit http://localhost:3003/games/demo
```

The game should:
- ✅ Load the grid correctly
- ✅ Validate canonical paths
- ✅ Show proper error messages for wrong paths
- ✅ Use hint words from both sources

## Backward Compatibility

### Reading Data

The `getGridData()` function handles all formats:

```typescript
export function getGridData(puzzle: SanityStrandsPuzzle) {
  // Try new format first
  if (puzzle.canonicalGrid) {
    return puzzle.canonicalGrid;
  }

  // Fall back to legacy format
  if (puzzle.generatedGrid) {
    return puzzle.generatedGrid;
  }

  // Default fallback
  return '';
}
```

### Canonical Paths

The `getCanonicalPaths()` function checks both sources:

```typescript
export function getCanonicalPaths(puzzle: SanityStrandsPuzzle) {
  // Try CanonicalGrid first
  if (isCanonicalGrid(puzzle.canonicalGrid)) {
    return extractPathsFromCanonicalGrid(puzzle.canonicalGrid);
  }

  // Fall back to JSON string in metadata
  if (puzzle.gridMetadata?.canonicalPaths) {
    return JSON.parse(puzzle.gridMetadata.canonicalPaths);
  }

  return undefined;
}
```

## Future Enhancements

### Planned Features

1. **Grid Preview Generation**
   - Pre-render grid images for thumbnails
   - Store in `CanonicalGrid.metadata.previewUrl`

2. **Color Consistency**
   - Colors stored with paths ensure consistent display
   - No need to recalculate on client

3. **Validation Improvements**
   - More efficient path validation
   - Pre-computed adjacency checks

4. **Analytics**
   - Track which paths players use
   - Identify commonly missed words

## Troubleshooting

### Issue: Grid not loading

**Check:**
- Does puzzle have either `generatedGrid` or `canonicalGrid`?
- Is the grid format valid?

**Solution:**
```typescript
const gridData = getGridData(puzzle);
console.log('Grid data:', gridData);
```

### Issue: Canonical paths not working

**Check:**
- Are paths defined in either format?
- Are paths valid adjacent sequences?

**Solution:**
```typescript
const paths = getCanonicalPaths(puzzle);
console.log('Canonical paths:', paths);
```

### Issue: Type errors

**Check:**
- Is `canonical-grid.types.ts` imported?
- Are utility functions used correctly?

**Solution:**
```typescript
import {getGridString, getCanonicalPaths} from '~/lib/games/grid-utils';
```

## Summary

✅ **Completed:**
- New type definitions
- Utility functions
- Backward compatibility
- Mock data updates
- Component updates

🔄 **In Progress:**
- Backend generation of `canonicalGrid`
- Sanity schema updates

📋 **Planned:**
- Full migration to new format
- Remove legacy code
- Enhanced features

## Related Files

- `app/lib/games/canonical-grid.types.ts` - Type definitions
- `app/lib/games/grid-utils.ts` - Utility functions
- `app/lib/games/strands.queries.ts` - Query types
- `app/components/games/game-locked-view.tsx` - Game component
- `app/components/games/strands-game.tsx` - Main game
- `GRID_DATA_STRUCTURE.md` - Original documentation
- `INTEGRATION_SUMMARY.md` - Integration guide
