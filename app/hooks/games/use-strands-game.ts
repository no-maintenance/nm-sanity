import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {
  validateWord,
  processWordSubmission,
  isGameComplete,
  getWordFromPath,
  type WordValidationResult,
} from '~/lib/games/strands-logic';
import {validateEnglishWord} from '~/lib/games/datamuse';
import {
  saveGameState,
  loadGameState,
  type GameState as PersistedGameState,
} from '~/lib/games/strands-persistence';
import {getGridData, getGridString, getCanonicalPaths} from '~/lib/games/grid-utils';

export interface StrandsGameState {
  // Selection
  currentPath: number[];
  isValidating: boolean;

  // Game progress
  foundWords: Set<string>;
  cellColors: {[key: number]: string[]};
  wordPaths: {[word: string]: number[]};
  discoveredHintWords: string[];
  hintsEarned: number;
  hintProgress: number;

  // Animation
  hintWordAnimationPath: number[] | null; // Path to animate when hint word is discovered
  invalidWordAnimationPath: number[] | null; // Path to animate when invalid word is submitted

  // Notification
  notificationMessage: string | null; // Message to display in current word area

  // Computed
  currentWord: string;
  isComplete: boolean;
}

export interface StrandsGameActions {
  selectCell: (index: number) => void;
  clearPath: () => void;
  submitWord: () => Promise<void>;
  useHint: () => void;
  clearAnimationPath: () => void;
}

export interface UseStrandsGameReturn {
  state: StrandsGameState;
  actions: StrandsGameActions;
}

const GRID_ROWS = 8;
const GRID_COLS = 6;

/**
 * Custom hook for managing Strands game state and actions
 */
export function useStrandsGame(
  puzzle: SanityStrandsPuzzle,
): UseStrandsGameReturn {
  // Transform puzzle data using grid utilities
  const gridData = getGridData(puzzle);
  const gridString = getGridString(puzzle);
  const gridLetters = gridString.split('');
  
  // Theme words are already normalized on the server
  // Memoize to prevent recreation on every render (fixes infinite loop)
  const themeWords = useMemo(() => {
    return puzzle.themeWords.map(tw => ({
      word: tw.word,
      isSpangram: tw.isSpangram,
    }));
  }, [puzzle.themeWords]);

  // Selection state
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Animation state - track path for hint word animation
  const [hintWordAnimationPath, setHintWordAnimationPath] = useState<number[] | null>(null);
  const [invalidWordAnimationPath, setInvalidWordAnimationPath] = useState<number[] | null>(null);

  // Notification state
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Track if we've loaded from localStorage to prevent re-loading
  const hasLoadedRef = useRef(false);

  // Game state - initialize empty to avoid hydration mismatch
  // Load from localStorage only on client after mount
  const [gameState, setGameState] = useState<PersistedGameState>(() => {
    // Always start with empty state on server to avoid hydration mismatch
    return {
      foundWords: new Set<string>(),
      cellColors: {},
      wordPaths: {},
      hintsEarned: 0,
      discoveredHintWords: [],
      hintProgress: 0,
    };
  });

  // Load from localStorage on client after mount (only once)
  useEffect(() => {
    // Only load once to prevent infinite loops
    if (hasLoadedRef.current) return;
    
    const loaded = loadGameState(puzzle._id);
    if (loaded) {
      // Clean up old data: remove theme words from discoveredHintWords
      // (they should only be in foundWords, not discoveredHintWords)
      // Theme words are already normalized on the server, but we need to normalize
      // discoveredHintWords since they come from localStorage and may have old data
      const normalizeWord = (word: string) => word
        .replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u2000-\u200F\u202A-\u202E\u205F-\u206F]/g, '')
        .trim()
        .toUpperCase();
      const themeWordSet = new Set(themeWords.map(tw => tw.word));
      const cleanedHintWords = loaded.discoveredHintWords.filter(
        word => !themeWordSet.has(normalizeWord(word))
      );
      
      hasLoadedRef.current = true;
      setGameState({
        ...loaded,
        discoveredHintWords: cleanedHintWords,
      });
    } else {
      hasLoadedRef.current = true;
    }
  }, [puzzle._id, themeWords]);

  // Save to localStorage whenever game state changes
  // Only save after initial load to prevent saving empty state
  useEffect(() => {
    // Don't save until we've loaded (or attempted to load) from localStorage
    if (!hasLoadedRef.current) return;
    
    if (gameState.foundWords.size > 0 || gameState.discoveredHintWords.length > 0) {
      saveGameState(puzzle._id, gameState);
    }
  }, [puzzle._id, gameState]);

  // Computed values
  const currentWord = currentPath.length > 0
    ? getWordFromPath(gridData, currentPath)
    : '';
  
  const isComplete = isGameComplete(
    Array.from(gameState.foundWords),
    themeWords,
  );

  // Select a cell (adds to path if adjacent)
  const selectCell = useCallback((index: number) => {
    setCurrentPath(prev => {
      // If empty, start new path
      if (prev.length === 0) {
        return [index];
      }

      const lastIndex = prev[prev.length - 1];

      // Same cell as last → submit word
      if (lastIndex === index) {
        return prev; // Will be handled by submitWord
      }

      // Cell already in path (not last) → backtrack
      const existingIndex = prev.indexOf(index);
      if (existingIndex !== -1 && existingIndex !== prev.length - 1) {
        return prev.slice(0, existingIndex + 1);
      }

      // Check if adjacent
      const row1 = Math.floor(lastIndex / GRID_COLS);
      const col1 = lastIndex % GRID_COLS;
      const row2 = Math.floor(index / GRID_COLS);
      const col2 = index % GRID_COLS;
      const rowDiff = Math.abs(row1 - row2);
      const colDiff = Math.abs(col1 - col2);

      if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
        return [...prev, index];
      }

      // Non-adjacent → start new path
      return [index];
    });
  }, []);

  // Clear current path
  const clearPath = useCallback(() => {
    setCurrentPath([]);
  }, []);

  // Submit word for validation
  const submitWord = useCallback(async () => {
    console.log('[Game] submitWord called - pathLength:', currentPath.length, 'isValidating:', isValidating, 'hasNotification:', !!notificationMessage);
    if (currentPath.length === 0) {
      console.log('[Game] Blocked: empty path');
      return;
    }
    if (isValidating) {
      console.log('[Game] Blocked: already validating');
      return;
    }
    if (notificationMessage) {
      console.log('[Game] Blocked: notification showing');
      return;
    }

    const word = currentWord.toUpperCase();
    console.log('[Game] Submitting word:', word);

    // Save path at start for use in async error handlers
    const pathSnapshot = [...currentPath];

    // Reject words shorter than 4 characters
    if (word.length < 4) {
      console.log('[Game] Blocked: word too short');
      setCurrentPath([]);
      setNotificationMessage('Word too short');
      setTimeout(() => {
        setNotificationMessage(null);
      }, 2000);
      return;
    }

    // Check if word already found
    if (gameState.foundWords.has(word)) {
      console.log('[Game] Word already found');
      setCurrentPath([]);
      setNotificationMessage('Already found!');
      setTimeout(() => {
        setNotificationMessage(null);
      }, 2000);
      return;
    }

    setIsValidating(true);

    try {
      // Validate word
      console.log('[Game] Starting validation for:', word);
      // Get canonical paths using utility function (handles both legacy and new formats)
      const canonicalPaths = getCanonicalPaths(puzzle);

      const validation: WordValidationResult = await validateWord(
        word,
        pathSnapshot,
        themeWords,
        new Set(gameState.discoveredHintWords),
        validateEnglishWord,
        canonicalPaths,
        puzzle.hintWords,
      );

      // Debug logging
      console.log('[Strands] Word validation complete:', {
        word,
        validationType: validation.type,
        message: validation.message,
        grantsHintProgress: validation.grantsHintProgress,
        isThemeWord: validation.isThemeWord,
      });

      // Process submission result
      const result = processWordSubmission(
        validation,
        pathSnapshot,
        gameState.cellColors,
        themeWords,
        gameState.hintProgress,
      );

      console.log('[Strands] Submission result:', {
        success: result.success,
        type: result.type,
        grantsHintProgress: result.grantsHintProgress,
        validationType: validation.type,
      });

      // Update game state based on result
      if (result.success) {
        console.log('[Game] Word is valid, updating game state');
        const newFoundWords = new Set(gameState.foundWords);
        newFoundWords.add(word);

        const updates: Partial<PersistedGameState> = {
          foundWords: newFoundWords,
        };

        // Only update cell colors and paths for theme words, not hint words
        if (result.type === 'theme-word') {
          updates.cellColors = result.cellColors;
          // Store the path for this word
          updates.wordPaths = {
            ...gameState.wordPaths,
            [word]: pathSnapshot,
          };
        }

        if (result.type === 'hint-word') {
          console.log('[Strands] Adding hint word to discovered list:', word);
          updates.discoveredHintWords = [...gameState.discoveredHintWords, word];
          updates.hintProgress = result.newHintProgress;
          updates.cellColors = result.cellColors; // Update cell colors to show hint indicators
          if (result.grantsNewHint) {
            updates.hintsEarned = gameState.hintsEarned + 1;
          }

          // Trigger animation if hint progress was granted
          if (result.grantsHintProgress) {
            // Store the path for animation before clearing
            setHintWordAnimationPath([...pathSnapshot]);
          }
        }

        setGameState(prev => ({...prev, ...updates}));
        console.log('[Game] Game state updated');

        // Clear path immediately for all valid words
        console.log('[Game] Clearing path after valid word submission');
        setCurrentPath([]);
      } else {
        console.log('[Game] Word rejected - triggering shake animation');
        console.log('[Strands] Word rejected:', word, 'Reason:', result.type, 'Message:', validation.message);

        // Trigger shake animation first (use snapshot path for animation)
        console.log('[Game] Saving path for animation:', pathSnapshot);
        setInvalidWordAnimationPath([...pathSnapshot]);

        // Clear currentPath immediately so user can continue playing
        console.log('[Game] Clearing currentPath immediately');
        setCurrentPath([]);

        // After shake animation completes, show notification
        setTimeout(() => {
          console.log('[Game] Shake complete, showing notification');
          setInvalidWordAnimationPath(null);
          setNotificationMessage(validation.message);
        }, 500); // 500ms shake animation duration

        // Clear notification after showing it
        setTimeout(() => {
          console.log('[Game] Clearing notification');
          setNotificationMessage(null);
        }, 2500); // Show notification for 2 seconds after shake

        return; // Don't proceed to normal path clearing logic
      }

      // Path is already cleared in the success branch above
    } catch (error) {
      console.error('[Game] Word validation error:', error);
      console.log('[Game] Clearing path due to error');

      // Show error notification with shake animation
      setInvalidWordAnimationPath([...pathSnapshot]);
      setCurrentPath([]);

      setTimeout(() => {
        setInvalidWordAnimationPath(null);
        setNotificationMessage('Error validating word');
      }, 500);

      setTimeout(() => {
        setNotificationMessage(null);
      }, 2500);
    } finally {
      console.log('[Game] Setting isValidating to false');
      setIsValidating(false);
    }
  }, [
    currentPath,
    currentWord,
    gameState,
    themeWords,
    isValidating,
    notificationMessage,
  ]);

  // Use a hint
  const useHint = useCallback(() => {
    if (gameState.hintsEarned === 0) return;
    
    setGameState(prev => ({
      ...prev,
      hintsEarned: prev.hintsEarned - 1,
    }));
    // TODO: Implement hint reveal logic
  }, [gameState.hintsEarned]);

  // Callback to clear animation path and current path after animation completes
  const clearAnimationPath = useCallback(() => {
    setHintWordAnimationPath(null);
    setCurrentPath([]);
  }, []);

  // Return state and actions
  return {
    state: {
      currentPath,
      isValidating,
      foundWords: gameState.foundWords,
      cellColors: gameState.cellColors,
      wordPaths: gameState.wordPaths,
      discoveredHintWords: gameState.discoveredHintWords,
      hintsEarned: gameState.hintsEarned,
      hintProgress: gameState.hintProgress,
      hintWordAnimationPath,
      invalidWordAnimationPath,
      notificationMessage,
      currentWord,
      isComplete,
    },
    actions: {
      selectCell,
      clearPath,
      submitWord,
      useHint,
      clearAnimationPath,
    },
  };
}

