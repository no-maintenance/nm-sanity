/**
 * Canonical Grid Types
 *
 * The canonical grid structure stores both the grid layout and word positions
 * in a single, unified format for consistency and efficiency.
 */

/**
 * Represents a word's position and metadata in the grid
 */
export interface WordPath {
  /** The word string (uppercase) */
  word: string;
  /** Array of cell indices (0-47 for 8x6 grid) */
  path: number[];
  /** Whether this word is the spangram */
  isSpangram?: boolean;
  /** Pre-calculated color for consistency with preview */
  color?: string;
}

/**
 * Theme word paths with additional metadata
 */
export interface ThemeWordPath extends WordPath {
  isSpangram: boolean;
  color: string; // Required for theme words
}

/**
 * The complete canonical grid structure
 */
export interface CanonicalGrid {
  /**
   * Flat array of 48 letters (8 rows × 6 columns)
   * Index calculation: row * 6 + col
   */
  cells: string[];

  /**
   * Theme word positions mapped by word
   */
  themePaths: Record<string, ThemeWordPath>;

  /**
   * Optional hint word positions for validation
   * These are discovered valid words that aren't theme words
   */
  hintPaths?: Record<string, number[]>;

  /**
   * Grid generation metadata
   */
  metadata: {
    /** ISO timestamp of when the grid was generated */
    generatedAt: string;
    /** Algorithm version used for generation */
    algorithm: string;
    /** Grid dimensions (always 8x6 for standard Strands) */
    dimensions: {
      rows: number;
      cols: number;
    };
    /** Total number of valid hint words discovered */
    totalHintWords: number;
    /** Optional seed for reproducible generation */
    seed?: string;
  };
}

/**
 * Helper type for grid generation results
 */
export interface GridGenerationResult {
  /** The generated canonical grid */
  grid: CanonicalGrid;
  /** Whether generation was successful */
  success: boolean;
  /** Any error messages during generation */
  error?: string;
  /** Generation statistics */
  stats?: {
    /** Number of attempts to place words */
    attempts: number;
    /** Time taken in milliseconds */
    timeMs: number;
    /** Number of hint words found */
    hintWordsFound: number;
  };
}

/**
 * Utility functions for working with canonical grids
 */
export class CanonicalGridUtils {
  /**
   * Convert flat index to row/column coordinates
   */
  static indexToCoords(index: number, cols: number = 6): { row: number; col: number } {
    return {
      row: Math.floor(index / cols),
      col: index % cols,
    };
  }

  /**
   * Convert row/column coordinates to flat index
   */
  static coordsToIndex(row: number, col: number, cols: number = 6): number {
    return row * cols + col;
  }

  /**
   * Convert canonical grid to legacy table format for backward compatibility
   */
  static toTableFormat(grid: CanonicalGrid): { rows: Array<{ cells: string[] }> } {
    const rows: Array<{ cells: string[] }> = [];
    const { cols } = grid.metadata.dimensions;

    for (let i = 0; i < grid.cells.length; i += cols) {
      rows.push({
        cells: grid.cells.slice(i, i + cols),
      });
    }

    return { rows };
  }

  /**
   * Convert legacy table format to flat cell array
   */
  static fromTableFormat(table: { rows: Array<{ cells: string[] }> }): string[] {
    return table.rows.flatMap(row => row.cells);
  }

  /**
   * Get the word at a given path in the grid
   */
  static getWordFromPath(cells: string[], path: number[]): string {
    return path.map(index => cells[index]).join('');
  }

  /**
   * Check if two cells are adjacent (including diagonals)
   */
  static areAdjacent(index1: number, index2: number, cols: number = 6): boolean {
    const coord1 = this.indexToCoords(index1, cols);
    const coord2 = this.indexToCoords(index2, cols);

    const rowDiff = Math.abs(coord1.row - coord2.row);
    const colDiff = Math.abs(coord1.col - coord2.col);

    return rowDiff <= 1 && colDiff <= 1 && (rowDiff !== 0 || colDiff !== 0);
  }

  /**
   * Validate that a path is continuous (each cell is adjacent to the next)
   */
  static isValidPath(path: number[], cols: number = 6): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      if (!this.areAdjacent(path[i], path[i + 1], cols)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Convert canonical grid to string format for display
   */
  static toString(grid: CanonicalGrid): string {
    return grid.cells.join('');
  }
}

/**
 * Sanity-stored version of CanonicalGrid (with JSON strings)
 */
export interface SanityCanonicalGrid {
  cells: string[];
  themePaths: string; // JSON string
  hintPaths?: string; // JSON string
  metadata: {
    generatedAt: string;
    algorithm: string;
    dimensions: { rows: number; cols: number };
    totalHintWords: number;
    seed?: string;
  };
}

/**
 * Type guard to check if an object is a CanonicalGrid (supports both formats)
 */
export function isCanonicalGrid(obj: any): obj is CanonicalGrid | SanityCanonicalGrid {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.cells) &&
    obj.cells.length === 48 &&
    obj.cells.every((cell: any) => typeof cell === 'string' && /^[A-Z]$/.test(cell)) &&
    obj.themePaths &&
    (typeof obj.themePaths === 'object' || typeof obj.themePaths === 'string') &&
    obj.metadata &&
    typeof obj.metadata === 'object'
  );
}

/**
 * Parse a Sanity canonical grid (with JSON strings) into a proper CanonicalGrid
 */
export function parseCanonicalGrid(grid: SanityCanonicalGrid | CanonicalGrid): CanonicalGrid {
  // If already a proper CanonicalGrid, return as-is
  if (typeof grid.themePaths === 'object') {
    return grid as CanonicalGrid;
  }

  // Parse JSON strings
  return {
    cells: grid.cells,
    themePaths: JSON.parse(grid.themePaths as string) as Record<string, ThemeWordPath>,
    hintPaths: grid.hintPaths
      ? (JSON.parse(grid.hintPaths as string) as Record<string, number[]>)
      : undefined,
    metadata: grid.metadata,
  };
}