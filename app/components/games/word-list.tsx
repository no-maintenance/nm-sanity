interface FoundWord {
  word: string;
  isSpangram: boolean;
  score: number;
}

interface ThemeWord {
  word: string;
  isSpangram: boolean;
}

interface WordListProps {
  foundWords: FoundWord[];
  themeWords: ThemeWord[];
  totalWords: number;
}

export function WordList({foundWords, themeWords, totalWords}: WordListProps) {
  const foundSet = new Set(foundWords.map((w) => w.word.toUpperCase()));

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">Found Words</h3>
        <span className="text-sm text-gray-600">
          {foundWords.length} / {totalWords}
        </span>
      </div>

      <div className="space-y-2">
        {themeWords.map((themeWord) => {
          const isFound = foundSet.has(themeWord.word.toUpperCase());
          const foundWord = foundWords.find(
            (fw) => fw.word.toUpperCase() === themeWord.word.toUpperCase(),
          );

          return (
            <div
              key={themeWord.word}
              className={`rounded-lg border-2 px-3 py-2 transition-all ${
                isFound
                  ? themeWord.isSpangram
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {themeWord.isSpangram && <span className="text-lg">⭐</span>}
                  <span
                    className={`font-semibold ${
                      isFound ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {isFound ? themeWord.word.toUpperCase() : '???'}
                  </span>
                </div>
                {isFound && foundWord && (
                  <span className="text-sm font-semibold text-gray-600">
                    +{foundWord.score}
                  </span>
                )}
              </div>
              {themeWord.isSpangram && (
                <div className="mt-1 text-xs text-gray-600">Spangram</div>
              )}
            </div>
          );
        })}
      </div>

      {foundWords.length === 0 && (
        <div className="py-8 text-center text-gray-400">
          <p>No words found yet</p>
          <p className="mt-1 text-sm">Start selecting letters!</p>
        </div>
      )}
    </div>
  );
}
