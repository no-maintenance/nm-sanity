# Strands Word Puzzle Game - Complete Specification

## Table of Contents
1. [Game Overview](#game-overview)
2. [Grid Structure](#grid-structure)
3. [Word Types](#word-types)
4. [Interaction Patterns](#interaction-patterns)
5. [Word Validation](#word-validation)
6. [Scoring System](#scoring-system)
7. [Hint System](#hint-system)
8. [Visual States](#visual-states)
9. [Win Conditions](#win-conditions)
10. [Technical Architecture](#technical-architecture)

---

## Game Overview

Strands is a word-finding puzzle game where players discover theme-related words hidden in a 6×8 letter grid. Players form words by connecting adjacent letters (horizontally, vertically, or diagonally).

### Core Mechanics
- **Grid Size**: 6 columns × 8 rows (48 total letters)
- **Word Formation**: Connect adjacent letters to form words
- **Theme**: All puzzles have a specific theme with related words
- **Special Word**: One "spangram" word that spans opposite edges
- **Hint System**: Find non-theme words to earn hints

---

## Grid Structure

### Dimensions
```text
Columns: 6
Rows: 8
Total Cells: 48
```

### Adjacency Rules
Letters are considered adjacent if they touch:
- Horizontally (left/right)
- Vertically (up/down)
- Diagonally (8 directions total)

### Grid Format
Grid data is stored as either:
- **String**: 48-character string (sanitized, A-Z only)
- **Table**: Object with `rows` array containing `cells` arrays

```typescript
type GridData = string | {
  rows: Array<{
    cells: string[]
  }>
}
```

---

## Word Types

### 1. Theme Words
- **Count**: 5-8 words per puzzle
- **Behavior**: Each word can only be found once
- **Cells**: Remain selectable after being found (word-level locking, NOT cell-level)
- **Visual**: Each theme word gets a unique color (blue, green, yellow, pink, purple, orange, cyan, rose)
- **Validation**: Must match predefined theme word list

### 2. Spangram
- **Count**: Exactly 1 per puzzle
- **Special Rule**: Must span opposite edges of the grid (top-to-bottom OR left-to-right)
- **Behavior**: Also a theme word, but with bonus scoring
- **Visual**: Special amber/gold color (`bg-amber-300`)
- **Validation**: Same as theme word + edge-spanning check

### 3. Hint Words
- **Count**: Unlimited (any valid English word ≥4 letters)
- **Source**: Validated via Datamuse API
- **Behavior**: Can only be found once each
- **Requirement**: Must NOT be a theme word
- **Visual**: Gray background (`bg-gray-100`)
- **Purpose**: Finding 3 unique hint words grants 1 hint

---

## Interaction Patterns

### Click Mode (Primary)
Click individual letters to build words letter-by-letter.

#### Rules:
1. **First Click**: Start a new word
   ```text
   Click M → path = [M]
   ```

2. **Adjacent Click**: Append to current word
   ```text
   path = [M]
   Click E (adjacent to M) → path = [M, E]
   ```

3. **Same Letter Click**: Submit word
   ```text
   path = [M, E]
   Click E again → submits "ME"
   ```

4. **Previous Letter Click**: Backtrack
   ```text
   path = [M, E, T]
   Click E → path = [M, E]
   ```

5. **Non-Adjacent Click**: Reset and start new word
   ```text
   path = [M, E]
   Click T (non-adjacent) → path = [T]
   ```

6. **Click Outside Grid**: Reset word
   ```text
   path = [M, E]
   Click anywhere outside grid → path = []
   ```

### Drag Mode (Alternative)
Hold mouse button and drag through letters to build words.

#### Rules:
1. **Mouse Down**: Mark drag start cell
2. **Drag to Adjacent**: Build path continuously
3. **Drag to Previous Letter**: Truncate path (backtracking)
4. **Drag to Non-Adjacent**: Ignore (path unchanged)
5. **Mouse Up**: Submit word

#### Important:
- Dragging is ONLY active when mouse button is pressed (`isMouseDown = true`)
- Hovering while mouse is up does NOT add letters (prevents accidental word building)

### Keyboard Shortcuts
- **ESC**: Clear current selection
- **Enter**: ~~NOT USED~~ (only pointer-up submits)

---

## Word Validation

### Validation Flow
Words are validated using a multi-tier system:

```typescript
async function validateWord(
  word: string,
  themeWords: ThemeWord[],
  discoveredHintWords: Set<string>,
  validateEnglishWord: (word: string) => Promise<boolean>
): Promise<ValidationResult>
```

### 1. Theme Word Check
```typescript
if (word matches themeWords) {
  if (isSpangram && !spansOppositeEdges(path)) {
    return 'Spangram must span opposite edges!'
  }
  return { type: 'theme-word', isSpangram: boolean }
}
```

### 2. Hint Word Check
```typescript
if (word.length >= 4) {
  if (alreadyDiscovered) {
    return { type: 'already-found-hint-word' }
  }

  if (await validateEnglishWord(word)) {
    return {
      type: 'valid-hint-word',
      grantsHintProgress: true
    }
  }
}
```

### 3. Invalid Word
```typescript
if (word.length < 4) {
  return { type: 'too-short' }
}

return { type: 'not-a-word' }
```

### Datamuse API Integration
Validates English words using Datamuse API:
```typescript
async function validateEnglishWord(word: string): Promise<boolean> {
  const response = await fetch(
    `https://api.datamuse.com/words?sp=${word}&max=1`
  )
  const data = await response.json()
  return data.length > 0 && data[0].word.toLowerCase() === word.toLowerCase()
}
```

---

## Scoring System

### Points Per Word
- **Regular Theme Word**: `pointsPerWord` (default: 100)
- **Spangram**: `pointsPerWord + spangramBonus` (default: 100 + 200 = 300)
- **Hint Words**: 0 points (only grant hint progress)

### Configuration
```typescript
interface Scoring {
  pointsPerWord: number    // Default: 100
  spangramBonus: number    // Default: 200
}
```

### Total Score Calculation
```typescript
totalScore =
  (regularThemeWords × pointsPerWord) +
  (spangram × (pointsPerWord + spangramBonus))
```

---

## Hint System

### Earning Hints
- Find **3 unique valid hint words** → Earn **1 hint**
- Counter resets to 0 after granting a hint
- Hint words must be:
  - ≥4 letters
  - Valid English words (Datamuse API)
  - NOT theme words
  - Not previously discovered

### Using Hints
- Reveals the name of a random unfound theme word
- Deducts 1 from `availableHints` counter
- Deducts 3 from `hintWordCount` (can go negative)
- No visual highlighting of word location (name only)

### State Tracking
```typescript
interface GameState {
  hintWordCount: number           // 0-2, resets to 0 at 3
  availableHints: number          // Total hints available
  discoveredHintWords: string[]   // All found hint words
}
```

---

## Visual States

### Cell States

#### 1. Unused Cell
```css
background: bg-white/5 (semi-transparent white)
cursor: pointer
```

#### 2. Selected Cell (Current Path)
```css
background: (base color if found, else bg-white/5)
ring: ring-4 ring-purple-400 (purple ring)
transform: scale-105 (slight enlarge)
cursor: pointer
```

#### 3. Last Selected Cell
```css
(all of "Selected Cell" above, plus:)
outer-ring: ring-2 ring-purple-600 (thicker purple ring)
size: 52px × 52px (absolute positioned)
```

#### 4. Found Theme Word Cell
```css
background: bg-blue-200 | bg-green-200 | bg-yellow-200 | ...
(unique color per word, rotates through palette)
cursor: pointer (still selectable!)
```

#### 5. Found Spangram Cell
```css
background: bg-amber-300 (special gold/amber)
cursor: pointer (still selectable!)
```

#### 6. Found Hint Word Cell
```css
background: bg-gray-100 (gray overlay)
opacity: 40% (if multiple words overlap)
cursor: pointer (still selectable!)
```

#### 7. Multi-Word Cell
When a cell belongs to multiple found words:
```css
base: first color as background
overlays: additional colors as semi-transparent overlays
  - clipPath creates vertical stripes
  - opacity: 40%
```

### Color Palette
```typescript
const THEME_COLORS = [
  'bg-blue-200',
  'bg-green-200',
  'bg-yellow-200',
  'bg-pink-200',
  'bg-purple-200',
  'bg-orange-200',
  'bg-cyan-200',
  'bg-rose-200',
]

const SPANGRAM_COLOR = 'bg-amber-300'
const HINT_COLOR = 'bg-gray-100'
```

### Layout Anti-CLS
Current word display uses fixed height to prevent Cumulative Layout Shift:
```css
.word-display {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Win Conditions

### Primary Win Condition
```typescript
allThemeWordsFound = themeWords.every(word =>
  foundWords.includes(word.toUpperCase())
)
```

### Time Limit (Optional)
Puzzles can have an optional time limit:
```typescript
if (timeLimit > 0 && timeElapsed >= timeLimit * 60) {
  // Game over (time's up)
  isComplete = true
  lastError = 'Time limit reached!'
}
```

### Completion Actions
1. Stop timer
2. Clear localStorage saved state
3. Show `GameComplete` modal with:
   - Total score
   - Time elapsed
   - Found words list
   - Whether hints were used

---

## Technical Architecture

### Component Hierarchy
```text
StrandsGame (parent)
  └─ GameLockedView (active implementation)
      ├─ Grid (6×8 letter buttons)
      ├─ Word Display (current selection)
      ├─ Header (help, lock icons, CTA)
      ├─ Countdown Banner
      └─ Footer (hint button, progress)
```

### State Management

#### Selection State
```typescript
currentPath: number[]           // Indices of selected cells [0-47]
isDragging: boolean             // True during drag operation
isMouseDown: boolean            // True while mouse button pressed
dragStartCell: number | null    // Index where drag started
```

#### Game State
```typescript
foundWords: Set<string>                  // All found theme words
cellColors: {[index: number]: string[]}  // Colors per cell (multiple allowed)
hintsEarned: number                      // Available hints
discoveredHintWords: string[]            // All found hint words
```

### Key Functions

#### Word Validation
```typescript
validateWord(
  word: string,
  themeWords: ThemeWord[],
  discoveredHintWords: Set<string>,
  validateEnglishWord: (word: string) => Promise<boolean>
): Promise<ValidationResult>
```

#### Path Validation
```typescript
areAdjacent(index1: number, index2: number): boolean
isValidPath(path: number[]): boolean
spansOppositeEdges(path: number[]): boolean
```

#### Grid Utilities
```typescript
indexToPosition(index: number): {row: number, col: number}
positionToIndex(pos: Position): number
getWordFromPath(grid: GridData, path: number[]): string
gridToString(grid: GridData): string
```

### Data Persistence

#### Local Storage
```typescript
// Save game state
localStorage.setItem(`strands-${puzzleId}`, JSON.stringify({
  foundWords,
  hintWordCount,
  availableHints,
  score,
  discoveredHintWords
}))

// Load on mount
const savedState = localStorage.getItem(`strands-${puzzleId}`)

// Clear on completion
localStorage.removeItem(`strands-${puzzleId}`)
```

### Props Interface

#### GameLockedView Props
```typescript
interface GameLockedViewProps {
  theme?: string                    // Puzzle theme/title
  countdown?: string                // Timer display
  gridLetters?: string[]            // 48 letters
  themeWords?: ThemeWord[]          // Theme word list
  hintWords?: HintWord[]            // Valid hint words
  onJoinEarlyAccess?: () => void    // CTA button handler
  onHelpClick?: () => void          // Help icon handler
}
```

#### Theme Word Structure
```typescript
interface ThemeWord {
  word: string        // The word text
  isSpangram: boolean // Whether it's the spangram
  color: string       // Assigned color (auto-generated)
}
```

---

## Design Philosophy

### Word-Level vs Cell-Level Locking

**Key Decision**: Words lock, cells DON'T

This differs from NYT Strands but provides better gameplay:

✅ **Advantages:**
- Encourages exploration and discovery
- Cells can be reused for hint words
- Richer visual feedback (overlapping colors)
- More paths to find words

❌ **NYT Approach (Cell-Level):**
- Found cells become unselectable
- Limits available letters
- Simpler implementation
- More constrained puzzle design

### Silent Feedback
- Invalid words fail silently (no error messages)
- Only visual feedback through cell colors
- Matches NYT aesthetic and reduces UI clutter
- Exception: Validation errors for game rules (e.g., "Spangram must span opposite edges")

### Interaction Consistency
- Click and drag modes work independently
- No interference between modes
- Hover-only (without mouse down) never adds letters
- ESC always clears, regardless of mode

---

## Future Enhancements

### Planned Features
- [ ] Animations on word found (color fade-in)
- [ ] Shake animation on invalid submission
- [ ] Victory modal with stats
- [ ] Daily puzzle system
- [ ] Leaderboard integration
- [ ] Sound effects (optional)
- [ ] Accessibility improvements (screen reader support)
- [ ] Tutorial/onboarding flow

### Configuration Options
```typescript
interface PuzzleConfig {
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number | null          // Minutes, null = unlimited
  allowHints: boolean               // Enable/disable hints
  minWordLength: number             // Minimum hint word length
  hintWordsRequired: number         // Words needed per hint
  customScoringRules: Scoring       // Override default scoring
}
```

---

## Version History

- **v1.0** - Initial implementation with basic word finding
- **v1.1** - Added word-level locking
- **v1.2** - Implemented click-by-click interaction
- **v1.3** - Fixed hover triggering during clicks
- **v1.4** - Added Datamuse API validation
- **v1.5** - Enhanced multi-color cell rendering
- **Current** - All core features complete

---

## References

- **Datamuse API**: https://www.datamuse.com/api/
- **NYT Strands**: https://www.nytimes.com/games/strands
- **Component Files**:
  - `app/components/games/game-locked-view.tsx`
  - `app/components/games/strands-game.client.tsx`
  - `app/lib/games/strands-logic.ts`
  - `app/lib/games/datamuse.ts`
