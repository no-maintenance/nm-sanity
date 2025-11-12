import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {formatTime} from '~/lib/games/strands-logic';

interface GameHeaderProps {
  puzzle: SanityStrandsPuzzle;
  score: number;
  timeElapsed: number;
  progress: number;
  lastError: string | null;
}

export function GameHeader({puzzle, score, timeElapsed, progress, lastError}: GameHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Title and Theme */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          {puzzle.title}
        </h1>
        <p className="mt-2 text-lg text-gray-600">{puzzle.theme.clue}</p>
        <div className="mt-1 flex items-center justify-center gap-4 text-sm text-gray-500">
          <span className="rounded-full bg-gray-100 px-3 py-1">
            {puzzle.difficulty === 'easy' && '🟢'}
            {puzzle.difficulty === 'medium' && '🟡'}
            {puzzle.difficulty === 'hard' && '🔴'}
            {' '}
            {puzzle.difficulty.charAt(0).toUpperCase() + puzzle.difficulty.slice(1)}
          </span>
          {puzzle.themeWords.length > 0 && (
            <span>{puzzle.themeWords.length} words to find</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold">Progress</span>
          <span className="text-gray-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
            style={{width: `${progress}%`}}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold">{score}</div>
          <div className="text-sm text-gray-600">Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{formatTime(timeElapsed)}</div>
          <div className="text-sm text-gray-600">Time</div>
        </div>
      </div>

      {/* Error Message */}
      {lastError && (
        <div className="mx-auto max-w-md rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-center text-red-700">
          {lastError}
        </div>
      )}
    </div>
  );
}
