import {useCallback, useEffect, useState} from 'react';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {
  getWordFromPath,
  matchesThemeWord,
  isValidHintWord,
  calculateWordScore,
  isGameComplete,
  spansOppositeEdges,
  formatTime,
} from '~/lib/games/strands-logic';
import {StrandsBoard} from './strands-board';
import {WordList} from './word-list';
import {HintSystem} from './hint-system';
import {GameHeader} from './game-header';
import {GameComplete} from './game-complete';

interface FoundWord {
  word: string;
  path: number[];
  isSpangram: boolean;
  score: number;
}

interface GameState {
  foundWords: FoundWord[];
  currentPath: number[];
  hintWordCount: number;
  availableHints: number;
  score: number;
  timeElapsed: number;
  isComplete: boolean;
  lastError: string | null;
}

export function StrandsGame({puzzle}: {puzzle: SanityStrandsPuzzle}) {
  const [gameState, setGameState] = useState<GameState>({
    foundWords: [],
    currentPath: [],
    hintWordCount: 0,
    availableHints: 0,
    score: 0,
    timeElapsed: 0,
    isComplete: false,
    lastError: null,
  });

  // Timer
  useEffect(() => {
    if (gameState.isComplete) return;

    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.isComplete]);

  // Check time limit
  useEffect(() => {
    if (
      puzzle.timeLimit > 0 &&
      gameState.timeElapsed >= puzzle.timeLimit * 60 &&
      !gameState.isComplete
    ) {
      setGameState((prev) => ({
        ...prev,
        isComplete: true,
        lastError: 'Time limit reached!',
      }));
    }
  }, [gameState.timeElapsed, gameState.isComplete, puzzle.timeLimit]);

  // Handle cell selection
  const handleCellSelect = useCallback(
    (index: number) => {
      setGameState((prev) => {
        // If cell is already in path, truncate to that point
        const existingIndex = prev.currentPath.indexOf(index);
        if (existingIndex !== -1) {
          return {
            ...prev,
            currentPath: prev.currentPath.slice(0, existingIndex + 1),
            lastError: null,
          };
        }

        // Add to path
        return {
          ...prev,
          currentPath: [...prev.currentPath, index],
          lastError: null,
        };
      });
    },
    [],
  );

  // Handle word submission
  const handleWordSubmit = useCallback(() => {
    if (gameState.currentPath.length === 0) return;

    const word = getWordFromPath(puzzle.generatedGrid, gameState.currentPath);
    const wordUpper = word.toUpperCase();

    // Check if already found
    if (gameState.foundWords.some((fw) => fw.word === wordUpper)) {
      setGameState((prev) => ({
        ...prev,
        currentPath: [],
        lastError: 'Already found this word!',
      }));
      return;
    }

    // Check if it's a theme word
    const themeMatch = matchesThemeWord(word, puzzle.themeWords);
    if (themeMatch.match) {
      // Validate spangram spans edges
      if (themeMatch.isSpangram && !spansOppositeEdges(gameState.currentPath)) {
        setGameState((prev) => ({
          ...prev,
          currentPath: [],
          lastError: 'Spangram must span opposite edges!',
        }));
        return;
      }

      const wordScore = calculateWordScore(word, themeMatch.isSpangram, puzzle.scoring);

      const newFoundWords = [
        ...gameState.foundWords,
        {
          word: wordUpper,
          path: gameState.currentPath,
          isSpangram: themeMatch.isSpangram,
          score: wordScore,
        },
      ];

      const complete = isGameComplete(
        newFoundWords.map((fw) => fw.word),
        puzzle.themeWords,
      );

      setGameState((prev) => ({
        ...prev,
        foundWords: newFoundWords,
        currentPath: [],
        score: prev.score + wordScore,
        isComplete: complete,
        lastError: null,
      }));
      return;
    }

    // Check if it's a valid hint word
    if (word.length >= 4 && isValidHintWord(word, puzzle.themeWords)) {
      setGameState((prev) => ({
        ...prev,
        hintWordCount: prev.hintWordCount + 1,
        availableHints:
          prev.hintWordCount + 1 >= 3
            ? prev.availableHints + 1
            : prev.availableHints,
        currentPath: [],
        lastError: null,
      }));
      return;
    }

    // Not a valid word
    setGameState((prev) => ({
      ...prev,
      currentPath: [],
      lastError: word.length < 4 ? 'Word too short' : 'Not a valid word',
    }));
  }, [gameState, puzzle]);

  // Handle hint usage
  const handleUseHint = useCallback(() => {
    if (gameState.availableHints === 0) return;

    // Find an unfound theme word
    const unfoundWord = puzzle.themeWords.find(
      (tw) => !gameState.foundWords.some((fw) => fw.word === tw.word.toUpperCase()),
    );

    if (unfoundWord) {
      // Reveal first letter position (simplified - in real game would highlight the word)
      setGameState((prev) => ({
        ...prev,
        availableHints: prev.availableHints - 1,
        hintWordCount: Math.max(0, prev.hintWordCount - 3),
        lastError: `Hint: Look for "${unfoundWord.word}"`,
      }));
    }
  }, [gameState.availableHints, gameState.foundWords, puzzle.themeWords]);

  // Clear selection
  const handleClearPath = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentPath: [],
      lastError: null,
    }));
  }, []);

  // Load saved game state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`strands-${puzzle._id}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGameState((prev) => ({...prev, ...parsed, timeElapsed: 0}));
      } catch (e) {
        console.error('Failed to load saved game', e);
      }
    }
  }, [puzzle._id]);

  // Save game state to localStorage
  useEffect(() => {
    if (gameState.foundWords.length > 0 && !gameState.isComplete) {
      localStorage.setItem(
        `strands-${puzzle._id}`,
        JSON.stringify({
          foundWords: gameState.foundWords,
          hintWordCount: gameState.hintWordCount,
          availableHints: gameState.availableHints,
          score: gameState.score,
        }),
      );
    }
    if (gameState.isComplete) {
      localStorage.removeItem(`strands-${puzzle._id}`);
    }
  }, [gameState, puzzle._id]);

  if (gameState.isComplete) {
    return (
      <GameComplete
        puzzle={puzzle}
        foundWords={gameState.foundWords}
        score={gameState.score}
        timeElapsed={gameState.timeElapsed}
        usedHints={gameState.availableHints < 0}
      />
    );
  }

  const progress = (gameState.foundWords.length / puzzle.themeWords.length) * 100;

  return (
    <div className="mx-auto max-w-6xl">
      <GameHeader
        puzzle={puzzle}
        score={gameState.score}
        timeElapsed={gameState.timeElapsed}
        progress={progress}
        lastError={gameState.lastError}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <StrandsBoard
            grid={puzzle.generatedGrid}
            currentPath={gameState.currentPath}
            foundWords={gameState.foundWords}
            onCellSelect={handleCellSelect}
            onWordSubmit={handleWordSubmit}
            onClearPath={handleClearPath}
          />
        </div>

        <div className="space-y-6">
          <HintSystem
            hintWordCount={gameState.hintWordCount}
            availableHints={gameState.availableHints}
            onUseHint={handleUseHint}
            hintMode={puzzle.hintMode}
          />

          <WordList
            foundWords={gameState.foundWords}
            themeWords={puzzle.themeWords}
            totalWords={puzzle.themeWords.length}
          />
        </div>
      </div>

      {puzzle.timeLimit > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Time remaining: {formatTime(puzzle.timeLimit * 60 - gameState.timeElapsed)}
        </div>
      )}
    </div>
  );
}
