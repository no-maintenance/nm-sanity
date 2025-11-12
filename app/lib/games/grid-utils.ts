/**
 * Grid utility functions for handling grid data structure
 */

import type {SanityStrandsPuzzle} from './strands.queries';
import {
  CanonicalGridUtils,
  isCanonicalGrid,
  parseCanonicalGrid,
  type CanonicalGrid,
  type SanityCanonicalGrid,
} from './canonical-grid.types';

/**
 * Get the grid data from a puzzle (canonicalGrid only)
 * @param puzzle - The puzzle data
 * @returns The grid data (CanonicalGrid format)
 */
export function getGridData(puzzle: SanityStrandsPuzzle): CanonicalGrid | string {
  // Use canonicalGrid (new format)
  // Parse it if needed to convert JSON strings to objects
  if (puzzle.canonicalGrid) {
    if (isCanonicalGrid(puzzle.canonicalGrid)) {
      return parseCanonicalGrid(puzzle.canonicalGrid as SanityCanonicalGrid | CanonicalGrid);
    }
    // If it's not a valid canonical grid, log warning
    console.warn('[Grid Utils] Invalid canonical grid format:', puzzle.canonicalGrid);
  }

  // Return empty grid as fallback
  console.warn('[Grid Utils] No canonical grid found in puzzle:', puzzle._id);
  return '';
}

/**
 * Get grid as a string (48 characters, uppercase A-Z)
 * @param puzzle - The puzzle data
 * @returns Grid string (48 characters)
 */
export function getGridString(puzzle: SanityStrandsPuzzle): string {
  const gridData = getGridData(puzzle);

  // Handle CanonicalGrid format
  if (typeof gridData !== 'string' && isCanonicalGrid(gridData)) {
    return CanonicalGridUtils.toString(gridData);
  }

  // Fallback for empty grid
  if (typeof gridData === 'string') {
    return gridData;
  }

  console.error('[Grid Utils] Unable to convert grid to string:', gridData);
  return '';
}

/**
 * Get canonical paths from puzzle metadata
 * @param puzzle - The puzzle data
 * @returns Record mapping words to their canonical paths, or undefined if not available
 */
export function getCanonicalPaths(puzzle: SanityStrandsPuzzle): Record<string, number[]> | undefined {
  // First check if canonicalGrid has theme paths (new format)
  if (puzzle.canonicalGrid && isCanonicalGrid(puzzle.canonicalGrid)) {
    const canonicalGrid = parseCanonicalGrid(puzzle.canonicalGrid as SanityCanonicalGrid | CanonicalGrid);
    const paths: Record<string, number[]> = {};
    Object.entries(canonicalGrid.themePaths).forEach(([word, wordPath]) => {
      paths[word.toUpperCase()] = wordPath.path;
    });
    return paths;
  }

  // Fall back to legacy gridMetadata.canonicalPaths
  if (!puzzle.gridMetadata?.canonicalPaths) {
    return undefined;
  }

  try {
    return JSON.parse(puzzle.gridMetadata.canonicalPaths) as Record<string, number[]>;
  } catch (error) {
    console.error('[Grid Utils] Failed to parse canonical paths:', error);
    return undefined;
  }
}

/**
 * Check if a puzzle has canonical paths defined
 * @param puzzle - The puzzle data
 * @returns True if canonical paths are available
 */
export function hasCanonicalPaths(puzzle: SanityStrandsPuzzle): boolean {
  // Check if canonicalGrid has theme paths
  if (puzzle.canonicalGrid && isCanonicalGrid(puzzle.canonicalGrid)) {
    return true;
  }
  // Fall back to legacy gridMetadata for backward compatibility
  return !!puzzle.gridMetadata?.canonicalPaths;
}
