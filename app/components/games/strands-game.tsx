import { CircleHelp, Lock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import type { SanityStrandsPuzzle } from '~/lib/games/strands.queries';
import { getGridString, getGridData } from '~/lib/games/grid-utils';
import { useStrandsGame } from '~/hooks/games/use-strands-game';
import { useStrandsInput } from '~/hooks/games/use-strands-input';
import { useCountdown } from '~/hooks/use-countdown';
import { StrandsBoard } from './strands-board';
import { HintButton } from './hint-button';
import { HintWordAnimation } from './hint-word-animation';
import { HintDisabledDialog } from './hint-disabled-dialog';
import { JoinEarlyAccessDialog } from './join-early-access-dialog';
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
  /** Whether to show completion animation (fade out non-spangram) */
  showCompletionAnimation?: boolean;
  /** Whether to fade out spangram (delayed) */
  fadeOutSpangram?: boolean;
}

export function StrandsGame({
  puzzle,
  onPuzzleComplete,
  protectionCountdown,
  isProtected,
  hideHeaderOnMobile = false,
  hideThemeDisplay = false,
  showCompletionAnimation = false,
  fadeOutSpangram = false,
}: StrandsGameProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const [cellPositions, setCellPositions] = useState<Map<number, { x: number; y: number }>>(new Map());
  const [animationData, setAnimationData] = useState<{
    sourcePositions: Array<{ x: number; y: number }>;
    targetPosition: { x: number; y: number };
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

  // Use countdown hook for protection countdown
  const { formatted: countdownDisplay } = useCountdown({
    targetDate: protectionCountdown,
  });

  // Game state management
  const { state, actions } = useStrandsGame(puzzle);

  // No cell-level locking - all cells remain selectable
  // Word-level locking is handled in submitWord (prevents finding same word twice)
  const usedCells = new Set<number>();

  // Input handling
  const { handlers: inputHandlers } = useStrandsInput(
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

  const countdownLabel = 'SALE BEGINS IN'

  const alignedRowClass = 'mx-auto w-full max-w-[400px]';

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
  const handleGetCellPositions = useCallback((positions: Map<number, { x: number; y: number }>) => {
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
      const sourcePositions: Array<{ x: number; y: number }> = [];

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

        sourcePositions.push({ x: viewportX, y: viewportY });
      });

      // Calculate target position (hint button center, viewport coordinates)
      const targetPosition = {
        x: hintButtonRect.left + hintButtonRect.width / 2,
        y: hintButtonRect.top + hintButtonRect.height / 2,
      };
      if (sourcePositions.length > 0) {
        setAnimationData({ sourcePositions, targetPosition });
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
        <div className="flex items-center justify-between py-2 md:hidden px-2 sm:px-6 gap-2">
          <Button size="sm" className="w-full">
            Rules
          </Button>
          <JoinEarlyAccessDialog open={joinOpen} onOpenChange={setJoinOpen}>
            <Button size="sm" className="w-full">
              Join For Password
            </Button>
          </JoinEarlyAccessDialog>
          {isProtected && (
            <Button size="sm" className="w-full">
              Enter
            </Button>
          )}

        </div>
        {/* Mobile countdown banner */}
        <div className="md:hidden">
          <CountdownBanner
            countdown={countdownDisplay}
            label={countdownLabel}
          />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center  px-4 py-6 sm:px-6">
        <div>

          {/* Today's Theme */}
          {!hideThemeDisplay && theme && (
            <div className={`${alignedRowClass} mb-1`}>
              <div className="h-12 w-full rounded-md border border-foreground">
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="w-full border-b border-foreground py-0.5 text-center">
                    <p className="text-[10px] uppercase">Today&apos;s Theme</p>
                  </div>
                  <div className="flex flex-1 items-center justify-center px-4 ">
                    <p className="text-sm font-medium uppercase">
                      {theme}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`${alignedRowClass} px-2 mb-2`}>
            <div className="flex min-h-[32px] md:min-h-[36px] items-center justify-center">
              {state.notificationMessage ? (
                <p className="text-base md:text-lg lg:text-xl font-bold leading-normal text-destructive uppercase">
                  {state.notificationMessage}
                </p>
              ) : state.currentWord ? (
                <p className="text-xl  font-bold leading-normal tracking-[0.15em]">
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
              showCompletionAnimation={showCompletionAnimation}
              fadeOutSpangram={fadeOutSpangram}
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
                <p className="text-sm md:text-base lg:text-lg leading-none">
                  <span className="font-bold">{foundThemeWords}</span>
                  {' out '}
                  <span className="font-bold">{puzzle.themeWords.length}</span>
                  {' theme words found'}
                </p>
              </div>
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
