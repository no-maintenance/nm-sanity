import {useCallback, useEffect, useState} from 'react';
import {areAdjacent} from '~/lib/games/strands-logic';

const GRID_COLS = 6;

export interface StrandsInputState {
  isDragging: boolean;
  isMouseDown: boolean;
  dragStartCell: number | null;
}

export interface StrandsInputHandlers {
  handlePointerDown: (index: number) => void;
  handlePointerEnter: (index: number) => void;
  handlePointerUp: () => void;
  handleCellClick: (index: number) => void;
}

export interface UseStrandsInputReturn {
  state: StrandsInputState;
  handlers: StrandsInputHandlers;
}

/**
 * Custom hook for handling Strands game input interactions
 * Manages drag, click, and keyboard interactions
 */
export function useStrandsInput(
  currentPath: number[],
  onCellSelect: (index: number) => void,
  onWordSubmit: () => void,
  onClearPath: () => void,
  usedCells: Set<number>,
): UseStrandsInputReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<number | null>(null);

  // Handle pointer down (mouse/touch start)
  const handlePointerDown = useCallback(
    (index: number) => {
      if (usedCells.has(index)) return;
      setIsMouseDown(true);
      setDragStartCell(index);
    },
    [usedCells],
  );

  // Handle pointer enter (mouse/touch move)
  const handlePointerEnter = useCallback(
    (index: number) => {
      if (!isMouseDown) return;
      if (usedCells.has(index)) return;

      // Enable dragging if we moved to a different cell while holding mouse down
      if (dragStartCell !== null && dragStartCell !== index && !isDragging) {
        setIsDragging(true);
        onCellSelect(dragStartCell);
        onCellSelect(index);
        return;
      }

      // Continue dragging
      if (!isDragging) return;

      // Only add if adjacent to last cell in path
      if (currentPath.length > 0) {
        const lastIndex = currentPath[currentPath.length - 1];
        if (!areAdjacent(lastIndex, index) && currentPath[currentPath.length - 1] !== index) {
          return;
        }
      }

      onCellSelect(index);
    },
    [isDragging, dragStartCell, currentPath, onCellSelect, isMouseDown, usedCells],
  );

  // Handle pointer up (mouse/touch end)
  const handlePointerUp = useCallback(() => {
    console.log('[Input] Pointer up - isDragging:', isDragging, 'pathLength:', currentPath.length);
    setIsMouseDown(false);
    setDragStartCell(null);

    if (isDragging && currentPath.length > 0) {
      console.log('[Input] Auto-submitting word');
      onWordSubmit();
    }

    setIsDragging(false);
  }, [isDragging, currentPath, onWordSubmit]);

  // Handle click on cell (click-by-click word building)
  const handleCellClick = useCallback(
    (index: number) => {
      // Ignore clicks that were actually drags
      if (isDragging) return;
      if (usedCells.has(index)) return;

      // Starting new word
      if (currentPath.length === 0) {
        onCellSelect(index);
        return;
      }

      const lastIndex = currentPath[currentPath.length - 1];

      // Same letter as last → submit word
      if (lastIndex === index) {
        onWordSubmit();
        return;
      }

      // Letter already in path (not last) → backtrack
      const existingIndex = currentPath.indexOf(index);
      if (existingIndex !== -1 && existingIndex !== currentPath.length - 1) {
        // Backtrack handled by selectCell logic
        onCellSelect(index);
        return;
      }

      // Adjacent letter → add to path
      if (areAdjacent(lastIndex, index)) {
        onCellSelect(index);
        return;
      }

      // Non-adjacent letter → reset and start new word
      onCellSelect(index);
    },
    [currentPath, isDragging, onCellSelect, onWordSubmit, usedCells],
  );

  // Global pointer up handler
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isMouseDown) {
        handlePointerUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalPointerUp);
    document.addEventListener('touchend', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalPointerUp);
      document.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [isMouseDown, handlePointerUp]);

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

  return {
    state: {
      isDragging,
      isMouseDown,
      dragStartCell,
    },
    handlers: {
      handlePointerDown,
      handlePointerEnter,
      handlePointerUp,
      handleCellClick,
    },
  };
}

