interface HintSystemProps {
  hintWordCount: number;
  availableHints: number;
  onUseHint: () => void;
  hintMode: 'standard' | 'none';
}

export function HintSystem({
  hintWordCount,
  availableHints,
  onUseHint,
  hintMode,
}: HintSystemProps) {
  if (hintMode === 'none') {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-600">Hints disabled for this puzzle</p>
      </div>
    );
  }

  const progress = hintWordCount % 3;
  const progressPercent = (progress / 3) * 100;

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-bold">Hint System</h3>

      <div className="space-y-4">
        {/* Hint Progress */}
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Find 3 non-theme words to earn a hint</span>
            <span className="font-semibold">
              {progress} / 3
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{width: `${progressPercent}%`}}
            />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Hint words must be 4+ letters and not theme words
          </p>
        </div>

        {/* Available Hints */}
        <div className="rounded-lg bg-blue-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">
                {availableHints}
              </div>
              <div className="text-sm text-blue-600">
                {availableHints === 1 ? 'Hint available' : 'Hints available'}
              </div>
            </div>
            <button
              onClick={onUseHint}
              disabled={availableHints === 0}
              className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
                availableHints > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500'
              }`}
              type="button"
            >
              Use Hint
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center text-sm text-gray-600">
          <p>{hintWordCount} hint words found</p>
        </div>
      </div>
    </div>
  );
}
