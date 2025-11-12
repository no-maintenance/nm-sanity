/**
 * Persistence utilities for Strands game state
 * Handles localStorage save/load operations
 */

export interface SerializableGameState {
  foundWords: string[];
  cellColors: {[key: number]: string[]};
  wordPaths: {[word: string]: number[]}; // Map from word to its path
  hintsEarned: number;
  discoveredHintWords: string[];
  hintProgress: number;
}

export interface GameState {
  foundWords: Set<string>;
  cellColors: {[key: number]: string[]};
  wordPaths: {[word: string]: number[]}; // Map from word to its path
  hintsEarned: number;
  discoveredHintWords: string[];
  hintProgress: number;
}

/**
 * Get localStorage key for a puzzle
 */
export function getStorageKey(puzzleId: string): string {
  return `strands-${puzzleId}`;
}

/**
 * Save game state to localStorage
 */
export function saveGameState(puzzleId: string, state: GameState): void {
  try {
    const serializable: SerializableGameState = {
      foundWords: Array.from(state.foundWords),
      cellColors: state.cellColors,
      wordPaths: state.wordPaths || {},
      hintsEarned: state.hintsEarned,
      discoveredHintWords: state.discoveredHintWords,
      hintProgress: state.hintProgress,
    };
    
    localStorage.setItem(getStorageKey(puzzleId), JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(puzzleId: string): GameState | null {
  try {
    const saved = localStorage.getItem(getStorageKey(puzzleId));
    if (!saved) return null;

    const parsed = JSON.parse(saved) as SerializableGameState;
    
    return {
      foundWords: new Set(parsed.foundWords || []),
      cellColors: parsed.cellColors || {},
      wordPaths: parsed.wordPaths || {},
      hintsEarned: parsed.hintsEarned || 0,
      discoveredHintWords: parsed.discoveredHintWords || [],
      hintProgress: parsed.hintProgress || 0,
    };
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

/**
 * Clear game state from localStorage
 */
export function clearGameState(puzzleId: string): void {
  try {
    localStorage.removeItem(getStorageKey(puzzleId));
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

/**
 * Check if game state exists in localStorage
 */
export function hasGameState(puzzleId: string): boolean {
  try {
    return localStorage.getItem(getStorageKey(puzzleId)) !== null;
  } catch {
    return false;
  }
}

