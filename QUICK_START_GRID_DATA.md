# Quick Start: Grid Data Structure

## 🚀 Get Started in 3 Steps

### 1. Start the Dev Server

```bash
npm run dev
```

The server will start on `http://localhost:3003` (or another port if 3003 is busy).

### 2. Visit the Demo

Open your browser to:

```text
http://localhost:3003/games/demo
```

You'll see the **Ocean Life** puzzle with:
- 6 theme words to find (DOLPHIN, SHARK, WHALE, SEAWEED, CORAL, STARFISH)
- 18 hint words available
- Full canonical path validation

### 3. Enable Debug Mode

Click **"Show Debug Info"** button in the bottom-right corner to see:
- ✅ Grid visualization with canonical paths highlighted
- ✅ Word paths and cell indices
- ✅ Theme words and hint words
- ✅ Metadata inspection

## 🎮 How to Play

### Finding Words

1. **Click letters** to form a word (adjacent cells only)
2. **Click the last letter again** to submit
3. **Click outside grid** to reset

### Word Types

- 🎯 **Theme Words** - Match the puzzle theme (6 words)
  - Each has a **canonical path** (intended letter route)
  - Wrong path = "You used the wrong path!" message

- 💡 **Hint Words** - Valid English words (≥4 letters)
  - Find 3 hint words → Earn 1 hint
  - Pre-validated for fast checking

- ⭐ **Spangram** - Special theme word that spans opposite edges
  - Worth bonus points
  - Must touch top↔bottom OR left↔right edges

## 📊 Data Structure Overview

### Grid Format

```typescript
generatedGrid: {
  rows: [                               // 8 rows
    {cells: ['S', 'H', 'A', 'R', 'K', 'W']},  // 6 cells each
    {cells: ['E', 'D', 'O', 'L', 'P', 'H']},
    // ... 6 more rows
  ]
}
```

### Canonical Paths

```typescript
gridMetadata: {
  canonicalPaths: JSON.stringify({
    'SHARK': [0, 1, 2, 3, 4],           // Cell indices forming the word
    'DOLPHIN': [7, 2, 3, 9, 10, 14, 17],  // Spangram path
    // ... paths for all theme words
  })
}
```

## 🎯 Example: Finding SHARK

1. **Click cells in order**: S(0) → H(1) → A(2) → R(3) → K(4)
2. **Click K again** to submit
3. ✅ Word accepted! (canonical path matches)

### Wrong Path Example

If you try: S(0) → H(7) → A(2) → R(3) → K(4)
- ❌ "SHARK is correct, but you used the wrong path!"
- The word exists, but you must use the canonical route

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/lib/games/mock-puzzle-data.ts` | Mock puzzles with complete data |
| `app/routes/($locale).games.demo.tsx` | Demo route (`/games/demo`) |
| `app/components/games/puzzle-debug-info.tsx` | Debug visualization component |
| `GRID_DATA_STRUCTURE.md` | Complete technical documentation |
| `INTEGRATION_SUMMARY.md` | Full integration overview |

## 🧪 Testing

### Try These Words

**Theme Words** (use canonical paths!):
- DOLPHIN (spangram)
- SHARK
- WHALE
- SEAWEED
- CORAL
- STARFISH

**Hint Words**:
- HALE
- WALE
- ORCA
- STAR
- FISH
- HEAL

### Experiment

1. Try finding a theme word using a different path
2. Find 3 hint words to earn a hint
3. Use the debug component to see canonical paths
4. Click cells that aren't adjacent (path resets)

## 🔍 Understanding Cell Indices

Grid uses **row-major order** (0-47):

```text
     Col:  0   1   2   3   4   5
Row 0:    [0   1   2   3   4   5 ]
Row 1:    [6   7   8   9  10  11]
Row 2:    [12 13  14  15  16  17]
Row 3:    [18 19  20  21  22  23]
Row 4:    [24 25  26  27  28  29]
Row 5:    [30 31  32  33  34  35]
Row 6:    [36 37  38  39  40  41]
Row 7:    [42 43  44  45  46  47]
```

**Example**: Cell at Row 3, Col 2 = Index **20**
- Formula: `index = row * 6 + col`
- Formula: `20 = 3 * 6 + 2`

## 🎨 Debug Component Features

### Grid Visualization
- **Green cells** = Part of canonical paths
- **White cells** = Not in any path
- Hover over cells to see which words use them

### Path Visualization
Each theme word shows:
- Full path: `S(0) → H(1) → A(2) → R(3) → K(4)`
- Cell indices: `[0, 1, 2, 3, 4]`
- Word properties (spangram status, length)

### Metadata
- Generation timestamp
- Algorithm version
- Hint word count
- Canonical paths status

## 🛠️ Creating Your Own Puzzles

### Option 1: Use Mock Data Template

Edit `app/lib/games/mock-puzzle-data.ts`:

```typescript
export const MY_CUSTOM_PUZZLE: SanityStrandsPuzzle = {
  _id: 'my-puzzle',
  title: 'My Puzzle #1',
  themeWords: [
    {word: 'YOURWORD', isSpangram: true},
    // ... more words (total 48 characters)
  ],
  generatedGrid: {
    rows: [
      {cells: ['Y', 'O', 'U', 'R', 'W', 'O']},
      // ... 7 more rows (8 total)
    ]
  },
  gridMetadata: {
    canonicalPaths: JSON.stringify({
      'YOURWORD': [0, 1, 2, 3, 4, 5],  // Your paths here
    })
  },
  // ... rest of config
};
```

### Option 2: Use Grid Generator

```typescript
import {generateStrandsGrid} from '~/lib/games/grid-generator';

const result = await generateStrandsGrid({
  themeWords: [
    {word: 'YOURWORD', isSpangram: true},
    // ... more words
  ],
  ensureHints: true,
  minHintWords: 15
});

// result.grid - Generated grid string
// result.canonicalPaths - Auto-generated paths
```

## 💡 Tips

1. **Always use debug mode** during development
2. **Canonical paths are strict** - exact cell sequence required
3. **Adjacent means** horizontally, vertically, or diagonally touching
4. **Theme words total** must equal 48 characters
5. **Spangram must be** at least 6 characters long

## 📚 Learn More

- **Full Documentation**: `GRID_DATA_STRUCTURE.md`
- **Integration Details**: `INTEGRATION_SUMMARY.md`
- **Game Specification**: `STRANDS_GAME_SPEC.md`
- **Migration Guide**: `CANONICAL_PATHS_MIGRATION.md`

## ❓ Common Questions

### Q: Why canonical paths?
**A**: Ensures each word has one intended solution path, preventing alternative routes that could leave orphaned letters.

### Q: Can I test without Sanity?
**A**: Yes! Use `/games/demo` with mock data.

### Q: How do I know if my paths are correct?
**A**: Use the debug component to visualize all paths and validate cell indices.

### Q: What if validation fails?
**A**: Check that:
- Path uses adjacent cells only
- Path matches canonical path exactly
- Word is normalized (uppercase, no special characters)
- Word length ≥ 4 characters

## 🎉 Ready to Go!

You now have:
- ✅ Working demo at `/games/demo`
- ✅ Debug tools for development
- ✅ Complete data structure
- ✅ Example puzzles
- ✅ Full documentation

**Start playing**: `http://localhost:3003/games/demo`

Happy puzzling! 🧩
