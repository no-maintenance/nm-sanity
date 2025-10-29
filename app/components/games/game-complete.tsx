import {Link} from '@remix-run/react';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {formatTime} from '~/lib/games/strands-logic';

interface FoundWord {
  word: string;
  isSpangram: boolean;
  score: number;
}

interface GameCompleteProps {
  puzzle: SanityStrandsPuzzle;
  foundWords: FoundWord[];
  score: number;
  timeElapsed: number;
  usedHints: boolean;
}

export function GameComplete({
  puzzle,
  foundWords,
  score,
  timeElapsed,
  usedHints,
}: GameCompleteProps) {
  const isPerfect = !usedHints;
  const reward = puzzle.reward?.enabled ? puzzle.reward : null;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="rounded-lg bg-gradient-to-br from-green-50 to-blue-50 p-8 shadow-xl">
        {/* Celebration */}
        <div className="mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-green-700">
            {isPerfect ? 'Perfect!' : 'Puzzle Complete!'}
          </h1>
          {isPerfect && (
            <p className="mt-2 text-lg text-green-600">
              You solved it without using any hints!
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-3xl font-bold text-gray-900">{score}</div>
            <div className="text-sm text-gray-600">Final Score</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-3xl font-bold text-gray-900">
              {formatTime(timeElapsed)}
            </div>
            <div className="text-sm text-gray-600">Time</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-3xl font-bold text-gray-900">{foundWords.length}</div>
            <div className="text-sm text-gray-600">Words Found</div>
          </div>
        </div>

        {/* Reward */}
        {reward && reward.type && (
          <div className="mb-6 rounded-lg border-2 border-green-300 bg-white p-6">
            <h3 className="mb-2 text-xl font-bold text-green-700">
              🎁 Congratulations!
            </h3>
            {reward.type === 'discount' && reward.discountCode && (
              <div>
                <p className="mb-2 text-gray-700">
                  You've earned a {reward.discountPercent}% discount!
                </p>
                <div className="inline-block rounded-lg bg-green-100 px-4 py-2">
                  <div className="text-sm text-gray-600">Discount Code</div>
                  <div className="text-2xl font-bold text-green-700">
                    {reward.discountCode}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  Copy this code and use it at checkout
                </p>
              </div>
            )}
            {reward.type === 'badge' && (
              <div>
                <div className="mb-2 text-4xl">🏆</div>
                <p className="text-gray-700">You've earned a badge!</p>
              </div>
            )}
            {reward.message && (
              <p className="mt-3 text-gray-700">{reward.message}</p>
            )}
          </div>
        )}

        {/* Found Words Summary */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <h3 className="mb-3 text-lg font-bold">Words Found</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {foundWords.map((word) => (
              <span
                key={word.word}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  word.isSpangram
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {word.isSpangram && '⭐ '}
                {word.word}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            type="button"
          >
            Play Again
          </button>
          <Link
            to="/games"
            className="rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white hover:bg-gray-700"
          >
            More Puzzles
          </Link>
        </div>
      </div>
    </div>
  );
}
