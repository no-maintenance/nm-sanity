import {CircleHelp, Lock} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from '~/components/ui/button';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {getGridString, getGridData} from '~/lib/games/grid-utils';
import {useStrandsGame} from '~/hooks/games/use-strands-game';
import {useStrandsInput} from '~/hooks/games/use-strands-input';
import {StrandsBoard} from './strands-board';
import {HintButton} from './hint-button';
import {HintWordAnimation} from './hint-word-animation';
import {GameHelpDialog} from './game-help-dialog';
import {HintDisabledDialog} from './hint-disabled-dialog';
import {JoinEarlyAccessDialog} from './join-early-access-dialog';
import {PasswordEntryDrawer} from './password-entry-drawer';

const GRID_ROWS = 8;
const GRID_COLS = 6;

interface StrandsGameProps {
  /** The puzzle data from Sanity */
  puzzle: SanityStrandsPuzzle;
  /** Handler called when puzzle is completed */
  onPuzzleComplete?: () => void;
  /** External countdown from protection config (overrides internal) */
  protectionCountdown?: string;
  /** Whether this puzzle is in a protected context */
  isProtected?: boolean;
}

export function StrandsGame({
  puzzle,
  onPuzzleComplete,
  protectionCountdown,
  isProtected,
}: StrandsGameProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const [cellPositions, setCellPositions] = useState<Map<number, {x: number; y: number}>>(new Map());
  const [animationData, setAnimationData] = useState<{
    sourcePositions: Array<{x: number; y: number}>;
    targetPosition: {x: number; y: number};
  } | null>(null);

  // Dialog/drawer state
  const [helpOpen, setHelpOpen] = useState(false);
  const [hintDisabledOpen, setHintDisabledOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Transform puzzle data - use canonical grid if available
  const gridData = getGridData(puzzle);
  const gridString = getGridString(puzzle);
  const gridLetters = gridString.split('').slice(0, 48);

  const theme = puzzle.theme?.clue || puzzle.title;

  // Calculate countdown if protection countdown is provided
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!protectionCountdown) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(protectionCountdown);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [protectionCountdown]);

  const countdownDisplay = protectionCountdown && timeLeft
    ? `${timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
    : '02:26:03'; // Fallback for testing without protection

  // Game state management
  const {state, actions} = useStrandsGame(puzzle);

  // No cell-level locking - all cells remain selectable
  // Word-level locking is handled in submitWord (prevents finding same word twice)
  const usedCells = new Set<number>();

  // Input handling
  const {handlers: inputHandlers} = useStrandsInput(
    state.currentPath,
    actions.selectCell,
    actions.submitWord,
    actions.clearPath,
    usedCells,
  );

  // Count found theme words
  const foundThemeWords = puzzle.themeWords.filter(tw =>
    state.foundWords.has(tw.word.toUpperCase())
  ).length;

  // Check for puzzle completion
  useEffect(() => {
    if (foundThemeWords === puzzle.themeWords.length && onPuzzleComplete) {
      // All theme words found - puzzle complete!
      onPuzzleComplete();
    }
  }, [foundThemeWords, puzzle.themeWords.length, onPuzzleComplete]);

  // Handle keyboard on cells
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (usedCells.has(index)) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputHandlers.handlePointerDown(index);
    }
  };

  // Store cell positions when updated from StrandsBoard
  const handleGetCellPositions = useCallback((positions: Map<number, {x: number; y: number}>) => {
    setCellPositions(positions);
  }, []);

  // Calculate animation positions when hint word animation path is set
  useEffect(() => {
    const animationPath = state.hintWordAnimationPath;
    if (!animationPath || animationPath.length === 0) {
      return;
    }

    // If cell positions aren't ready yet, wait a bit longer
    // The effect will re-run when cellPositions changes
    if (cellPositions.size === 0) {
      console.log('[Hint Animation] Waiting for cell positions...');
      return;
    }

    // Wait a tick to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!gridRef.current || !hintButtonRef.current) {
        console.warn('[Hint Animation] Missing refs:', {
          grid: !!gridRef.current,
          button: !!hintButtonRef.current,
        });
        return;
      }

      const gridContainer = gridRef.current;
      const gridRect = gridContainer.getBoundingClientRect();
      const hintButtonRect = hintButtonRef.current.getBoundingClientRect();

      // Calculate source positions (viewport coordinates)
      const sourcePositions: Array<{x: number; y: number}> = [];
      
      animationPath.forEach((cellIndex) => {
        // Get relative position from cellPositions (relative to grid container)
        const relativePos = cellPositions.get(cellIndex);
        if (!relativePos) {
          console.warn('[Hint Animation] Missing position for cell:', cellIndex);
          return;
        }

        // Convert to viewport coordinates
        const viewportX = gridRect.left + relativePos.x;
        const viewportY = gridRect.top + relativePos.y;
        
        sourcePositions.push({x: viewportX, y: viewportY});
      });

      // Calculate target position (hint button center, viewport coordinates)
      const targetPosition = {
        x: hintButtonRect.left + hintButtonRect.width / 2,
        y: hintButtonRect.top + hintButtonRect.height / 2,
      };

      console.log('[Hint Animation] Setting animation data:', {
        sourceCount: sourcePositions.length,
        target: targetPosition,
        pathLength: animationPath.length,
      });

      if (sourcePositions.length > 0) {
        setAnimationData({sourcePositions, targetPosition});
      } else {
        console.warn('[Hint Animation] No source positions calculated');
      }
    }, 100); // Increased delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, [state.hintWordAnimationPath, cellPositions]);

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    setAnimationData(null);
    actions.clearAnimationPath();
  }, [actions]);

  // Click outside grid resets word
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        actions.clearPath();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [actions]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-black">
        <div className="flex items-center justify-between p-[10px] md:px-6 md:py-4">
          {/* Left: Icon buttons */}
          <div className="flex items-center gap-2.5 py-2.5 md:gap-4 relative">
            <GameHelpDialog open={helpOpen} onOpenChange={setHelpOpen}>
              <button
                className="flex size-6 md:size-8 items-center justify-center transition-opacity hover:opacity-70"
                aria-label="Help"
                type="button"
              >
                <CircleHelp className="size-6 md:size-8" />
              </button>
            </GameHelpDialog>

            {isProtected && (
              <PasswordEntryDrawer
                open={passwordOpen}
                onOpenChange={setPasswordOpen}
              >
                <Lock className="size-6 md:size-8" />
              </PasswordEntryDrawer>
            )}
          </div>

          {/* Right: Call to action button */}
          <JoinEarlyAccessDialog open={joinOpen} onOpenChange={setJoinOpen}>
            <Button className="h-auto rounded-[3px] bg-[#2c2c2c] px-3 py-3 md:px-6 md:py-4 text-base md:text-lg font-medium text-[#f5f5f5] hover:bg-[#2c2c2c]/90">
              JOIN FOR EARLY ACCESS
            </Button>
          </JoinEarlyAccessDialog>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col items-center gap-2 md:gap-4 lg:gap-6">
        {/* Countdown banner */}
        <div className="w-full border-b border-black">
          <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3 text-sm md:text-base text-black">
            <p className="font-normal">
              {isProtected && protectionCountdown
                ? 'Access expires in...'
                : 'Early access for private sale begins in...'}
            </p>
            <p className="font-bold">{countdownDisplay}</p>
          </div>
        </div>

        {/* Theme display */}
        <div className="pt-[11px] md:pt-6">
          <div className="h-12 md:h-16 lg:h-20 w-[282px] md:w-[400px] lg:w-[480px] rounded-md border border-black">
            <div className="flex h-full flex-col items-center justify-center">
              <div className="w-full border-b border-black py-0.5 md:py-1 text-center">
                <p className="w-[92px] md:w-auto mx-auto text-[10px] md:text-xs lg:text-sm text-black">Today&apos;s Theme</p>
              </div>
              <div className="flex flex-1 items-center justify-center px-[39px] md:px-12 py-1.5 md:py-2">
                <p className="text-sm md:text-lg lg:text-xl text-black">{theme}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[48px] md:min-h-[64px] items-center justify-center px-4">
          {state.notificationMessage ? (
            <p className="text-lg md:text-xl lg:text-2xl font-medium leading-normal text-red-600 animate-in fade-in duration-200">
              {state.notificationMessage}
            </p>
          ) : state.currentWord ? (
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold leading-normal tracking-[0.2em] text-black">
              {state.currentWord}
            </p>
          ) : null}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="relative mx-auto w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl px-4 md:px-6">
          <StrandsBoard
            grid={gridData}
            gridLetters={gridLetters}
            currentPath={state.currentPath}
            foundWords={state.foundWords}
            cellColors={state.cellColors}
            wordPaths={state.wordPaths}
            invalidWordAnimationPath={state.invalidWordAnimationPath}
            onPointerDown={inputHandlers.handlePointerDown}
            onPointerEnter={inputHandlers.handlePointerEnter}
            onPointerUp={inputHandlers.handlePointerUp}
            onCellClick={inputHandlers.handleCellClick}
            onKeyDown={handleKeyDown}
            onGetCellPositions={handleGetCellPositions}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full mt-4 md:mt-6 lg:mt-8">
        <div className="flex items-center justify-between px-5 md:px-8 lg:px-12 py-0">
          <div className="flex items-center gap-4">
            {state.hintsEarned === 0 ? (
              <HintDisabledDialog open={hintDisabledOpen} onOpenChange={setHintDisabledOpen}>
                <HintButton
                  ref={hintButtonRef}
                  hintsEarned={state.hintsEarned}
                  hintProgress={state.hintProgress}
                  disabled={true}
                />
              </HintDisabledDialog>
            ) : (
              <HintButton
                ref={hintButtonRef}
                hintsEarned={state.hintsEarned}
                hintProgress={state.hintProgress}
                disabled={false}
                onClick={actions.useHint}
              />
            )}
          </div>
          <p className="text-base md:text-lg lg:text-xl leading-none text-black">
            <span className="font-bold">{foundThemeWords}</span>
            {' out '}
            <span className="font-bold">{puzzle.themeWords.length}</span>
            {' theme words found'}
          </p>
        </div>
      </div>

      {/* Hint word animation */}
      {animationData && (
        <HintWordAnimation
          sourcePositions={animationData.sourcePositions}
          targetPosition={animationData.targetPosition}
          onComplete={handleAnimationComplete}
        />
      )}
    </div>
  );
}

