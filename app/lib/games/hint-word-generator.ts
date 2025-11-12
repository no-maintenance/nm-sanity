/**
 * Hint Word Generator
 * Discovers all possible valid English words in a Strands grid
 * Useful for testing grid quality and pre-populating hint words
 */

import {validateEnglishWord} from './datamuse';
import {gridToString, areAdjacent, getNeighbors} from './strands-logic';
import type {GridData} from './strands-logic';

export interface HintWordResult {
  word: string;
  length: number;
  path: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'memory' | 'localStorage' | 'wordBank' | 'api';
}

export interface GridAnalysisResult {
  totalWordsFound: number;
  wordsByLength: Map<number, HintWordResult[]>;
  allWords: HintWordResult[];
  gridQuality: {
    fourLetterWords: number;
    fiveLetterWords: number;
    sixPlusLetterWords: number;
    uniqueLetters: number;
    averageWordLength: number;
  };
  processingStats: {
    pathsExplored: number;
    duplicatesSkipped: number;
    invalidWords: number;
    apiCalls: number;
    cacheHits: number;
    duration: number;
  };
}

/**
 * Generate all valid hint words from a grid
 * @param grid - The game grid (string or table format)
 * @param themeWords - Theme words to exclude from results
 * @param options - Configuration options
 */
export async function generateHintWords(
  grid: GridData,
  themeWords: string[] = [],
  options: {
    minLength?: number;
    maxLength?: number;
    maxWords?: number;
    includeThreeLetters?: boolean;
    progressCallback?: (progress: {current: number; total: number; word?: string}) => void;
  } = {}
): Promise<GridAnalysisResult> {
  const startTime = Date.now();

  const {
    minLength = 4,
    maxLength = 15,
    maxWords = 500,
    includeThreeLetters = false,
    progressCallback,
  } = options;

  const gridString = gridToString(grid);
  const gridLetters = gridString.split('');

  // Normalize theme words
  const themeWordsUpper = new Set(themeWords.map(w => w.toUpperCase()));

  // Track found words and paths
  const foundWords = new Map<string, HintWordResult>();
  const processedPaths = new Set<string>();

  // Stats
  let pathsExplored = 0;
  let duplicatesSkipped = 0;
  let invalidWords = 0;
  let apiCalls = 0;
  let cacheHits = 0;

  // DFS to explore all paths
  async function explorePath(
    currentPath: number[],
    visited: Set<number>
  ): Promise<void> {
    // Get current word
    const word = currentPath.map(i => gridLetters[i]).join('').toUpperCase();

    // Check if we should validate this word
    if (word.length >= (includeThreeLetters ? 3 : minLength) && word.length <= maxLength) {
      // Create path signature for deduplication
      const pathSignature = currentPath.slice().sort().join(',');

      if (!processedPaths.has(pathSignature) && !foundWords.has(word)) {
        processedPaths.add(pathSignature);
        pathsExplored++;

        // Skip theme words
        if (themeWordsUpper.has(word)) {
          duplicatesSkipped++;
        } else {
          // Validate with dictionary
          const validation = await validateEnglishWord(word);

          // Track API vs cache
          if (validation.source === 'api') {
            apiCalls++;
          } else if (validation.source) {
            cacheHits++;
          }

          if (validation.isValid) {
            // Determine difficulty based on length and rarity
            let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
            if (word.length <= 5) {
              difficulty = 'easy';
            } else if (word.length >= 8) {
              difficulty = 'hard';
            }

            foundWords.set(word, {
              word,
              length: word.length,
              path: [...currentPath],
              difficulty,
              source: validation.source || 'api',
            });

            // Progress callback
            if (progressCallback) {
              progressCallback({
                current: foundWords.size,
                total: maxWords,
                word,
              });
            }

            // Stop if we've found enough words
            if (foundWords.size >= maxWords) {
              return;
            }
          } else {
            invalidWords++;
          }
        }
      } else {
        duplicatesSkipped++;
      }
    }

    // Continue exploring if path is not too long
    if (currentPath.length < maxLength && foundWords.size < maxWords) {
      const lastIndex = currentPath[currentPath.length - 1];
      const neighbors = getNeighbors(lastIndex);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const newVisited = new Set(visited);
          newVisited.add(neighbor);
          await explorePath([...currentPath, neighbor], newVisited);

          // Early exit if we've found enough
          if (foundWords.size >= maxWords) {
            return;
          }
        }
      }
    }
  }

  // Start exploration from each cell
  for (let startIndex = 0; startIndex < 48; startIndex++) {
    const visited = new Set<number>([startIndex]);
    await explorePath([startIndex], visited);

    // Early exit if we've found enough
    if (foundWords.size >= maxWords) {
      break;
    }
  }

  // Organize results
  const allWords = Array.from(foundWords.values()).sort((a, b) => {
    // Sort by length first, then alphabetically
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    return a.word.localeCompare(b.word);
  });

  const wordsByLength = new Map<number, HintWordResult[]>();
  allWords.forEach(result => {
    if (!wordsByLength.has(result.length)) {
      wordsByLength.set(result.length, []);
    }
    wordsByLength.get(result.length)!.push(result);
  });

  // Calculate grid quality metrics
  const fourLetterWords = allWords.filter(w => w.length === 4).length;
  const fiveLetterWords = allWords.filter(w => w.length === 5).length;
  const sixPlusLetterWords = allWords.filter(w => w.length >= 6).length;
  const uniqueLetters = new Set(gridString).size;
  const averageWordLength = allWords.length > 0
    ? allWords.reduce((sum, w) => sum + w.length, 0) / allWords.length
    : 0;

  const duration = Date.now() - startTime;

  return {
    totalWordsFound: allWords.length,
    wordsByLength,
    allWords,
    gridQuality: {
      fourLetterWords,
      fiveLetterWords,
      sixPlusLetterWords,
      uniqueLetters,
      averageWordLength: Math.round(averageWordLength * 10) / 10,
    },
    processingStats: {
      pathsExplored,
      duplicatesSkipped,
      invalidWords,
      apiCalls,
      cacheHits,
      duration,
    },
  };
}

/**
 * Format results as a readable text summary
 */
export function formatHintWordSummary(result: GridAnalysisResult): string {
  const lines: string[] = [];

  lines.push('=== HINT WORD ANALYSIS ===\n');

  // Summary
  lines.push(`Total Words Found: ${result.totalWordsFound}`);
  lines.push(`Processing Time: ${result.processingStats.duration}ms`);
  lines.push('');

  // Grid Quality
  lines.push('Grid Quality:');
  lines.push(`  4-letter words: ${result.gridQuality.fourLetterWords}`);
  lines.push(`  5-letter words: ${result.gridQuality.fiveLetterWords}`);
  lines.push(`  6+ letter words: ${result.gridQuality.sixPlusLetterWords}`);
  lines.push(`  Unique letters: ${result.gridQuality.uniqueLetters}`);
  lines.push(`  Avg word length: ${result.gridQuality.averageWordLength}`);
  lines.push('');

  // Performance Stats
  lines.push('Performance:');
  lines.push(`  Paths explored: ${result.processingStats.pathsExplored}`);
  lines.push(`  Duplicates skipped: ${result.processingStats.duplicatesSkipped}`);
  lines.push(`  Invalid words: ${result.processingStats.invalidWords}`);
  lines.push(`  API calls: ${result.processingStats.apiCalls}`);
  lines.push(`  Cache hits: ${result.processingStats.cacheHits}`);
  lines.push(`  Cache hit rate: ${Math.round((result.processingStats.cacheHits / (result.processingStats.apiCalls + result.processingStats.cacheHits)) * 100)}%`);
  lines.push('');

  // Words by length
  lines.push('Words by Length:');
  const sortedLengths = Array.from(result.wordsByLength.keys()).sort((a, b) => a - b);
  sortedLengths.forEach(length => {
    const words = result.wordsByLength.get(length)!;
    lines.push(`  ${length} letters (${words.length} words):`);
    lines.push(`    ${words.map(w => w.word).join(', ')}`);
  });

  return lines.join('\n');
}

/**
 * Export results as JSON for Sanity
 */
export function exportForSanity(result: GridAnalysisResult): {
  words: Array<{word: string; difficulty: string}>;
  metadata: {
    generatedAt: string;
    totalWords: number;
    gridQuality: typeof result.gridQuality;
  };
} {
  return {
    words: result.allWords.map(w => ({
      word: w.word,
      difficulty: w.difficulty,
    })),
    metadata: {
      generatedAt: new Date().toISOString(),
      totalWords: result.totalWordsFound,
      gridQuality: result.gridQuality,
    },
  };
}

/**
 * Get top N hint words (best for hints)
 */
export function getTopHintWords(
  result: GridAnalysisResult,
  count: number = 20
): HintWordResult[] {
  // Prioritize 4-5 letter words (easier to find)
  const scored = result.allWords.map(word => ({
    word,
    score:
      (word.length === 4 ? 10 : 0) +
      (word.length === 5 ? 8 : 0) +
      (word.length === 6 ? 5 : 0) +
      (word.source === 'wordBank' ? 5 : 0) + // Common words are better
      (word.difficulty === 'easy' ? 3 : 0),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => s.word);
}
