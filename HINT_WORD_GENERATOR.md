# Hint Word Generator

Automated tool for discovering all valid English words in a Strands game grid. Useful for testing grid quality, understanding player experience, and pre-populating hint word lists.

## Overview

The Hint Word Generator explores all possible paths through the grid and validates each potential word against the dictionary (using the same multi-tier caching system as the game). It provides comprehensive analysis of grid quality and word availability.

## Features

- ✅ **Exhaustive Search**: Finds all possible words using depth-first search
- ✅ **Dictionary Validation**: Uses Datamuse API with multi-tier caching
- ✅ **Performance Optimized**: 90%+ cache hit rate reduces API calls
- ✅ **Grid Quality Metrics**: Analyzes word distribution and uniqueness
- ✅ **Multiple Interfaces**: CLI script, Sanity Studio button, or programmatic API
- ✅ **Smart Filtering**: Excludes theme words, configurable length limits
- ✅ **Top Word Selection**: Identifies best words for hints based on findability

## How It Works

### Algorithm

```bash
1. Start from each cell in the grid (48 starting points)
2. For each starting cell:
   a. Explore all adjacent paths (DFS)
   b. Extract word from each path
   c. Validate word against dictionary
   d. Track unique words and their paths
3. Organize results by length and difficulty
4. Calculate grid quality metrics
```

### Performance

- **Typical grid**: 50-200 valid words found
- **Processing time**: 2-10 seconds (depends on cache state)
- **API calls**: 5-20 (most words cached)
- **Cache hit rate**: 90-95%

## Usage

### Option 1: Sanity Studio (Recommended)

**Steps:**
1. Open a Strands puzzle in Sanity Studio
2. Generate a grid using the grid generator
3. Scroll down to "🔍 Analyze Hint Words" section
4. Click "Analyze Grid" button
5. Wait 2-10 seconds for analysis
6. View results:
   - Total words found
   - Words by length (4, 5, 6+ letters)
   - Top 20 recommended hint words
   - Complete word list
7. Click "Copy Top 20" or "Copy All Words"

**Location:** Appears after grid generation, before "Grid is Finalized"

**Features:**
- Visual progress indicator
- Comprehensive results display
- One-click copy to clipboard
- Grid quality assessment
- Cache statistics

### Option 2: CLI Script

**Basic Usage:**
```bash
# Analyze a grid
npx tsx scripts/generate-hint-words.ts --grid "STARABLECAREFASTLATEMADENAMEOPEN..."

# With theme words excluded
npx tsx scripts/generate-hint-words.ts \
  --grid "STARABLECARE..." \
  --theme-words "BASEBALL,SOFTBALL,TENNIS"

# Save to JSON file
npx tsx scripts/generate-hint-words.ts \
  --grid "STARABLECARE..." \
  --output results.json \
  --format json

# Get top 20 hint words only
npx tsx scripts/generate-hint-words.ts \
  --grid "STARABLECARE..." \
  --format top20
```

**Options:**
```text
--grid <string>          Grid letters (48 characters)
--theme-words <words>    Comma-separated theme words to exclude
--min-length <number>    Minimum word length (default: 4)
--max-length <number>    Maximum word length (default: 15)
--max-words <number>     Maximum words to find (default: 500)
--include-3-letter       Include 3-letter words
--format <type>          Output format: text, json, sanity, top20
--output <file>          Save results to file
--help, -h               Show help
```

**Output Formats:**

**text** (default):
```text
=== HINT WORD ANALYSIS ===

Total Words Found: 87
Processing Time: 3245ms

Grid Quality:
  4-letter words: 42
  5-letter words: 28
  6+ letter words: 17
  Unique letters: 18
  Avg word length: 4.8

Performance:
  Paths explored: 1247
  Duplicates skipped: 423
  Invalid words: 89
  API calls: 12
  Cache hits: 75
  Cache hit rate: 86%

Words by Length:
  4 letters (42 words):
    ABLE, BEAR, CARE, DARE, EAST, ...
  5 letters (28 words):
    STARE, CARES, FABLE, LATER, ...
```

**json**:
```json
{
  "totalWordsFound": 87,
  "wordsByLength": {...},
  "allWords": [...],
  "gridQuality": {...},
  "processingStats": {...}
}
```

**sanity**:
```json
{
  "words": [
    {"word": "ABLE", "difficulty": "easy"},
    {"word": "STARE", "difficulty": "medium"},
    ...
  ],
  "metadata": {
    "generatedAt": "2025-01-12T10:30:00Z",
    "totalWords": 87,
    "gridQuality": {...}
  }
}
```

**top20**:
```json
{
  "words": ["ABLE", "BEAR", "CARE", "STAR", ...],
  "count": 20
}
```

### Option 3: Programmatic API

```typescript
import {generateHintWords, getTopHintWords} from '~/lib/games/hint-word-generator';

// Basic usage
const result = await generateHintWords(
  grid,                    // GridData (string or table format)
  ['BASEBALL', 'TENNIS'],  // Theme words to exclude
  {
    minLength: 4,
    maxLength: 12,
    maxWords: 300,
    includeThreeLetters: false,
    progressCallback: (progress) => {
      console.log(`Found ${progress.current} words...`);
    },
  }
);

// Get top hint words
const topWords = getTopHintWords(result, 20);

// Access results
console.log(`Found ${result.totalWordsFound} words`);
console.log(`4-letter words: ${result.gridQuality.fourLetterWords}`);
console.log(`Processing time: ${result.processingStats.duration}ms`);
```

## Understanding Results

### Grid Quality Metrics

**fourLetterWords**: Number of 4-letter words found
- **Good**: 30-50 words
- **Excellent**: 50+ words
- **Poor**: < 20 words

**fiveLetterWords**: Number of 5-letter words
- **Good**: 15-30 words
- **Excellent**: 30+ words

**sixPlusLetterWords**: Number of 6+ letter words
- **Good**: 10-20 words
- **Excellent**: 20+ words

**uniqueLetters**: Number of different letters in grid
- **Good**: 16-20 letters
- **Excellent**: 20+ letters
- **Poor**: < 15 letters (limited word variety)

**averageWordLength**: Mean length of all found words
- **Good**: 4.5-5.5 letters
- **Too Easy**: < 4.5 letters
- **Too Hard**: > 5.5 letters

### Processing Stats

**pathsExplored**: Total unique paths checked
- Typical: 500-2000 paths
- Depends on grid complexity

**duplicatesSkipped**: Words found multiple times via different paths
- High number = words are easy to find (good!)

**invalidWords**: Words that failed dictionary validation
- High number = unusual letter combinations

**apiCalls**: Number of Datamuse API requests
- Low number = good cache performance
- Typical: 5-20 calls for a new grid

**cacheHits**: Words validated from cache
- High number = performance is good
- Typical: 70-90% of validations

**duration**: Total processing time in milliseconds
- Fast: < 3000ms
- Typical: 3000-6000ms
- Slow: > 6000ms (may need optimization)

### Word Difficulty Classification

Words are automatically classified by difficulty:

**Easy** (4-5 letters):
- Short, common words
- Easy to spot in grid
- Good for beginner hints

**Medium** (6-7 letters):
- Moderate length
- Require some searching
- Good for mid-game hints

**Hard** (8+ letters):
- Long words
- Challenging to find
- Better for advanced players

## Examples

### Example 1: Testing a New Grid

```bash
# Generate and analyze a grid
npx tsx scripts/generate-hint-words.ts \
  --grid "STARABLECAREFASTLATEMADENAMEOPEN..." \
  --theme-words "STAR,CARE,LATE,NAME" \
  --format text

# Output shows:
# - 87 words found
# - Good distribution (42 four-letter, 28 five-letter)
# - High cache hit rate (86%)
# ✅ Grid quality is good!
```

### Example 2: Pre-populating Hint Words for Sanity

```bash
# Get top 20 words for hints
npx tsx scripts/generate-hint-words.ts \
  --grid "..." \
  --theme-words "BASEBALL,SOFTBALL" \
  --format top20 \
  --output hint-words.json

# Copy the words array and paste into Sanity
cat hint-words.json
# {"words": ["ABLE", "BEAR", "CARE", ...], "count": 20}
```

### Example 3: Finding All Possible Words

```bash
# Find maximum words (including 3-letter)
npx tsx scripts/generate-hint-words.ts \
  --grid "..." \
  --include-3-letter \
  --max-words 1000 \
  --max-length 20 \
  --output complete-analysis.json

# Useful for:
# - Comprehensive grid testing
# - Finding Easter eggs
# - Player experience research
```

## Integration with Sanity Studio

The Hint Word Analyzer appears as a custom field in the Strands Puzzle editor.

**Location:**
- Puzzle tab
- After "Grid is Finalized" checkbox
- Before "Grid Generation Info"
- Only visible when a grid exists

**Features:**
- ✅ One-click analysis
- ✅ Real-time progress indicator
- ✅ Comprehensive results display
- ✅ Copy to clipboard buttons
- ✅ Grid quality assessment
- ✅ Performance statistics

**Workflow:**
1. Create puzzle with theme words
2. Generate grid
3. Click "Analyze Grid"
4. Review word list and quality metrics
5. Copy top words if needed
6. Make adjustments to theme words/grid if quality is poor
7. Re-generate and re-analyze
8. Lock grid when satisfied

## Best Practices

### Grid Design

**✅ Do:**
- Aim for 30-50 four-letter words minimum
- Include variety (4, 5, 6+ letter words)
- Use 18-22 unique letters
- Test with analyzer before locking grid
- Verify theme words are findable

**❌ Don't:**
- Lock grid without analyzing
- Use grids with < 20 four-letter words
- Over-optimize (some randomness is good)
- Include obscure words as theme words

### Performance

**✅ Do:**
- Run analysis once per grid
- Use caching (automatic)
- Set reasonable `maxWords` limit (500)
- Use `progressCallback` for long operations

**❌ Don't:**
- Run analysis repeatedly (cache makes subsequent runs fast anyway)
- Set `maxWords` too high (> 1000)
- Include 3-letter words unless needed (slower)

### Testing

**✅ Do:**
- Analyze every grid before publishing
- Check grid quality metrics
- Verify 40+ total words
- Test player experience

**❌ Don't:**
- Skip analysis step
- Publish grids with poor metrics
- Ignore "Poor" quality warnings

## Troubleshooting

### "Not enough words found"

**Cause**: Grid has limited word combinations

**Solutions:**
- Re-generate grid with different settings
- Add more varied theme words
- Check for unusual letter combinations

### "Processing is slow"

**Cause**: Many API calls, low cache hit rate

**Solutions:**
- Run again (cache will improve)
- Reduce `maxWords` limit
- Check internet connection

### "API calls too high"

**Cause**: New session, empty cache

**Solutions:**
- Normal for first run
- Subsequent runs will be much faster
- Cache persists across sessions

### "Words seem invalid"

**Cause**: Datamuse API variations

**Solutions:**
- Check word manually
- Some British vs American spellings
- Acronyms may be included

## API Reference

### `generateHintWords()`

```typescript
async function generateHintWords(
  grid: GridData,
  themeWords?: string[],
  options?: {
    minLength?: number;        // Default: 4
    maxLength?: number;        // Default: 15
    maxWords?: number;         // Default: 500
    includeThreeLetters?: boolean;  // Default: false
    progressCallback?: (progress: {
      current: number;
      total: number;
      word?: string;
    }) => void;
  }
): Promise<GridAnalysisResult>
```

### `getTopHintWords()`

```typescript
function getTopHintWords(
  result: GridAnalysisResult,
  count: number = 20
): HintWordResult[]
```

Selects best words for hints based on:
- Length (4-5 letters preferred)
- Commonality (word bank words scored higher)
- Difficulty (easy words preferred)

### `formatHintWordSummary()`

```typescript
function formatHintWordSummary(
  result: GridAnalysisResult
): string
```

Formats results as human-readable text summary.

### `exportForSanity()`

```typescript
function exportForSanity(
  result: GridAnalysisResult
): {
  words: Array<{word: string; difficulty: string}>;
  metadata: {...};
}
```

Formats results for direct import into Sanity.

## Files

```text
app/lib/games/
├── hint-word-generator.ts          # Core generator logic
├── datamuse.ts                     # Dictionary validation with caching
└── word-bank.ts                    # 2000+ common words

scripts/
└── generate-hint-words.ts          # CLI interface

app/sanity/
├── components/
│   └── generate-hint-words-button.tsx  # Sanity Studio UI
└── schema/
    └── objects/games/
        └── hint-word-analyzer.ts   # Schema definition
```

## Summary

The Hint Word Generator provides powerful grid analysis capabilities with multiple interfaces:

- 🎨 **Sanity Studio**: Visual, one-click analysis
- 💻 **CLI**: Scripting and automation
- 🔧 **API**: Programmatic integration

All methods use the same optimized engine with multi-tier caching for fast, efficient word discovery.

Perfect for:
- ✅ Testing grid quality before publishing
- ✅ Understanding player experience
- ✅ Pre-populating hint word lists
- ✅ Finding optimal grid configurations
- ✅ Debugging word discovery issues
