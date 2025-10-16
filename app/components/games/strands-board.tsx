import {useCallback, useEffect, useRef, useState} from 'react';
import {cn} from '~/lib/utils';
import {areAdjacent, indexToPosition} from '~/lib/games/strands-logic';

const GRID_ROWS = 6;
const GRID_COLS = 8;

interface FoundWord {
  word: string;
  path: number[];
  isSpangram: boolean;
  score: number;
}

interface StrandsBoardProps {
  grid: string;
  currentPath: number[];
  foundWords: FoundWord[];
  onCellSelect: (index: number) => void;
  onWordSubmit: () => void;
  onClearPath: () => void;
}

export function StrandsBoard({
  grid,
  currentPath,
  foundWords,
  onCellSelect,
  onWordSubmit,
  onClearPath,
}: StrandsBoardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Get all cells that are part of found words
  const usedCells = new Set<number>();
  const spangramCells = new Set<number>();

  for (const word of foundWords) {
    for (const index of word.path) {
      usedCells.add(index);
      if (word.isSpangram) {
        spangramCells.add(index);
      }
    }
  }

  // Handle mouse/touch start
  const handlePointerDown = useCallback(
    (index: number) => {
      if (usedCells.has(index)) return;
      setIsDragging(true);
      onCellSelect(index);
    },
    [onCellSelect, usedCells],
  );

  // Handle mouse/touch move
  const handlePointerEnter = useCallback(
    (index: number) => {
      if (!isDragging) return;
      if (usedCells.has(index)) return;

      // Only add if adjacent to last cell in path
      if (currentPath.length > 0) {
        const lastIndex = currentPath[currentPath.length - 1];
        if (!areAdjacent(lastIndex, index) && currentPath[currentPath.length - 1] !== index) {
          return;
        }
      }

      onCellSelect(index);
    },
    [isDragging, currentPath, onCellSelect, usedCells],
  );

  // Handle mouse/touch end
  const handlePointerUp = useCallback(() => {
    if (isDragging && currentPath.length > 0) {
      onWordSubmit();
    }
    setIsDragging(false);
  }, [isDragging, currentPath, onWordSubmit]);

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

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClearPath();
      } else if (e.key === 'Enter' && currentPath.length > 0) {
        onWordSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPath, onClearPath, onWordSubmit]);

  const gridLetters = grid.split('');

  return (
    <div className="space-y-4">
      <div
        ref={boardRef}
        className="relative mx-auto w-full max-w-2xl select-none"
        style={{
          aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`,
        }}
      >
        <div
          className="grid gap-1 p-2"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          }}
        >
          {gridLetters.map((letter, index) => {
            const isInCurrentPath = currentPath.includes(index);
            const isUsed = usedCells.has(index);
            const isSpangram = spangramCells.has(index);
            const pathIndex = currentPath.indexOf(index);

            return (
              <div
                key={index}
                className={cn(
                  'relative flex aspect-square items-center justify-center rounded-lg text-xl font-bold transition-all duration-150',
                  'cursor-pointer border-2',
                  !isUsed && !isInCurrentPath && 'border-gray-300 bg-white hover:border-blue-400',
                  !isUsed && isInCurrentPath && 'border-blue-500 bg-blue-100',
                  isUsed && !isSpangram && 'border-green-500 bg-green-100',
                  isSpangram && 'border-yellow-500 bg-yellow-100',
                  isUsed && 'cursor-not-allowed opacity-75',
                )}
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
                  if (element && element.hasAttribute('data-cell-index')) {
                    const touchIndex = parseInt(element.getAttribute('data-cell-index') || '0');
                    handlePointerEnter(touchIndex);
                  }
                }}
                data-cell-index={index}
              >
                {letter}
                {isInCurrentPath && pathIndex >= 0 && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                    {pathIndex + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current word display */}
      {currentPath.length > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
            <span className="text-lg font-semibold">
              {currentPath.map((index) => gridLetters[index]).join('')}
            </span>
            <button
              onClick={onClearPath}
              className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-600">
        <p>Click or drag to select letters • ESC to clear • Enter to submit</p>
      </div>
    </div>
  );
}
