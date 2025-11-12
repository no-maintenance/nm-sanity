import {CircleHelp, Lock} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from '~/components/ui/button';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {gridToString} from '~/lib/games/strands-logic';
import {useStrandsGame} from '~/hooks/games/use-strands-game';
import {useStrandsInput} from '~/hooks/games/use-strands-input';
import {StrandsBoard} from './strands-board';
import {HintButton} from './hint-button';
import {HintWordAnimation} from './hint-word-animation';

const GRID_ROWS = 8;
const GRID_COLS = 6;

interface StrandsGameProps {
  /** The puzzle data from Sanity */
  puzzle: SanityStrandsPuzzle;
  /** Handler for early access button click */
  onJoinEarlyAccess?: () => void;
  /** Handler for help icon click */
  onHelpClick?: () => void;
}

export function StrandsGame({
  puzzle,
  onJoinEarlyAccess,
  onHelpClick,
}: StrandsGameProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const [cellPositions, setCellPositions] = useState<Map<number, {x: number; y: number}>>(new Map());
  const [animationData, setAnimationData] = useState<{
    sourcePositions: Array<{x: number; y: number}>;
    targetPosition: {x: number; y: number};
  } | null>(null);

  // Transform puzzle data
  const gridData = puzzle.generatedGrid || '';
  const gridString = gridToString(gridData);
  const gridLetters = gridString.split('').slice(0, 48);

  const theme = puzzle.theme?.clue || puzzle.title;
  const countdown = '02:26:03'; // TODO: Implement actual countdown

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
            JOIN FOR EARLY ACCESS
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col items-center gap-2">
        {/* Countdown banner */}
        <div className="w-full border-b border-black">
          <div className="flex items-center justify-between px-3 py-2 text-sm text-black">
            <p className="font-normal">Early access for private sale begins in...</p>
            <p className="font-bold">{countdown}</p>
          </div>
        </div>

        {/* Theme display */}
        <div className="pt-[11px]">
          <div className="h-12 w-[282px] rounded-md border border-black">
            <div className="flex h-full flex-col items-center justify-center">
              <div className="w-full border-b border-black py-0.5 text-center">
                <p className="w-[92px] mx-auto text-[10px] text-black">Today&apos;s Theme</p>
              </div>
              <div className="flex flex-1 items-center justify-center px-[39px] py-1.5">
                <p className="text-sm text-black">{theme}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[48px] items-center justify-center">
          {state.notificationMessage ? (
            <p className="text-lg font-medium leading-normal text-red-600 animate-in fade-in duration-200">
              {state.notificationMessage}
            </p>
          ) : state.currentWord ? (
            <p className="text-2xl font-bold leading-normal tracking-[0.2em] text-black">
              {state.currentWord}
            </p>
          ) : null}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="relative mx-auto max-w-md">
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
      <div className="w-full mt-4">
        <div className="flex items-center justify-between px-5 py-0">
          <div className="flex items-center gap-4">
          <HintButton ref={hintButtonRef} hintsEarned={state.hintsEarned} hintProgress={state.hintProgress} disabled={state.hintsEarned === 0} onClick={actions.useHint} />
          </div>
          <p className="text-base leading-none text-black">
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

