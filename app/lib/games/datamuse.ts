/**
 * Datamuse API Integration with Edge Caching
 * Free dictionary API for word validation
 * API Docs: https://www.datamuse.com/api/
 *
 * Caching Strategy:
 * 1. In-memory cache (instant lookup for session)
 * 2. localStorage cache (persistent across sessions)
 * 3. Local word bank fallback (~2000 common words)
 * 4. Datamuse API (last resort, cached afterward)
 */

import {isInWordBank} from './word-bank';

export interface DatamuseWord {
  word: string;
  score: number;
  tags?: string[];
}

export interface WordValidationResult {
  isValid: boolean;
  word: string;
  definition?: string;
  error?: string;
  source?: 'memory' | 'localStorage' | 'wordBank' | 'api'; // For debugging
  apiDown?: boolean; // Indicates if dictionary API is unavailable
}

/**
 * In-memory cache for instant lookups during current session
 */
const memoryCache = new Map<string, boolean>();

/**
 * localStorage key for persistent cache
 */
const CACHE_KEY = 'strands-word-cache';
const CACHE_VERSION = 'v1';
const CACHE_MAX_SIZE = 1000; // Maximum words to store in localStorage

/**
 * Cache entry structure
 */
interface CacheEntry {
  word: string;
  isValid: boolean;
  timestamp: number;
}

interface CacheData {
  version: string;
  entries: CacheEntry[];
}

/**
 * Check if we're running in a browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * Load cache from localStorage (browser only)
 */
function loadCacheFromStorage(): Map<string, boolean> {
  if (!isBrowser) {
    return new Map();
  }

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return new Map();

    const data: CacheData = JSON.parse(stored);

    // Check version
    if (data.version !== CACHE_VERSION) {
      return new Map();
    }

    // Convert to Map
    const cache = new Map<string, boolean>();
    data.entries.forEach(entry => {
      cache.set(entry.word, entry.isValid);
    });

    return cache;
  } catch (error) {
    console.error('Failed to load word cache:', error);
    return new Map();
  }
}

/**
 * Save cache to localStorage (browser only, with size limit)
 */
function saveCacheToStorage(cache: Map<string, boolean>): void {
  if (!isBrowser) {
    return;
  }

  try {
    // Convert Map to array, limit size
    const entries: CacheEntry[] = Array.from(cache.entries())
      .slice(0, CACHE_MAX_SIZE)
      .map(([word, isValid]) => ({
        word,
        isValid,
        timestamp: Date.now(),
      }));

    const data: CacheData = {
      version: CACHE_VERSION,
      entries,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save word cache:', error);
  }
}

/**
 * Initialize persistent cache from localStorage
 */
let persistentCache: Map<string, boolean> | null = null;

function getPersistentCache(): Map<string, boolean> {
  if (!persistentCache) {
    persistentCache = loadCacheFromStorage();
  }
  return persistentCache;
}

/**
 * Add word to all caches
 */
function cacheWord(word: string, isValid: boolean): void {
  const normalizedWord = word.toUpperCase();

  // Add to memory cache
  memoryCache.set(normalizedWord, isValid);

  // Add to persistent cache
  const cache = getPersistentCache();
  cache.set(normalizedWord, isValid);

  // Save to localStorage (debounced in real usage, but we'll do it immediately for now)
  saveCacheToStorage(cache);
}

/**
 * Check if word is in any cache
 * Returns: [isValid, source] or null if not cached
 */
function getCachedWord(word: string): {isValid: boolean; source: 'memory' | 'localStorage'} | null {
  const normalizedWord = word.toUpperCase();

  // Check memory cache first (fastest)
  if (memoryCache.has(normalizedWord)) {
    return {
      isValid: memoryCache.get(normalizedWord)!,
      source: 'memory',
    };
  }

  // Check persistent cache
  const cache = getPersistentCache();
  if (cache.has(normalizedWord)) {
    const isValid = cache.get(normalizedWord)!;
    // Promote to memory cache
    memoryCache.set(normalizedWord, isValid);
    return {
      isValid,
      source: 'localStorage',
    };
  }

  return null;
}

/**
 * Validates if a word exists in the English dictionary
 * Uses multi-tier caching and fallback strategy
 * @param word - The word to validate
 * @returns Validation result with word data and source
 */
export async function validateEnglishWord(
  word: string
): Promise<WordValidationResult> {
  try {
    const normalizedWord = word.toLowerCase().trim();
    const upperWord = normalizedWord.toUpperCase();

    // Basic validation
    if (!normalizedWord || normalizedWord.length === 0) {
      return {
        isValid: false,
        word,
        error: 'Word cannot be empty',
      };
    }

    // Check if word contains only letters
    if (!/^[a-z]+$/i.test(normalizedWord)) {
      return {
        isValid: false,
        word,
        error: 'Word must contain only letters',
      };
    }

    // TIER 1: Check memory/localStorage cache
    const cached = getCachedWord(upperWord);
    if (cached !== null) {
      console.log('[Datamuse] Using cached result for', upperWord, ':', cached.isValid, 'from', cached.source);
      return {
        isValid: cached.isValid,
        word: upperWord,
        error: cached.isValid ? undefined : 'Not a valid English word',
        source: cached.source,
      };
    }

    // TIER 2: Check local word bank (~2000 common words)
    if (isInWordBank(upperWord)) {
      console.log('[Datamuse] Found in word bank:', upperWord);
      // Cache this result
      cacheWord(upperWord, true);

      return {
        isValid: true,
        word: upperWord,
        source: 'wordBank',
      };
    }

    console.log('[Datamuse] Not in cache or word bank, querying API for:', upperWord);

    // TIER 3: Query Datamuse API
    // In browser: use proxy to avoid CORS
    // In Node.js: call Datamuse directly
    const apiUrl = isBrowser
      ? `/api/validate-word?word=${encodeURIComponent(normalizedWord)}`
      : `https://api.datamuse.com/words?sp=${normalizedWord}&max=1`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[Datamuse] API returned ${response.status} for word:`, upperWord);
      // Don't throw - handle gracefully
      return {
        isValid: false,
        word,
        error: 'Dictionary service error - please try again',
        apiDown: true,
      };
    }

    const result = await response.json();

    console.log('[Datamuse] API response for', normalizedWord, ':', result);

    // Handle different response formats (proxy vs direct API)
    let isValid: boolean;

    if (isBrowser && 'isValid' in result) {
      // Browser response from proxy
      isValid = result.isValid;

      // Only cache if API is working properly (not down)
      if (!result.apiDown) {
        cacheWord(upperWord, isValid);
      }

      if (result.apiDown) {
        return {
          isValid: false,
          word: upperWord,
          error: result.error || 'Dictionary temporarily unavailable',
          apiDown: true,
        };
      }
    } else {
      // Node.js direct Datamuse API response
      const words = result as DatamuseWord[];
      const exactMatch = words.find(
        (w) => w.word.toLowerCase() === normalizedWord.toLowerCase()
      );
      isValid = !!exactMatch;
      cacheWord(upperWord, isValid);
    }

    if (isValid) {
      return {
        isValid: true,
        word: upperWord,
        source: 'api',
      };
    }

    return {
      isValid: false,
      word,
      error: 'Not a valid English word',
      source: 'api',
    };

  } catch (error) {
    console.error('Datamuse API error:', error);

    // Fallback: reject unknown words when API fails
    return {
      isValid: false,
      word,
      error: 'Dictionary service unavailable - please try again',
      apiDown: true,
    };
  }
}

/**
 * Get cache statistics (for debugging and monitoring)
 */
export function getCacheStats() {
  return {
    memoryCacheSize: memoryCache.size,
    persistentCacheSize: getPersistentCache().size,
    maxCacheSize: CACHE_MAX_SIZE,
  };
}

/**
 * Clear all caches (useful for testing or troubleshooting)
 */
export function clearWordCache(): void {
  memoryCache.clear();
  persistentCache = null;

  if (isBrowser) {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear cache from localStorage:', error);
    }
  }
}

/**
 * Pre-populate cache with common words from word bank
 * Call this on app initialization for better performance
 */
export function prewarmCache(): void {
  // This is already handled implicitly when words are validated,
  // but we could explicitly cache all word bank words if needed
  console.log('Word cache ready. Stats:', getCacheStats());
}

/**
 * Get related words for hints (optional - for future use)
 * NOTE: This function is currently not used and would require a server-side proxy
 * similar to validateEnglishWord to avoid CORS issues.
 * @param word - The seed word
 * @param maxResults - Maximum number of results
 * @returns Array of related words
 */
export async function getRelatedWords(
  word: string,
  maxResults: number = 10
): Promise<string[]> {
  console.warn('getRelatedWords is not yet implemented with server-side proxy. Direct API calls will fail due to CORS.');
  // TODO: Create a server-side API route for related words
  // For now, return empty array to avoid CORS errors
  return [];
}
