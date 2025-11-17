import {CircleHelp, Lock} from 'lucide-react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '~/components/ui/button';
import {cn} from '~/lib/utils';
import {validateWord, findWordPath} from '~/lib/games/strands-logic';
import {validateEnglishWord} from '~/lib/games/datamuse';
import {HintButton} from './hint-button';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {getGridString, getCanonicalPaths, getGridData} from '~/lib/games/grid-utils';
import type {ProtectionConfig} from '~/lib/site-protection-states';
import {MediaField} from '~/components/media-field';
import {useColorsCssVars} from '~/hooks/use-colors-css-vars';
import {useCountdown} from '~/hooks/use-countdown';

interface ThemeWord {
  word: string;
  isSpangram: boolean;
  color: string; // Tailwind color class like "bg-blue-200"
}

interface StrandsGameProps {
  /** The puzzle data from Sanity */
  puzzle: SanityStrandsPuzzle;
  /** Handler for early access button click */
  onJoinEarlyAccess?: () => void;
  /** Handler for help icon click */
  onHelpClick?: () => void;
  /** Optional protection configuration for countdown, labels, and styling */
  protection?: ProtectionConfig;
}

interface ActiveHint {
  word: string;
  path: number[];
  revealedAt: number; // timestamp for animation offset
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  message: string;
  type: NotificationType;
  visible: boolean;
}

interface GameState {
  foundWords: Set<string>;
  cellColors: {[key: number]: string[]};
  hintsEarned: number;
  discoveredHintWords: string[];
  hintProgress: number;
  activeHints: ActiveHint[];
}

const GRID_ROWS = 8;
const GRID_COLS = 6;

// Predefined colors for theme words
const THEME_COLORS = [
  'bg-blue-200',
  'bg-green-200',
  'bg-yellow-200',
  'bg-pink-200',
  'bg-purple-200',
  'bg-orange-200',
  'bg-cyan-200',
  'bg-rose-200',
];

const SPANGRAM_COLOR = 'bg-amber-300';

function getLocalizedValue(field: any[] | string | undefined): string | undefined {
  if (!field) return undefined;
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0) {
    return (field[0] as any)?.value;
  }
  return undefined;
}

export function GameLockedView({
  puzzle,
  onJoinEarlyAccess,
  onHelpClick,
  protection,
}: StrandsGameProps) {
  // Transform puzzle data - use canonical grid if available
  const gridLetters = getGridString(puzzle).split('');
  const canonicalPaths = getCanonicalPaths(puzzle);

  const themeWords: ThemeWord[] = puzzle.themeWords.map((tw) => ({
    word: tw.word,
    isSpangram: tw.isSpangram,
    color: '', // Color will be assigned below
  }));

  const theme = puzzle.theme?.clue || puzzle.title;

  // Use countdown hook
  const { formatted: countdownDisplay } = useCountdown({
    targetDate: protection?.countdown,
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Get localized content from protection config
  const countdownLabel = protection
    ? getLocalizedValue(protection.countdownLabel) || 'Early access for private sale begins in...'
    : 'Early access for private sale begins in...';

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Generate CSS variables for color scheme
  const hasColorScheme = protection?.colorScheme != null;
  const colorsCssVars = useColorsCssVars({
    settings: hasColorScheme ? {colorScheme: protection.colorScheme as any} : undefined,
    selector: '#game-locked-view'
  });

  // Selection state
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Game state - word-level locking
  const [gameState, setGameState] = useState<GameState>({
    foundWords: new Set<string>(),
    cellColors: {},
    hintsEarned: 0,
    discoveredHintWords: [],
    hintProgress: 0,
    activeHints: [],
  });
  const [isValidating, setIsValidating] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<Notification>({
    message: '',
    type: 'info',
    visible: false,
  });
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Destructure for convenience
  const {foundWords, cellColors, hintsEarned, discoveredHintWords, hintProgress, activeHints} = gameState;

  // Debug active hints
  useEffect(() => {
    if (activeHints.length > 0) {
      console.log('🎨 Active hints updated:', activeHints.map(h => ({
        word: h.word,
        pathLength: h.path.length,
        path: h.path,
      })));
    }
  }, [activeHints]);

  // Load game state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`strands-${puzzle._id}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as {
          foundWords?: string[];
          cellColors?: {[key: number]: string[]};
          hintsEarned?: number;
          discoveredHintWords?: string[];
          hintProgress?: number;
          activeHints?: ActiveHint[];
        };
        setGameState({
          foundWords: new Set(parsed.foundWords || []),
          cellColors: parsed.cellColors || {},
          hintsEarned: parsed.hintsEarned || 0,
          discoveredHintWords: parsed.discoveredHintWords || [],
          hintProgress: parsed.hintProgress || 0,
          activeHints: parsed.activeHints || [],
        });
      } catch (e) {
        console.error('Failed to load game state', e);
      }
    }
  }, [puzzle._id]);

  // Save game state to localStorage
  useEffect(() => {
    if (foundWords.size > 0 || discoveredHintWords.length > 0 || activeHints.length > 0) {
      localStorage.setItem(
        `strands-${puzzle._id}`,
        JSON.stringify({
          foundWords: Array.from(foundWords),
          cellColors,
          hintsEarned,
          discoveredHintWords,
          hintProgress,
          activeHints,
        }),
      );
    }
  }, [gameState, puzzle._id, foundWords, cellColors, hintsEarned, discoveredHintWords, hintProgress, activeHints]);

  // Calculate current word from path
  const currentWord = currentPath.map(index => gridLetters[index]).join('');

  // Show notification with auto-dismiss
  const showNotification = useCallback((message: string, type: NotificationType = 'info', duration: number = 2000) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Show notification
    setNotification({
      message,
      type,
      visible: true,
    });

    // Auto-dismiss after duration
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(prev => ({
        ...prev,
        visible: false,
      }));
    }, duration);
  }, []);

  // Cleanup notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to check if two cells are adjacent (including diagonals)
  const areAdjacent = useCallback((index1: number, index2: number): boolean => {
    const row1 = Math.floor(index1 / GRID_COLS);
    const col1 = index1 % GRID_COLS;
    const row2 = Math.floor(index2 / GRID_COLS);
    const col2 = index2 % GRID_COLS;

    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);

    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  }, []);

  // Handle hint usage - reveal next theme word with dotted border
  const handleUseHint = useCallback(() => {
    console.log('🔍 handleUseHint called', {hintsEarned, activeHints: activeHints.length});

    if (hintsEarned === 0) {
      console.log('❌ No hints available');
      return;
    }

    // Find next undiscovered theme word
    const nextThemeWord = themeWords.find(tw => !foundWords.has(tw.word.toUpperCase()));
    if (!nextThemeWord) {
      console.log('❌ All words found');
      return; // All words found
    }

    console.log('🎯 Next theme word:', nextThemeWord.word);

    // Check if this word already has an active hint
    if (activeHints.some(hint => hint.word.toUpperCase() === nextThemeWord.word.toUpperCase())) {
      console.log('❌ Hint already active for this word');
      return; // Hint already active for this word
    }

    // Find the path for this word - use canonical path if available
    const path = canonicalPaths?.[nextThemeWord.word.toUpperCase()] ||
                 findWordPath(getGridData(puzzle), nextThemeWord.word);
    console.log('📍 Found path:', path);

    if (!path) {
      console.error('Could not find path for theme word:', nextThemeWord.word);
      showNotification('Could not find word path', 'error', 2000);
      return;
    }

    console.log('✅ Adding hint for word:', nextThemeWord.word, 'with path length:', path.length);

    // Add to active hints and decrement hints earned
    setGameState(prev => ({
      ...prev,
      activeHints: [
        ...prev.activeHints,
        {
          word: nextThemeWord.word,
          path,
          revealedAt: Date.now(),
        },
      ],
      hintsEarned: prev.hintsEarned - 1,
    }));

    showNotification(`Revealing: ${nextThemeWord.word}`, 'info', 2000);
  }, [hintsEarned, themeWords, foundWords, activeHints, puzzle.canonicalGrid, showNotification]);

  // Submit current word for validation (async with Datamuse)
  const submitWord = useCallback(async () => {
    if (currentPath.length === 0) return;
    if (isValidating) return; // Prevent double submission

    const word = currentWord.toUpperCase();

    // Check if word already found as theme word (word-level lock)
    if (foundWords.has(word)) {
      setCurrentPath([]);
      return;
    }

    setIsValidating(true);

    try {
      // Use comprehensive validation with Datamuse and canonical paths
      const validation = await validateWord(
        word,
        currentPath,
        themeWords.map(tw => ({word: tw.word, isSpangram: tw.isSpangram})),
        new Set(discoveredHintWords),
        validateEnglishWord,
        canonicalPaths, // Pass canonical paths if available
        puzzle.hintWords, // Pass puzzle hint words if available
      );

      // Handle theme word (spangram or regular)
      if (validation.type === 'theme-word') {
        // Get color based on whether it's spangram
        let color: string;
        if (validation.isSpangram) {
          color = SPANGRAM_COLOR;
          showNotification('SPANGRAM!', 'success', 2500);
        } else {
          const themeIndex = themeWords
            .filter(tw => !tw.isSpangram)
            .findIndex(tw => tw.word.toUpperCase() === word);
          color = THEME_COLORS[themeIndex % THEME_COLORS.length];
          showNotification('Theme word!', 'success', 2000);
        }

        // Color cells
        const newCellColors = {...cellColors};
        currentPath.forEach(index => {
          if (!newCellColors[index]) {
            newCellColors[index] = [];
          }
          newCellColors[index].push(color);
        });

        // Remove this word from active hints if it was hinted
        const newActiveHints = activeHints.filter(
          hint => hint.word.toUpperCase() !== word
        );

        setGameState(prev => ({
          ...prev,
          foundWords: new Set([...prev.foundWords, word]),
          cellColors: newCellColors,
          activeHints: newActiveHints,
        }));

        setCurrentPath([]);

        // Check win condition
        const allThemeWordsFound = themeWords.every(tw =>
          foundWords.has(tw.word.toUpperCase()) || tw.word.toUpperCase() === word
        );
        // TODO: Show win modal if allThemeWordsFound is true

        setIsValidating(false);
        return;
      }

      // Handle valid hint word (grants progress)
      if (validation.type === 'valid-hint-word' && validation.grantsHintProgress) {
        // Update hint progress
        const newProgress = hintProgress + 1;
        const grantsNewHint = newProgress >= 3;

        // Show notification
        if (grantsNewHint) {
          showNotification('Hint earned!', 'success', 2000);
        } else {
          showNotification(`${word} (+${newProgress}/3)`, 'info', 1500);
        }

        // Color cells gray
        const newCellColors = {...cellColors};
        currentPath.forEach(index => {
          if (!newCellColors[index]) {
            newCellColors[index] = [];
          }
          newCellColors[index].push('bg-gray-100');
        });

        setGameState(prev => ({
          ...prev,
          discoveredHintWords: [...prev.discoveredHintWords, word],
          foundWords: new Set([...prev.foundWords, word]),
          hintProgress: grantsNewHint ? 0 : newProgress,
          hintsEarned: grantsNewHint ? prev.hintsEarned + 1 : prev.hintsEarned,
          cellColors: newCellColors,
        }));

        setCurrentPath([]);
        setIsValidating(false);
        return;
      }

      // Handle error cases with notifications
      if (validation.type === 'already-discovered') {
        showNotification('Already found', 'info', 1500);
      } else if (validation.type === 'not-english') {
        showNotification('Not in word list', 'error', 1500);
      } else if (validation.type === 'too-short') {
        showNotification('Too short', 'error', 1500);
      } else if (validation.type === 'validation-error') {
        showNotification('Validation error', 'error', 1500);
      }

      setCurrentPath([]);

    } catch (error) {
      console.error('Word validation error:', error);
      showNotification('Error', 'error', 1500);
      setCurrentPath([]);
    } finally {
      setIsValidating(false);
    }
  }, [
    currentPath,
    currentWord,
    foundWords,
    cellColors,
    themeWords,
    discoveredHintWords,
    hintProgress,
    isValidating,
    showNotification,
    activeHints,
  ]);

  // Handle click on cell (click-by-click word building)
  const handleCellClick = useCallback((index: number) => {
    // Ignore clicks that were actually drags
    if (isDragging) return;

    // Starting new word
    if (currentPath.length === 0) {
      setCurrentPath([index]);
      return;
    }

    const lastIndex = currentPath[currentPath.length - 1];

    // Same letter as last → submit word
    if (lastIndex === index) {
      submitWord();
      return;
    }

    // Letter already in path (not last) → backtrack
    const existingIndex = currentPath.indexOf(index);
    if (existingIndex !== -1 && existingIndex !== currentPath.length - 1) {
      setCurrentPath(currentPath.slice(0, existingIndex + 1));
      return;
    }

    // Adjacent letter → add to path
    if (areAdjacent(lastIndex, index)) {
      setCurrentPath([...currentPath, index]);
      return;
    }

    // Non-adjacent letter → reset and start new word
    setCurrentPath([index]);
  }, [currentPath, isDragging, areAdjacent, submitWord]);

  // Handle mouse/touch down (for drag support)
  const handlePointerDown = useCallback((index: number) => {
    setIsMouseDown(true);
    setDragStartCell(index);
  }, []);

  // Handle mouse/touch move over a cell (drag building)
  const handlePointerEnter = useCallback((index: number) => {
    // Only allow drag if mouse button is actually held down
    if (!isMouseDown) return;

    // Enable dragging if we moved to a different cell while holding mouse down
    if (dragStartCell !== null && dragStartCell !== index && !isDragging) {
      setIsDragging(true);
      setCurrentPath([dragStartCell, index]);
      return;
    }

    // Continue dragging
    if (!isDragging) return;

    setCurrentPath(prev => {
      // If cell is already in path, truncate to that point (backtracking)
      const existingIndex = prev.indexOf(index);
      if (existingIndex !== -1) {
        return prev.slice(0, existingIndex + 1);
      }

      if (prev.length === 0) return [index];

      const lastIndex = prev[prev.length - 1];

      // Must be adjacent to last cell
      if (areAdjacent(lastIndex, index)) {
        return [...prev, index];
      }

      return prev;
    });
  }, [isDragging, dragStartCell, areAdjacent, isMouseDown]);

  // Handle pointer up after drag
  const handlePointerUp = useCallback(() => {
    // Clear drag states
    setIsMouseDown(false);
    setDragStartCell(null);

    if (isDragging) {
      submitWord();
    }

    setIsDragging(false);
  }, [isDragging, submitWord]);

  // Global pointer up handler
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        handlePointerUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalPointerUp);
    document.addEventListener('touchend', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalPointerUp);
      document.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [isDragging, handlePointerUp]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentPath([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside grid resets word
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setCurrentPath([]);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get base color for cell
  const getCellClasses = useCallback((index: number) => {
    const colors = cellColors[index] || [];
    return colors.length > 0 ? colors[0] : 'bg-white/5';
  }, [cellColors]);

  // Get additional overlay colors (for cells in multiple words)
  const getOverlayColors = useCallback((index: number) => {
    const colors = cellColors[index] || [];
    return colors.slice(1); // Return all colors after the first
  }, [cellColors]);

  // Check if cell is part of any active hint and get its position info
  const getHintInfo = useCallback((index: number): {isHint: boolean; positionInWord: number} | null => {
    for (const hint of activeHints) {
      const positionInWord = hint.path.indexOf(index);
      if (positionInWord !== -1) {
        // Only log once per hint word (when finding first letter)
        if (positionInWord === 0) {
          console.log('💡 Hint cell found:', {index, word: hint.word, positionInWord});
        }
        return {isHint: true, positionInWord};
      }
    }
    return null;
  }, [activeHints]);

  // Count found theme words
  const foundThemeWords = themeWords.filter(tw =>
    foundWords.has(tw.word.toUpperCase())
  ).length;

  return (
    <div id={hasColorScheme ? "game-locked-view" : undefined} className="relative flex h-full w-full flex-col">
      {hasColorScheme && <style dangerouslySetInnerHTML={{__html: colorsCssVars}} />}

      {/* Background Media */}
      {(protection?.backgroundImage || protection?.backgroundVideo) && (
        <div className="absolute inset-0 h-full w-full">
          <MediaField
            mediaType={protection.mediaType || 'image'}
            image={protection.backgroundImage}
            video={protection.backgroundVideo}
            className="h-full w-full object-cover"
            objectFit="cover"
            priority
            controls={false}
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
          />
        </div>
      )}

      {/* Overlay */}
      {protection?.overlayOpacity !== undefined && protection.overlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgb(0 0 0)',
            opacity: protection.overlayOpacity / 100
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col">
        {/* Header */}
        <div className="border-b border-black">
          <div className="flex items-center justify-between p-[10px]">
          {/* Left: Icon buttons */}
          <div className="flex items-center gap-2.5 py-2.5">
            <button
              onClick={onHelpClick}
              className="flex size-6 items-center justify-center transition-opacity hover:opacity-70"
              aria-label="Help"
              type="button"
            >
              <CircleHelp className="size-6" />
            </button>
            <button
              className="flex size-6 items-center justify-center transition-opacity hover:opacity-70"
              aria-label="Locked"
              type="button"
            >
              <Lock className="size-6" />
            </button>
          </div>

          {/* Right: Call to action button */}
          <Button
            onClick={onJoinEarlyAccess}
            className="h-auto rounded-[3px] bg-[#2c2c2c] px-3 py-3 text-base font-medium text-[#f5f5f5] hover:bg-[#2c2c2c]/90"
          >
            JOIN FOR PASSWORD
          </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-col items-center gap-2">
          {/* Countdown banner */}
          <div className="w-full border-b border-black">
            <div className="flex items-center justify-between px-3 py-2 text-sm text-black">
              <p className="font-normal">{countdownLabel}</p>
              <p className="font-bold">{countdownDisplay}</p>
            </div>
          </div>

   

          {/* Spacer */}
          <div className="h-[27px]" />

          {/* Current word display ABOVE grid - fixed height to prevent CLS */}
          <div className="mb-4 flex min-h-[56px] items-center justify-center">
            {notification.visible ? (
              <p
                className={cn(
                  "text-[32px] font-bold leading-normal tracking-wide",
                  notification.type === 'success' && "text-green-600",
                  notification.type === 'error' && "text-red-600",
                  notification.type === 'info' && "text-blue-600"
                )}
              >
                {notification.message}
              </p>
            ) : currentWord ? (
              <p className={cn("text-[32px] font-bold leading-normal tracking-[0.2em] text-black", isValidating && "animate-pulse")}>
                {currentWord}
              </p>
            ) : null}
          </div>

          {/* Grid */}
          <div className="relative mx-auto max-w-md">
            <div
              ref={gridRef}
              className="relative grid gap-x-8 gap-y-6 px-8 py-4"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
            }}
          >
            {gridLetters.slice(0, 48).map((letter, index) => {
              const isSelected = currentPath.includes(index);
              const selectionIndex = currentPath.indexOf(index);
              const isLastSelected = selectionIndex === currentPath.length - 1;
              const overlayColors = getOverlayColors(index);
              const hintInfo = getHintInfo(index);

              return (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "relative flex h-12 w-12 items-center justify-center cursor-pointer select-none focus:outline-none rounded-lg transition-transform",
                    isSelected && "scale-105",
                    getCellClasses(index)
                  )}
                  onClick={() => handleCellClick(index)}
                  onMouseDown={() => handlePointerDown(index)}
                  onMouseEnter={() => handlePointerEnter(index)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handlePointerDown(index);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element?.hasAttribute('data-cell-index')) {
                      const touchIndex = parseInt(element.getAttribute('data-cell-index') || '0');
                      handlePointerEnter(touchIndex);
                    }
                  }}
                  data-cell-index={index}
                  aria-label={`Letter ${letter}, position ${index + 1}`}
                >
                  {/* Color overlays for cells in multiple words */}
                  {overlayColors.map((color, i) => (
                    <div
                      key={`overlay-${i}`}
                      className={cn(
                        "absolute inset-0 rounded-lg pointer-events-none",
                        color,
                        "opacity-40"
                      )}
                      style={{
                        clipPath: `polygon(${(i + 1) * 25}% 0, 100% 0, 100% 100%, ${(i + 1) * 25}% 100%)`
                      }}
                    />
                  ))}

                  {/* Hint indicator - dotted border with pulsing animation */}
                  {hintInfo && (
                    <>
                      <div
                        className="absolute inset-0 z-30 rounded-lg border-4 border-dashed border-blue-600 pointer-events-none"
                        style={{
                          animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                          animationDelay: `${hintInfo.positionInWord * 150}ms`,
                        }}
                        aria-hidden="true"
                      />
                      {/* Solid background flash for visibility */}
                      <div
                        className="absolute inset-0 z-20 rounded-lg bg-blue-200 pointer-events-none opacity-20"
                        style={{
                          animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                          animationDelay: `${hintInfo.positionInWord * 150}ms`,
                        }}
                        aria-hidden="true"
                      />
                    </>
                  )}

                  {/* Selection indicator - purple ring */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Purple ring */}
                      <div className="h-12 w-12 rounded-full ring-4 ring-purple-400" />

                      {/* Outer ring for last selected */}
                      {isLastSelected && (
                        <div className="absolute h-[52px] w-[52px] rounded-full ring-2 ring-purple-600" />
                      )}
                    </div>
                  )}

                  {/* Letter */}
                  <span className="relative z-40 text-center text-3xl font-normal leading-normal text-black pointer-events-none">
                    {letter}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-black">
          {/* DEBUG: Active hints display */}
          {activeHints.length > 0 && (
            <div className="border-b border-black bg-blue-50 px-4 py-2">
              <p className="text-xs font-semibold text-blue-900 mb-1">DEBUG - Active Hints:</p>
              <div className="flex flex-wrap gap-2">
                {activeHints.map((hint, index) => (
                  <span
                    key={index}
                    className="rounded bg-blue-200 px-2 py-0.5 text-xs text-blue-900 font-mono"
                  >
                    {hint.word} (path: {hint.path.join(',')})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Discovered hint words section */}
          {discoveredHintWords.length > 0 && (
            <div className="border-b border-black px-4 py-2">
              <p className="text-xs font-semibold text-black mb-1">Discovered Words:</p>
              <div className="flex flex-wrap gap-1">
                {discoveredHintWords.map((word, index) => (
                  <span
                    key={index}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-black"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main footer controls */}
          <div className="flex h-[53px] items-center justify-between px-12 py-0">
            <div className="flex items-center gap-4">
              <HintButton
                hintsEarned={hintsEarned}
                hintProgress={hintProgress}
                disabled={hintsEarned === 0}
                onClick={handleUseHint}
              />
              {hintProgress > 0 && (
                <span className="text-sm text-black">
                  {hintProgress}/3 toward next hint
                </span>
              )}
              {hintProgress === 0 && hintsEarned === 0 && discoveredHintWords.length === 0 && (
                <span className="text-xs text-gray-600">
                  Find valid words to earn hints
                </span>
              )}
            </div>
            <p className="text-base leading-none text-black">
              <span className="font-bold">{foundThemeWords}</span>
            {' out '}
            <span className="font-bold">{themeWords.length}</span>
            {' theme words found'}
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Backward compatibility export
