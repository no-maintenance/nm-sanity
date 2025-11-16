import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {cn} from '~/lib/utils';
import {gridToString, HINT_COLOR, SPANGRAM_COLOR, type GridData} from '~/lib/games/strands-logic';

// Helper function to convert Tailwind color classes to CSS colors
function getColorFromTailwindClass(tailwindClass: string): string {
  // Map common Tailwind background colors to their RGB equivalents
  const colorMap: {[key: string]: string} = {
    'bg-amber-300': 'rgb(252, 211, 77)', // Spangram
    'bg-blue-200': 'rgb(191, 219, 254)',
    'bg-green-200': 'rgb(187, 247, 208)',
    'bg-yellow-200': 'rgb(254, 240, 138)',
    'bg-pink-200': 'rgb(251, 207, 232)',
    'bg-purple-200': 'rgb(233, 213, 255)',
    'bg-orange-200': 'rgb(254, 215, 170)',
    'bg-cyan-200': 'rgb(165, 243, 252)',
    'bg-rose-200': 'rgb(254, 205, 211)',
  };
  
  return colorMap[tailwindClass] || 'rgb(191, 219, 254)'; // Default to blue
}

// Helper function to get ring color class from background color class
function getRingColorClass(bgColorClass: string): string {
  const ringColorMap: {[key: string]: string} = {
    'bg-amber-300': 'ring-amber-300',
    'bg-blue-200': 'ring-blue-300',
    'bg-green-200': 'ring-green-300',
    'bg-yellow-200': 'ring-yellow-300',
    'bg-pink-200': 'ring-pink-300',
    'bg-purple-200': 'ring-purple-300',
    'bg-orange-200': 'ring-orange-300',
    'bg-cyan-200': 'ring-cyan-300',
    'bg-rose-200': 'ring-rose-300',
  };
  
  return ringColorMap[bgColorClass] || 'ring-blue-300';
}

const GRID_ROWS = 8;
const GRID_COLS = 6;

interface StrandsBoardProps {
  grid: GridData;
  gridLetters: string[];
  currentPath: number[];
  foundWords: Set<string>;
  cellColors: {[key: number]: string[]};
  wordPaths: {[word: string]: number[]};
  invalidWordAnimationPath?: number[] | null;
  discoveredWordAnimationPath?: number[] | null;
  activatedHintPath?: number[] | null;
  onPointerDown: (index: number) => void;
  onPointerEnter: (index: number) => void;
  onPointerUp?: () => void;
  onCellClick: (index: number) => void;
  onKeyDown?: (e: React.KeyboardEvent, index: number) => void;
  /** Callback to get cell positions for animation */
  onGetCellPositions?: (positions: Map<number, {x: number; y: number}>) => void;
  /** Whether to show completion animation (fade out non-spangram) */
  showCompletionAnimation?: boolean;
  /** Whether to fade out spangram (delayed) */
  fadeOutSpangram?: boolean;
}

export function StrandsBoard({
  grid,
  gridLetters,
  currentPath,
  foundWords,
  cellColors,
  wordPaths,
  invalidWordAnimationPath,
  discoveredWordAnimationPath,
  activatedHintPath,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  onCellClick,
  onKeyDown,
  onGetCellPositions,
  showCompletionAnimation = false,
  fadeOutSpangram = false,
}: StrandsBoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const cleanupFunctions = useRef<Map<number, () => void>>(new Map());
  const [cellPositions, setCellPositions] = useState<Map<number, {x: number; y: number}>>(new Map());
  const [containerSize, setContainerSize] = useState<{width: number; height: number}>({width: 0, height: 0});
  const multiTouchGestureRef = useRef(false);

  // Calculate cell center positions
  const calculatePositions = useCallback(() => {
    if (!gridRef.current) return;

    const positions = new Map<number, {x: number; y: number}>();
    const gridContainer = gridRef.current;
    const containerRect = gridContainer.getBoundingClientRect();
    const cells = gridContainer.querySelectorAll('[data-cell-index]');

    // Update container size for SVG viewBox
    setContainerSize({
      width: containerRect.width,
      height: containerRect.height,
    });

    cells.forEach((cell) => {
      const index = parseInt(cell.getAttribute('data-cell-index') || '0', 10);
      const rect = cell.getBoundingClientRect();
      
      // Calculate center position relative to container
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;
      
      positions.set(index, {x, y});
    });

    setCellPositions(positions);
    
    // Notify parent of positions if callback provided
    if (onGetCellPositions) {
      onGetCellPositions(positions);
    }
  }, [onGetCellPositions]);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      calculatePositions();
    }, 0);
    
    // Recalculate on window resize
    const handleResize = () => {
      calculatePositions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [gridLetters, currentPath, calculatePositions]); // Recalculate when grid or path changes

  // Helper function to attach touch listeners to a cell element
  const attachTouchListeners = useCallback((cellElement: HTMLDivElement, index: number) => {
    const cancelForMultiTouch = () => {
      if (!multiTouchGestureRef.current) {
        multiTouchGestureRef.current = true;
        onPointerUp?.();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        cancelForMultiTouch();
        return;
      }
      if (multiTouchGestureRef.current) {
        return;
      }
      e.preventDefault();
      onPointerDown(index);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        cancelForMultiTouch();
        return;
      }
      if (multiTouchGestureRef.current) {
        return;
      }
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.hasAttribute('data-cell-index')) {
        const touchIndex = parseInt(element.getAttribute('data-cell-index') || '0', 10);
        onPointerEnter(touchIndex);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (multiTouchGestureRef.current) {
        if (e.touches.length === 0) {
          multiTouchGestureRef.current = false;
        }
        return;
      }
      e.preventDefault();
      onPointerUp?.();
    };

    const handleTouchCancel = () => {
      multiTouchGestureRef.current = false;
      onPointerUp?.();
    };

    // Add listeners with {passive: false} to allow preventDefault
    cellElement.addEventListener('touchstart', handleTouchStart, {passive: false});
    cellElement.addEventListener('touchmove', handleTouchMove, {passive: false});
    cellElement.addEventListener('touchend', handleTouchEnd, {passive: false});
    cellElement.addEventListener('touchcancel', handleTouchCancel, {passive: false});

    // Return cleanup function
    return () => {
      cellElement.removeEventListener('touchstart', handleTouchStart);
      cellElement.removeEventListener('touchmove', handleTouchMove);
      cellElement.removeEventListener('touchend', handleTouchEnd);
      cellElement.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onPointerDown, onPointerEnter, onPointerUp]);

  // No cell-level locking - all cells remain selectable for hint words
  // Word-level locking prevents finding the same word twice
  const usedCells = new Set<number>();
  const spangramCells = new Set<number>();

  // Helper function to generate connector paths between cells
  const generateConnectorPaths = useCallback((
    path: number[],
    strokeColor: string,
  ): Array<{x1: number; y1: number; x2: number; y2: number; fromIndex: number; toIndex: number; color: string}> => {
    const paths: Array<{x1: number; y1: number; x2: number; y2: number; fromIndex: number; toIndex: number; color: string}> = [];
    
    if (path.length < 2 || cellPositions.size === 0) return paths;
    
    // Ring: h-7 w-7 (28px diameter = 14px radius) + ring-2 (2px width) = 16px outer radius
    // Stroke width is 8px, so half-width is 4px
    const RING_OUTER_RADIUS = 16;
    const STROKE_HALF_WIDTH = 4;
    const DIAGONAL_EXTRA = 2;
    
    for (let i = 0; i < path.length - 1; i++) {
      const fromIndex = path[i];
      const toIndex = path[i + 1];
      const fromPos = cellPositions.get(fromIndex);
      const toPos = cellPositions.get(toIndex);
      
      if (fromPos && toPos) {
        // Calculate direction vector
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          // Normalize direction vector
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          // Determine if this is a diagonal connection
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          const isDiagonal = Math.abs(absDx - absDy) < Math.max(absDx, absDy) * 0.3;
          
          // For non-diagonals: line center at outer radius - stroke half-width
          // For diagonals: extend further to ensure proper connection
          const ringRadius = isDiagonal 
            ? RING_OUTER_RADIUS - STROKE_HALF_WIDTH + DIAGONAL_EXTRA
            : RING_OUTER_RADIUS - STROKE_HALF_WIDTH;
          
          // Extend from center
          const x1 = fromPos.x + unitX * ringRadius;
          const y1 = fromPos.y + unitY * ringRadius;
          const x2 = toPos.x - unitX * ringRadius;
          const y2 = toPos.y - unitY * ringRadius;
          
          paths.push({
            x1,
            y1,
            x2,
            y2,
            fromIndex,
            toIndex,
            color: strokeColor,
          });
        }
      }
    }
    
    return paths;
  }, [cellPositions]);

  // Generate connector paths for current selection path
  const currentConnectorPaths = useMemo(() => {
    return generateConnectorPaths(currentPath, 'current');
  }, [currentPath, generateConnectorPaths]);

  // Generate connector paths for found words using stored word paths
  // Only connect consecutive cells in each word's path, not all adjacent cells
  const foundWordConnectorPaths = useMemo(() => {
    if (cellPositions.size === 0) return [];
    
    const allPaths: Array<{x1: number; y1: number; x2: number; y2: number; fromIndex: number; toIndex: number; color: string}> = [];
    
    // For each found word, get its path and generate connectors for consecutive cells
    Object.entries(wordPaths).forEach(([word, path]) => {
      // Skip if path is empty or has less than 2 cells
      if (!path || path.length < 2) return;
      
      // Get the color for this word from the first cell's colors
      const firstCellIndex = path[0];
      const firstCellColors = cellColors[firstCellIndex] || [];
      const themeColors = firstCellColors.filter(color => color !== HINT_COLOR);
      
      // Skip if no theme colors (shouldn't happen, but safety check)
      if (themeColors.length === 0) return;
      
      // Use the first theme color (or spangram color if present)
      const spangramColor = themeColors.find(color => color === SPANGRAM_COLOR);
      const wordColor = spangramColor || themeColors[0];
      
      // Generate connector paths for consecutive cells in the path
      for (let i = 0; i < path.length - 1; i++) {
        const fromIndex = path[i];
        const toIndex = path[i + 1];
        const fromPos = cellPositions.get(fromIndex);
        const toPos = cellPositions.get(toIndex);
        
        if (fromPos && toPos) {
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const unitX = dx / distance;
            const unitY = dy / distance;
            
            const RING_OUTER_RADIUS = 16;
            const STROKE_HALF_WIDTH = 4;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const isDiagonal = Math.abs(absDx - absDy) < Math.max(absDx, absDy) * 0.3;
            const ringRadius = isDiagonal 
              ? RING_OUTER_RADIUS - STROKE_HALF_WIDTH + 2
              : RING_OUTER_RADIUS - STROKE_HALF_WIDTH;
            
            allPaths.push({
              x1: fromPos.x + unitX * ringRadius,
              y1: fromPos.y + unitY * ringRadius,
              x2: toPos.x - unitX * ringRadius,
              y2: toPos.y - unitY * ringRadius,
              fromIndex,
              toIndex,
              color: wordColor,
            });
          }
        }
      }
    });
    
    return allPaths;
  }, [wordPaths, cellColors, cellPositions]);

  // Combine all connector paths
  const allConnectorPaths = useMemo(() => {
    return [...foundWordConnectorPaths, ...currentConnectorPaths];
  }, [foundWordConnectorPaths, currentConnectorPaths]);

  // Determine which cells are spangrams for visual indication only
  // Cells are not locked, so they can still be selected
  Object.entries(cellColors).forEach(([indexStr, colors]) => {
    const index = parseInt(indexStr, 10);
    // Check if any color is spangram color (amber) for visual indication
    if (colors.some(color => color.includes('amber'))) {
      spangramCells.add(index);
    }
  });

  // Safety check for grid
  if (!grid) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-8 text-center">
        <p className="text-red-700">Grid data is missing</p>
      </div>
    );
  }

  // Validate we have exactly 48 letters
  if (gridLetters.length !== 48) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-8 text-center">
        <p className="text-red-700">
          Invalid grid: Expected 48 letters, got {gridLetters.length}
        </p>
        <p className="mt-2 text-sm text-red-600">Grid: {gridLetters.join('')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes pulse-discovered {
          0% {
            transform: scale(1);
            outline: 0px solid currentColor;
            outline-offset: 0px;
          }
          30% {
            transform: scale(1.045);
            outline: 1.2px solid currentColor;
            outline-offset: 1.2px;
          }
          70% {
            transform: scale(1.015);
            outline: 0.9px solid currentColor;
            outline-offset: 1.8px;
          }
          100% {
            transform: scale(1);
            outline: 0px solid currentColor;
            outline-offset: 2.4px;
          }
        }
        .animate-pulse-discovered {
          animation: pulse-discovered 1s ease-out;
        }
        @keyframes fadeOutBlur {
          0% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            filter: blur(10px);
          }
        }
        .animate-fade-out-blur {
          animation: fadeOutBlur 1s ease-out forwards;
        }
      `}</style>
      <div
        ref={gridRef}
        className="relative mx-auto w-full select-none"
        style={{
          aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
        }}
      >
        {/* SVG overlay for connectors (found words and current selection) */}
        {allConnectorPaths.length > 0 && containerSize.width > 0 && containerSize.height > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
            preserveAspectRatio="none"
            style={{width: '100%', height: '100%'}}
          >
            {allConnectorPaths.map((path, idx) => {
              // Convert Tailwind color class to actual color
              // For found words, use the color; for current selection, use primary
              const strokeColor = path.color === 'current'
                ? 'currentColor' // Will use primary color via className
                : getColorFromTailwindClass(path.color);

              // Check if this connector is for a spangram word (amber color)
              const isSpangramConnector = path.color === SPANGRAM_COLOR;

              // Determine if this connector should fade
              const shouldFadeConnector = showCompletionAnimation && (
                !isSpangramConnector || fadeOutSpangram
              );

              return (
              <line
                  key={`connector-${path.fromIndex}-${path.toIndex}-${idx}`}
                x1={path.x1}
                y1={path.y1}
                x2={path.x2}
                y2={path.y2}
                  className={`${path.color === 'current' ? 'stroke-primary' : ''} ${shouldFadeConnector ? 'animate-fade-out-blur' : ''}`}
                  stroke={path.color !== 'current' ? strokeColor : undefined}
                  strokeWidth="8"
                strokeLinecap="round"
                opacity="1"
              />
              );
            })}
          </svg>
        )}
        <div
          className="grid gap-1.5 sm:gap-2 md:gap-4 lg:gap-5"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          }}
        >
          {gridLetters.map((letter, index) => {
            const isInCurrentPath = currentPath.includes(index);
            const isInInvalidAnimation = invalidWordAnimationPath?.includes(index) || false;
            const isInDiscoveredAnimation = discoveredWordAnimationPath?.includes(index) || false;
            const isInActivatedHint = activatedHintPath?.includes(index) || false;
            const isSpangram = spangramCells.has(index);
            const pathIndex = currentPath.indexOf(index);
            const colors = cellColors[index] || [];

            // Check if this cell is part of any found theme word
            const isInFoundThemeWord = Object.values(wordPaths).some(path => path.includes(index));

            // Separate hint colors from theme colors
            const hintColors = colors.filter(color => color === HINT_COLOR);
            // Only show theme colors if the cell is part of a found theme word
            const themeColors = isInFoundThemeWord
              ? colors.filter(color => color !== HINT_COLOR)
              : [];
            // Prioritize spangram color if present, otherwise use first theme color
            const spangramColor = themeColors.find(color => color === SPANGRAM_COLOR);
            const baseColor = spangramColor || (themeColors.length > 0 ? themeColors[0] : '');
            const overlayColors = themeColors.filter(color => color !== baseColor);

            // Don't include spangram info in aria-label to avoid hydration mismatch
            // The visual indication is sufficient for users
            const ariaLabel = `Cell ${index + 1}, letter ${letter}`;

            // Determine if this cell should fade out
            // Non-spangram cells fade immediately when showCompletionAnimation is true
            // Spangram cells only fade when fadeOutSpangram is true
            const shouldFadeOut = showCompletionAnimation && (
              !isSpangram || fadeOutSpangram
            );

            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) {
                    cellRefs.current.set(index, el);
                    // Clean up existing listeners if any
                    const existingCleanup = cleanupFunctions.current.get(index);
                    if (existingCleanup) {
                      existingCleanup();
                    }
                    // Attach new touch listeners with {passive: false}
                    const cleanup = attachTouchListeners(el, index);
                    cleanupFunctions.current.set(index, cleanup);
                  } else {
                    // Clean up when element is removed
                    const cleanup = cleanupFunctions.current.get(index);
                    if (cleanup) {
                      cleanup();
                      cleanupFunctions.current.delete(index);
                    }
                    cellRefs.current.delete(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={ariaLabel}
                className={cn(
                  'relative flex aspect-square items-center justify-center text-lg  font-bold',
                  'cursor-pointer rounded-lg transition-transform hover:scale-105',
                  isInInvalidAnimation && 'animate-shake',
                  shouldFadeOut && 'animate-fade-out-blur',
                )}
                onMouseDown={() => onPointerDown(index)}
                onMouseEnter={() => onPointerEnter(index)}
                onKeyDown={onKeyDown ? (e) => onKeyDown(e, index) : undefined}
                onClick={() => onCellClick(index)}
                data-cell-index={index}
              >
                {/* Activated hint indicators (dotted blue border) - only show when hint is activated */}
                {isInActivatedHint && !isInCurrentPath && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg
                      className="absolute w-8 h-8 sm:w-9 sm:h-9 md:w-12 md:h-12 lg:w-14 lg:h-14"
                      viewBox="0 0 36 36"
                      style={{
                        opacity: themeColors.length > 0 ? 0.5 : 1,
                      }}
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="rgb(96 165 250)" // blue-400
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                    </svg>
                  </div>
                )}

                {/* Found word indicators (rounded circles like selection) */}
                {themeColors.length > 0 && !isInCurrentPath && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Base color circle (spangram or first theme color) */}
                    {baseColor && (
                      <div className={cn(
                        'h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9  aspect-square rounded-full ring-2 md:ring-[3px]',
                        baseColor,
                        getRingColorClass(baseColor),
                        isInDiscoveredAnimation && 'animate-pulse-discovered'
                      )} />
                    )}
                    {/* Overlay colors for cells in multiple words */}
                {overlayColors.map((color, i) => {
                  const colorHash = color.replace(/\s+/g, '-');
                  return (
                    <div
                          key={`overlay-circle-${index}-${colorHash}-${i}`}
                      className={cn(
                            'absolute h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-10 lg:w-10 aspect-square rounded-full ring-2 md:ring-[3px] pointer-events-none opacity-60',
                        color,
                            getRingColorClass(color)
                      )}
                      style={{
                            transform: `rotate(${i * 45}deg)`,
                            clipPath: `polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)`
                      }}
                    />
                  );
                })}
                  </div>
                )}

                {/* Selection indicator */}
                {isInCurrentPath && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={cn(
                      "h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-10 lg:w-10 aspect-square rounded-full ring-2 md:ring-[3px]",
                      isInInvalidAnimation
                        ? "ring-red-500 bg-red-100"
                        : "ring-primary bg-primary text-primary-foreground"
                    )} />
                    {pathIndex === currentPath.length - 1 && (
                      <svg
                        className="absolute pointer-events-none w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14"
                        viewBox="0 0 44 44"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M43.6096 22.9547C43.5803 23.7303 43.4481 24.7369 43.2912 25.4939C43.2426 25.7306 43.2383 25.6055 43.2025 25.768C43.1317 26.0841 43.0806 26.3859 42.9949 26.6958C42.9662 26.7984 42.9561 26.6599 42.9268 26.7675C42.7659 27.3562 42.6183 27.9152 42.4158 28.501C41.4166 31.3791 39.8667 34.0066 37.789 36.2714C37.1055 37.0208 36.1871 37.8426 35.3853 38.5125C35.2919 38.5909 35.3715 38.5737 35.3554 38.5907C35.0999 38.8553 35.148 38.7212 34.9546 38.8597C34.1856 39.4077 33.313 39.9874 32.5344 40.4528C32.2025 40.65 32.5754 40.5225 32.2158 40.6776C32.1909 40.6883 32.2575 40.6065 32.1629 40.6543C31.9487 40.7637 31.5498 40.9806 31.3814 41.0604C31.0574 41.2146 31.0043 41.2402 30.697 41.3821C30.2753 41.5752 29.7608 41.77 29.2985 41.9529C29.1998 41.992 29.3458 41.9804 29.189 42.046C29.0327 42.1123 28.6084 42.2565 28.4611 42.2938C28.3143 42.332 28.3658 42.2818 28.3381 42.2832C28.1102 42.2948 27.641 42.5218 27.576 42.5409C26.414 42.9038 25.3731 43.056 24.2438 43.1929C23.3904 43.2957 22.4764 43.3628 21.6534 43.3599C21.6466 43.3598 21.6398 43.3598 21.633 43.3598C20.6472 43.3539 19.8214 43.2779 18.8732 43.1626C18.7734 43.15 18.8843 43.2121 18.7622 43.1966C17.4646 43.0297 16.1911 42.7362 14.9631 42.3055C14.8399 42.262 15.0126 42.2747 14.8906 42.2289C14.1401 41.9566 13.0146 41.4023 12.5126 41.3594C12.0247 41.1268 11.444 40.8184 11.0413 40.5487C10.7822 40.3745 11.0664 40.486 10.7268 40.3113C10.6505 40.2714 10.7269 40.3623 10.6139 40.2996C10.1376 40.0346 9.64511 39.7007 9.19237 39.4069C9.10025 39.3472 9.10432 39.3933 9.07521 39.3805C8.83073 39.2717 8.53264 38.9415 8.46204 38.8785C7.91882 38.4015 7.50583 38.076 7.01005 37.6226C6.89549 37.5168 6.99888 37.6768 6.88752 37.5759C6.31088 37.0514 5.75099 36.4663 5.26691 35.8767C5.15948 35.7454 5.29217 35.8368 5.24255 35.7727C5.02512 35.4898 4.91578 35.4776 4.71327 35.2005C4.67078 35.1419 4.72332 35.1521 4.71806 35.1394C4.63658 34.9417 4.4611 34.8521 4.42721 34.8109C4.00059 34.292 3.82624 33.8892 3.4642 33.3556C3.42101 33.2914 3.47844 33.4621 3.3594 33.2797C2.56681 32.0639 1.88481 30.6764 1.41078 29.3222C1.33707 29.1114 1.42414 29.249 1.42295 29.2344C1.40208 28.9981 1.27367 28.8891 1.24632 28.8213C1.0336 28.2875 0.948364 27.7551 0.747624 27.4064C0.256144 25.5162 -0.0309943 23.58 0.00266396 21.6386C0.010988 21.158 0.0384448 20.6878 0.0873834 20.2117C0.0904394 20.1812 0.12863 20.2386 0.134572 20.1779C0.212866 19.448 0.139196 19.587 0.112712 19.0912C0.106285 18.9658 0.250799 18.6086 0.263033 18.5777C0.305686 18.4629 0.349787 18.5945 0.360443 18.5556C0.44798 18.236 0.234521 18.2554 0.311319 17.8112C0.314117 17.7974 0.341138 17.8623 0.351448 17.8258C0.383611 17.7125 0.390048 17.5957 0.424706 17.4859C0.505211 17.2354 0.620648 17.1637 0.652435 16.762C0.657069 16.7112 0.523037 16.7595 0.624134 16.371C0.661906 16.2163 0.848346 15.5296 0.916077 15.3437C0.981168 15.1565 0.977443 15.2976 0.983117 15.2846C1.19031 14.7903 1.15015 14.9897 1.30357 14.7606C1.45867 14.5334 1.2697 14.5459 1.28717 14.4367C1.30409 14.3274 1.47849 13.9744 1.52713 13.8905C1.57501 13.8063 1.55423 13.9264 1.59252 13.8499C1.84897 13.3456 1.60316 13.5875 1.64726 13.4042C1.75482 12.9717 2.01499 12.7091 2.19845 12.3537C2.24851 12.2574 2.18335 12.3245 2.22306 12.2359C2.38234 11.8856 2.52277 11.6991 2.69827 11.2981C2.72658 11.2326 2.83098 10.8844 2.99712 10.7161C3.02069 10.6924 3.00188 10.7879 3.09122 10.6509C3.22404 10.4464 3.46259 10.0762 3.59787 9.85153C3.69765 9.68534 3.53052 9.84121 3.67943 9.64698C3.74597 9.56105 3.65993 9.7451 3.78287 9.5826C3.90438 9.42006 4.20213 8.99698 4.31961 8.83909C4.43586 8.68077 4.33939 8.74286 4.34662 8.72848C4.39096 8.64143 4.60638 8.32944 4.62772 8.30359C5.66907 6.97298 6.81784 5.91044 8.07391 4.85988C8.17291 4.77769 8.07948 4.79831 8.0943 4.78543C8.42832 4.49637 8.22645 4.80114 8.49139 4.64185C8.40336 4.60094 8.55531 4.5005 8.79851 4.30773C8.91582 4.21508 8.83056 4.23652 8.83946 4.22563C8.98824 4.05272 9.15345 4.01676 9.19348 4.00483C9.34175 3.96044 9.43989 3.82168 9.54137 3.79279C9.64235 3.76414 9.47989 3.9324 9.72519 3.76644C9.77724 3.69442 9.54851 3.74955 9.72929 3.61332C10.4072 3.0862 11.8377 2.36881 12.466 2.09584C13.0887 1.81335 13.2934 1.72678 13.6663 1.58766C14.3445 1.34552 14.0781 1.38508 14.4898 1.20738C14.9059 1.03463 14.7467 1.24671 14.8178 1.25581C14.8876 1.26594 14.9426 1.21326 15.0227 1.20567C15.1024 1.19828 14.9482 1.27068 15.125 1.22072C15.3017 1.16929 15.7648 0.973839 15.8199 0.925225C15.9343 0.820873 15.6939 0.807739 16.1748 0.706361C16.2025 0.700747 16.1237 0.761426 16.2292 0.738068C17.0617 0.552931 17.9359 0.384444 18.7826 0.298925C18.899 0.287305 18.801 0.343833 18.8687 0.337659C19.5751 0.279785 19.3165 0.238786 19.6955 0.119984C19.6188 0.236456 19.8365 0.276892 20.3727 0.24459C20.6964 0.22707 20.6364 0.183724 20.844 0.142009C20.9062 0.129353 21.1357 0.155169 21.1767 0.132424C21.3124 0.0582653 21.0936 -0.0229532 21.6534 0.00598971C21.6537 0.00600306 21.6539 0.00601643 21.6541 0.00602982C21.6628 0.00657195 21.6587 0.0118491 21.6534 0.0185617C21.6465 0.0273901 21.6377 0.0387019 21.6534 0.0449791C21.6597 0.0474688 21.6698 0.0491685 21.6853 0.0496319C22.233 0.0695968 22.2983 -0.00532272 22.8896 0.0150841C23.3555 0.0308325 24.1711 0.154496 24.6908 0.23868C24.6632 0.356253 25.1558 0.401262 25.3694 0.355215C25.7059 0.416846 26.0674 0.484019 26.3884 0.567865C26.4985 0.59668 26.4178 0.614521 26.431 0.621368C26.6315 0.727832 26.7935 0.684202 26.8659 0.698809C27.6498 0.863155 28.254 1.11301 28.9907 1.31322C29.0167 1.32047 29.0872 1.25555 29.2576 1.38499C29.2684 1.39366 29.019 1.34058 29.354 1.47019C29.6895 1.59946 30.2952 1.89936 30.7614 2.0762C30.8741 2.11799 31.18 2.18819 31.3748 2.34696C31.4007 2.36815 31.358 2.37361 31.3938 2.40684C31.5095 2.51381 31.6226 2.47636 31.7463 2.62386C31.8695 2.77152 32.1683 2.99304 32.6216 3.20514C32.636 3.21205 32.7721 3.21438 32.906 3.298C33.1197 3.43089 33.4122 3.63543 33.6296 3.78157C33.7337 3.85151 33.6906 3.77192 33.7091 3.78347C34.4216 4.24154 34.8824 4.63445 35.564 5.2291C35.6889 5.33769 36.0865 5.60918 36.2908 5.86227C36.5129 6.14068 36.115 6.0366 36.722 6.56387C36.963 6.77765 37.4431 6.89558 37.7326 7.42602C38.511 8.258 39.0913 9.14011 39.7469 10.0719C39.7764 10.1137 39.925 10.212 39.9879 10.3157C40.0811 10.4696 40.1025 10.5715 40.1659 10.6826C40.4302 11.149 40.6905 11.5667 40.9182 12.0319C41.0041 12.2088 40.9426 12.1627 41.0424 12.3742C41.141 12.5857 41.2494 12.7077 41.357 13.0074C41.4378 13.2345 41.4433 13.4904 41.5491 13.788C41.64 13.7649 41.7206 13.9677 41.8762 14.3241C41.9059 14.3925 41.9094 14.3063 41.9251 14.3382C41.9896 14.4677 42.0079 14.6022 42.069 14.7256C42.0838 14.7557 42.1145 14.747 42.1283 14.7711C42.2476 14.976 42.2922 15.3632 42.2981 15.4287C42.3242 15.6818 42.3956 15.7829 42.4284 15.9735C42.4603 16.1636 42.3633 15.8928 42.4103 16.112C42.5074 16.5645 42.6449 17.1444 42.7298 17.6053C42.7641 17.7893 42.7823 17.656 42.7882 17.6822C42.8704 18.062 42.8845 18.4585 42.9975 18.659C42.8151 18.9551 43.0536 18.8872 43.0691 19.4479C43.0699 19.4916 42.9724 19.5572 42.9402 19.3922C42.9078 19.2269 42.9108 18.9707 42.856 18.7442C42.8437 18.69 42.7025 18.395 42.6896 18.3537C42.592 18.0299 42.7346 17.9577 42.7404 17.9384C42.7971 17.7226 42.6203 17.3651 42.5919 17.2679C42.4647 16.8201 42.3934 16.4364 42.2698 16.0676C42.1885 15.8273 42.0836 15.8316 42.0316 15.6414C41.8537 15.0127 41.9125 14.7447 41.584 14.2053C41.512 14.0902 41.4582 14.2521 41.3659 13.7789C41.3605 13.7492 41.3018 13.3923 41.1733 13.2244C41.1573 13.2033 41.1279 13.2169 41.112 13.1871C41.0054 12.987 40.9671 12.839 40.8515 12.6215C40.736 12.4047 40.5886 12.1467 40.4691 11.8929C40.3973 11.7398 40.3475 11.5204 40.321 11.4418C40.2479 11.2193 40.0648 11.0401 40.0373 10.8917C40.0088 10.7416 40.2207 10.9443 40.0556 10.6016C39.9763 10.6329 39.8859 10.65 39.802 10.6747C39.3789 9.97042 38.9425 9.28741 38.4334 8.63708C38.3702 8.55667 38.3988 8.66688 38.33 8.58171C38.0393 8.22344 37.8053 7.89256 37.4771 7.54288C37.2228 7.2725 36.9097 7.00916 36.6286 6.74395C36.5312 6.50754 36.0938 6.12973 35.7874 5.846C35.6802 5.74622 35.7044 5.7336 35.6316 5.65845C35.3545 5.37691 35.4381 5.56268 35.3478 5.50271C34.958 5.25012 35.0506 5.07531 34.6146 4.74236C34.5916 4.724 34.2472 4.593 34.2043 4.57029C33.9307 4.42188 34.1844 4.51104 34.0321 4.39147C33.753 4.17471 33.5636 4.01391 33.1999 3.81258C33.0935 3.75376 32.8155 3.65254 32.6404 3.48902C32.6174 3.4675 32.6495 3.44734 32.6293 3.43278C32.2597 3.173 32.1942 3.26124 31.9536 3.16666C31.7128 3.07219 31.3982 2.82389 31.3351 2.76843C31.172 2.62316 31.4901 2.82163 31.5023 2.82277C31.6512 2.82891 31.3898 2.70268 31.1934 2.5986C31.2119 2.49037 30.9285 2.35837 30.9893 2.49169C30.9964 2.5063 31.1558 2.57414 31.1934 2.5986C30.9727 2.60232 30.6649 2.46611 30.3609 2.22478C30.2177 2.11281 30.3931 2.12859 29.8907 1.93572C29.6624 1.85039 29.7221 1.95263 29.5162 1.89092C29.0455 1.75012 28.4712 1.47473 27.9832 1.33519C27.8075 1.28489 27.966 1.37491 27.8456 1.34216C27.5262 1.25625 27.252 1.14874 26.9248 1.08047C26.8953 1.07444 26.9563 1.13242 26.8563 1.10757C26.0966 0.922205 25.4305 0.763137 24.6195 0.647226C24.2283 0.589434 23.522 0.538425 23.1137 0.508756C22.6545 0.472135 22.1366 0.427265 21.6534 0.413232C21.3871 0.405216 21.1361 0.406054 20.9203 0.418592C20.5253 0.442926 20.615 0.481914 20.4465 0.518632C20.1222 0.589071 19.541 0.544008 19.4613 0.538498C19.4591 0.537655 19.7962 0.49588 19.6137 0.491892C19.5043 0.45807 19.4652 0.537945 19.4613 0.538498C19.4084 0.531464 18.7297 0.60361 18.5982 0.633634C18.5263 0.648413 18.5725 0.681164 18.535 0.688187C17.639 0.855878 16.7551 1.05496 15.8631 1.2891C15.8473 1.29278 15.8589 1.24406 15.8218 1.25328C15.3039 1.38221 14.9925 1.54082 14.5899 1.7161C14.1873 1.89259 13.8604 2.0112 13.5914 2.04077C13.2882 2.17459 12.8384 2.33899 12.5822 2.43915C12.3256 2.53896 12.3287 2.63385 12.3078 2.64565C11.6597 3.02947 11.2567 3.19516 10.5857 3.59406C10.2656 3.78285 9.65908 4.19954 9.34012 4.44362C9.0873 4.63489 8.92244 4.73363 8.69886 4.92261C8.66868 4.9482 8.72344 4.9536 8.71481 4.96215C8.48654 5.19835 8.55256 5.02955 8.48934 5.05824C8.26122 5.16388 8.12136 5.234 7.82078 5.52814C7.75101 5.59611 7.62757 5.88123 7.50379 6.00451C7.34222 6.16516 7.373 6.07172 7.20629 6.24304C7.19211 6.25777 7.21509 6.27606 7.10761 6.37647C6.60921 6.84298 6.08222 7.37172 5.62263 7.91349C5.55984 7.98742 5.67596 7.9232 5.58621 8.03054C5.16532 8.53425 4.72618 9.10366 4.34347 9.61684C4.24915 9.74319 4.2785 9.64343 4.25102 9.66606C4.08228 9.80626 3.98916 10.1029 3.96418 10.1449C3.36455 11.151 2.86371 11.9034 2.40183 13.0081C2.37572 13.0684 2.26066 13.5626 2.10629 13.7396C2.09575 13.7515 1.9382 13.9273 1.91999 14.1303C1.919 14.1429 2.00622 14.0288 1.91738 14.2522C1.82845 14.4763 1.72613 14.8472 1.58171 15.1482C1.53597 15.2433 1.38362 15.456 1.35841 15.7741C1.35575 15.7952 1.36647 16.2966 1.22947 16.438C1.2073 16.461 1.10966 16.4063 1.0756 16.7819C1.06964 16.8537 1.12164 16.7332 1.09379 16.9191C1.05152 17.2041 0.946517 17.5711 0.931422 17.9263C0.928575 17.9885 0.954708 18.2575 0.869904 18.4568C0.856624 18.4879 0.830971 18.421 0.810774 18.5297C0.714914 19.0473 0.677929 19.6014 0.61626 20.133C0.594856 20.3222 0.544199 20.2212 0.517129 20.4193C0.489679 20.618 0.459759 21.0153 0.482665 21.2248C0.505427 21.4335 0.5987 21.2076 0.603061 21.5188C0.603769 21.5587 0.604514 21.5987 0.6053 21.6386C0.631284 22.9448 0.699314 24.2424 0.931558 25.5297C0.967684 25.7258 0.967672 25.5578 1.02545 25.845C1.22421 26.9137 1.80713 28.6895 2.11599 29.5809C2.35492 30.2986 1.94885 29.4379 2.15277 29.9799C2.25309 30.2425 2.47554 30.4732 2.50691 30.5323C2.8158 31.1119 2.98534 31.5371 3.28892 32.0461C3.35195 32.1506 3.32974 32.0255 3.38306 32.1145C3.5656 32.4176 3.74321 32.7453 3.92967 33.0281C4.01352 33.1547 4.02562 33.1134 4.10023 33.2312C4.27972 33.5123 4.43733 33.7629 4.60444 34.0444C4.61977 34.0701 4.46855 33.9318 4.61358 34.133C4.84872 34.4579 5.13213 34.871 5.45347 35.2049C5.54923 35.3038 5.60826 35.26 5.76222 35.5157C5.795 35.5688 5.6746 35.5704 5.96136 35.7746C6.00899 35.8105 6.47461 36.161 6.62548 36.4072C6.66479 36.4727 6.74719 36.6598 6.87357 36.7669C6.89085 36.7811 6.85478 36.6901 6.95526 36.7825C7.30923 37.108 7.67961 37.4497 8.06514 37.7584C8.16819 37.8406 8.04465 37.6829 8.19743 37.8058C8.61705 38.1437 9.14499 38.5607 9.56981 38.8732C9.72639 38.9886 9.59661 38.9398 9.60602 38.951C9.75871 39.1314 9.91755 39.1385 9.98267 39.1763C10.3891 39.412 10.6733 39.6337 11.0519 39.8437C11.1566 39.9014 11.103 39.8249 11.1253 39.8339C11.3556 39.9272 11.1615 39.8968 11.2934 39.9808C11.664 40.2162 12.0971 40.4398 12.4989 40.6279C12.6462 40.6966 12.5013 40.5768 12.6331 40.6384C13.4137 41.0019 14.2456 41.3393 15.0358 41.6263C15.185 41.6804 15.0793 41.6825 15.1083 41.7004C15.309 41.8253 15.6514 41.8488 15.727 41.8628C16.0712 41.928 16.1951 41.993 16.4952 42.0635C17.9605 42.4146 19.8086 42.6704 21.2332 42.6999C21.3752 42.704 21.5152 42.7066 21.6534 42.7081C23.3124 42.7174 24.6726 42.5951 26.2699 42.2386C26.3797 42.2135 26.2587 42.1931 26.353 42.1707C27.5686 41.8817 28.7495 41.5183 29.8971 41.0153C29.9913 40.9738 29.8378 40.9918 29.988 40.9238C30.2961 40.7837 30.6832 40.6067 30.9958 40.4663C31.148 40.3979 30.9648 40.5319 31.1177 40.4619C31.4737 40.2986 31.8449 40.1019 32.1896 39.8942C32.3359 39.8056 32.0905 39.8964 32.2819 39.784C33.5835 39.0136 34.7754 38.1219 35.9403 37.1276C36.0199 37.0593 36.1506 37.0636 36.3004 36.8958C36.295 36.8657 36.2736 36.8448 36.26 36.8201C37.8375 35.2809 39.1983 33.5423 40.2505 31.5927C40.2946 31.5106 40.1762 31.6297 40.2609 31.4707C40.7497 30.5472 41.1448 29.6156 41.5452 28.6234C41.5843 28.5248 41.6486 28.605 41.7361 28.3032C41.7525 28.2503 41.8849 27.7957 41.9002 27.6739C41.9022 27.6572 41.8397 27.7281 41.8815 27.5825C42.125 26.7333 42.3359 25.8362 42.4975 24.968C42.5235 24.8276 42.542 24.9845 42.5608 24.8843C42.6935 24.1769 42.7389 23.3937 42.8106 22.7055C42.8569 22.2474 42.9223 22.4201 43.002 22.1756C43.0135 22.1411 43.0198 21.8524 43.0615 21.8376C43.1676 21.7998 43.2818 21.9425 43.3951 21.8857C43.4202 21.8738 43.3949 21.4785 43.4531 21.7127C43.4574 21.7291 43.4741 22.0158 43.492 22.0866C43.5047 22.136 43.5493 22.0483 43.5648 22.1491C43.58 22.25 43.5413 22.3591 43.5554 22.5256C43.569 22.6927 43.6225 22.6195 43.6096 22.9547ZM11.4367 2.92209C11.1926 3.01001 11.2331 3.15879 11.4569 2.99416C11.4677 2.98608 11.4492 2.91752 11.4367 2.92209ZM39.0241 9.23468C38.8824 8.92372 38.6658 8.79966 38.7657 9.01862C38.864 9.2373 39.0667 9.32915 39.0241 9.23468ZM40.848 12.1857C40.719 11.811 40.5024 11.854 40.728 12.2074C40.7409 12.228 40.8554 12.2076 40.848 12.1857ZM42.9639 23.3217C42.9664 23.3184 42.9834 23.1117 42.9815 23.1065C42.9421 22.9934 42.9084 23.4059 42.9639 23.3217ZM42.1676 15.3742C42.1603 15.249 42.0198 14.9214 42.0327 15.0778C42.0438 15.2033 42.1778 15.5301 42.1676 15.3742ZM2.26897 12.3755C2.2651 12.3781 2.1994 12.512 2.21219 12.5147C2.253 12.5226 2.33176 12.3309 2.26897 12.3755ZM43.0943 21.1593C43.0786 20.2959 43.2084 19.7494 43.2431 20.7039C43.2474 20.8756 43.1698 20.3368 43.1645 20.556C43.1546 20.9547 43.2715 21.2188 43.2135 21.6311C43.2037 21.7048 43.096 21.2079 43.094 21.1577C43.0941 21.1582 43.0942 21.1587 43.0943 21.1593ZM11.2204 2.83626C11.2148 2.83683 11.0335 2.9367 11.0303 2.94107C10.9563 3.03723 11.3206 2.83633 11.2204 2.83626ZM0.0991255 20.769C0.0932047 20.7799 0.0757032 21.2611 0.0806092 21.2772C0.151357 21.5287 0.185904 20.5593 0.0991255 20.769ZM24.6985 0.243037C24.9284 0.226944 25.2006 0.264763 25.3684 0.354978C25.1468 0.313324 24.9213 0.277414 24.6985 0.243037Z"
                          fill="black"
                        />
                      </svg>
                    )}
                  </div>
                )}

                {/* Letter */}
                <span className={cn(
                  "relative z-20 text-center text-lg font-medium leading-normal pointer-events-none",
                  "text-foreground",
                  isInCurrentPath && "text-primary-foreground",
                  isInFoundThemeWord && 'text-black'
                )}>
                  {letter}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
