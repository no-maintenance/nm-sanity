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
import { Logo } from '../layout/header-logo';
import { CountdownBanner } from './countdown-banner';

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
  /** Whether to hide header on mobile (for protected layout) */
  hideHeaderOnMobile?: boolean;
  /** Whether to hide theme display (shown in sidebar instead) */
  hideThemeDisplay?: boolean;
}

export function StrandsGame({
  puzzle,
  onPuzzleComplete,
  protectionCountdown,
  isProtected,
  hideHeaderOnMobile = false,
  hideThemeDisplay = false,
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

  const countdownLabel = 'Early access for private sale begins in...'

  const alignedRowClass = 'mx-auto w-full max-w-[400px]';

  const countdownUnits = [
    {label: 'Days', value: timeLeft?.days ?? 0},
    {label: 'Hours', value: timeLeft?.hours ?? 0},
    {label: 'Minutes', value: timeLeft?.minutes ?? 0},
    {label: 'Seconds', value: timeLeft?.seconds ?? 0},
  ];

  const hasLiveCountdown = Boolean(protectionCountdown && timeLeft);

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
    <div className="flex min-h-screen w-full flex-col ">
      {/* Header */}
      <header className="">
        <div>
            <Logo />
        </div>
        <div className="flex items-center justify-between md:px-6 py-4 md:hidden px-4 sm:px-6">
            <div className="flex items-center gap-2.5 md:gap-4 ">
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
                <PasswordEntryDrawer open={passwordOpen} onOpenChange={setPasswordOpen}>
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
        {/* Mobile countdown banner */}
        <div className="md:hidden">
          <CountdownBanner
            countdown={countdownDisplay}
            label={countdownLabel}
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center  px-4 py-6 sm:px-6">
        {/* Today's Theme */}
        {!hideThemeDisplay && theme && (
          <div className={`${alignedRowClass} mb-4`}>
            <div className="h-12 w-full rounded-md border border-black">
              <div className="flex h-full flex-col items-center justify-center">
                <div className="w-full border-b border-black py-0.5 text-center">
                  <p className="text-[10px] text-black uppercase">Today&apos;s Theme</p>
                </div>
                <div className="flex flex-1 items-center justify-center px-4 ">
                  <p className="text-sm text-black uppercase">
                    {theme}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${alignedRowClass} px-2`}>
          <div className="flex min-h-[32px] md:min-h-[48px] items-center justify-center">
            {state.notificationMessage ? (
              <p className="text-base md:text-lg lg:text-xl font-medium leading-normal text-red-600">
                {state.notificationMessage}
              </p>
            ) : state.currentWord ? (
              <p className="text-xl md:text-2xl lg:text-3xl font-bold leading-normal tracking-[0.15em] text-black">
                {state.currentWord}
              </p>
            ) : null}
          </div>
        </div>

        <div
          ref={gridRef}
          className={`relative ${alignedRowClass}`}
        >
          <StrandsBoard
            grid={gridData}
            gridLetters={gridLetters}
            currentPath={state.currentPath}
            foundWords={state.foundWords}
            cellColors={state.cellColors}
            wordPaths={state.wordPaths}
            invalidWordAnimationPath={state.invalidWordAnimationPath}
            discoveredWordAnimationPath={state.discoveredWordAnimationPath}
            activatedHintPath={state.activatedHintPath}
            onPointerDown={inputHandlers.handlePointerDown}
            onPointerEnter={inputHandlers.handlePointerEnter}
            onPointerUp={inputHandlers.handlePointerUp}
            onCellClick={inputHandlers.handleCellClick}
            onKeyDown={handleKeyDown}
            onGetCellPositions={handleGetCellPositions}
          />
        </div>

        <div className={`${alignedRowClass} w-full px-2`}>
          <div className="flex gap-4 pt-4 sm:flex-row sm:items-center justify-between">
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
            <div className="flex items-center gap-2 justify-end">
            <p className="text-sm md:text-base lg:text-lg leading-none text-black">
              <span className="font-bold">{foundThemeWords}</span>
              {' out '}
              <span className="font-bold">{puzzle.themeWords.length}</span>
              {' theme words found'}
            </p>
            </div>
          </div>
        </div>
      </div>

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
