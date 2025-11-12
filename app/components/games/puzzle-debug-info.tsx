import {useState} from 'react';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {getGridString, getCanonicalPaths} from '~/lib/games/grid-utils';

interface PuzzleDebugInfoProps {
  puzzle: SanityStrandsPuzzle;
}

/**
 * Debug component to display puzzle information and canonical paths
 * Useful for development and testing
 */
export function PuzzleDebugInfo({puzzle}: PuzzleDebugInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const gridString = getGridString(puzzle);
  const canonicalPaths = getCanonicalPaths(puzzle) || {};

  // Convert grid string to visual grid
  const gridRows = [];
  for (let i = 0; i < 8; i++) {
    const row = gridString.slice(i * 6, (i + 1) * 6).split('');
    gridRows.push(row);
  }

  // Helper to get visual representation of path
  const getPathVisualization = (word: string, path: number[]) => {
    if (!path || path.length === 0) return 'No path defined';
    return path.map((index) => `${gridString[index]}(${index})`).join(' → ');
  };

  // Helper to check if cell is in a path
  const getCellPathInfo = (index: number) => {
    const wordsUsingCell: string[] = [];
    Object.entries(canonicalPaths).forEach(([word, path]) => {
      if ((path as number[]).includes(index)) {
        wordsUsingCell.push(word);
      }
    });
    return wordsUsingCell;
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-gray-700"
          type="button"
        >
          Show Debug Info
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 overflow-auto rounded-lg bg-white shadow-2xl">
      <div className="sticky top-0 flex items-center justify-between border-b bg-gray-800 p-4 text-white">
        <h2 className="text-lg font-bold">🐛 Puzzle Debug Info</h2>
        <button
          onClick={() => setIsExpanded(false)}
          className="rounded px-3 py-1 hover:bg-gray-700"
          type="button"
        >
          Close
        </button>
      </div>

      <div className="space-y-6 p-6">
        {/* Puzzle Metadata */}
        <section>
          <h3 className="mb-2 text-lg font-bold text-gray-900">Puzzle Info</h3>
          <div className="space-y-1 text-sm">
            <p>
              <strong>ID:</strong> {puzzle._id}
            </p>
            <p>
              <strong>Title:</strong> {puzzle.title}
            </p>
            <p>
              <strong>Theme:</strong> {puzzle.theme.category} - {puzzle.theme.clue}{' '}
              {puzzle.theme.emoji}
            </p>
            <p>
              <strong>Difficulty:</strong> {puzzle.difficulty}
            </p>
          </div>
        </section>

        {/* Grid Visualization */}
        <section>
          <h3 className="mb-2 text-lg font-bold text-gray-900">Grid (8×6)</h3>
          <div className="inline-block rounded-lg border border-gray-300 bg-gray-50 p-4">
            <div className="space-y-1 font-mono text-sm">
              {gridRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2">
                  {row.map((letter, colIndex) => {
                    const cellIndex = rowIndex * 6 + colIndex;
                    const wordsUsingCell = getCellPathInfo(cellIndex);
                    const hasPath = wordsUsingCell.length > 0;

                    return (
                      <div
                        key={cellIndex}
                        className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-bold ${
                          hasPath
                            ? 'border-green-500 bg-green-100 text-green-800'
                            : 'border-gray-300 bg-white text-gray-600'
                        }`}
                        title={
                          hasPath
                            ? `Cell ${cellIndex}: Used by ${wordsUsingCell.join(', ')}`
                            : `Cell ${cellIndex}: Not in any canonical path`
                        }
                      >
                        {letter}
                      </div>
                    );
                  })}
                  <span className="ml-2 text-xs text-gray-500">
                    Row {rowIndex} (indices {rowIndex * 6}-{rowIndex * 6 + 5})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Theme Words & Canonical Paths */}
        <section>
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            Theme Words & Canonical Paths
          </h3>
          <div className="space-y-3">
            {puzzle.themeWords.map((tw, index) => {
              const path = canonicalPaths[tw.word.toUpperCase()] || [];
              return (
                <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{tw.word}</span>
                    {tw.isSpangram && (
                      <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        Spangram
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      ({tw.word.length} letters)
                    </span>
                  </div>
                  <div className="font-mono text-xs text-gray-700">
                    <strong>Path:</strong> {getPathVisualization(tw.word, path)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <strong>Indices:</strong> [{path.join(', ')}]
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Hint Words */}
        <section>
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            Hint Words ({puzzle.hintWords?.length || 0})
          </h3>
          <div className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-wrap gap-2">
              {puzzle.hintWords && puzzle.hintWords.length > 0 ? (
                puzzle.hintWords.map((word, index) => (
                  <span
                    key={index}
                    className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                  >
                    {word}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No hint words defined</p>
              )}
            </div>
          </div>
        </section>

        {/* Grid Metadata */}
        {puzzle.gridMetadata && (
          <section>
            <h3 className="mb-2 text-lg font-bold text-gray-900">Grid Metadata</h3>
            <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
              <p>
                <strong>Generated:</strong>{' '}
                {new Date(puzzle.gridMetadata.generatedAt).toLocaleString()}
              </p>
              <p>
                <strong>Algorithm:</strong> {puzzle.gridMetadata.algorithm}
              </p>
              <p>
                <strong>Hint Word Count:</strong> {puzzle.gridMetadata.hintWordCount}
              </p>
              <p>
                <strong>Has Canonical Paths:</strong>{' '}
                {puzzle.gridMetadata.canonicalPaths ? 'Yes ✅' : 'No ❌'}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
