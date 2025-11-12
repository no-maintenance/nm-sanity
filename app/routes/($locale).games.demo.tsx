import type {MetaFunction} from '@shopify/remix-oxygen';
import {StrandsGame} from '~/components/games/strands-game';
import {MOCK_STRANDS_PUZZLE} from '~/lib/games/mock-puzzle-data';
import {PuzzleDebugInfo} from '~/components/games/puzzle-debug-info';

export const meta: MetaFunction = () => {
  return [
    {title: 'Strands Demo - Ocean Life'},
    {name: 'description', content: 'Demo puzzle with mock data for development'},
  ];
};

export default function StrandsGameDemo() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 rounded-lg border border-yellow-400 bg-yellow-50 p-4">
        <h2 className="text-lg font-bold text-yellow-800">🔧 Demo Mode</h2>
        <p className="text-sm text-yellow-700">
          This is a demo puzzle using mock data for development and testing.
        </p>
        <div className="mt-2 text-xs text-yellow-600">
          <strong>Theme:</strong> {MOCK_STRANDS_PUZZLE.theme.category}
          <br />
          <strong>Theme Words ({MOCK_STRANDS_PUZZLE.themeWords.length}):</strong> {MOCK_STRANDS_PUZZLE.themeWords.map(w => w.word).join(', ')}
          <br />
          <strong>Hint Words Available:</strong> {MOCK_STRANDS_PUZZLE.hintWords?.length || 0}
        </div>
      </div>
      <StrandsGame puzzle={MOCK_STRANDS_PUZZLE} />
      <PuzzleDebugInfo puzzle={MOCK_STRANDS_PUZZLE} />
    </div>
  );
}
