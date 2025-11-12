import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {getStrandsPuzzle} from '~/lib/games/strands.queries';
import {StrandsGame} from '~/components/games/strands-game';

/**
 * Normalize a word by removing invisible Unicode characters and trimming
 */
function normalizeWord(word: string): string {
  return word
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u2000-\u200F\u202A-\u202E\u205F-\u206F]/g, '')
    .trim()
    .toUpperCase();
}

export async function loader({params, context}: LoaderFunctionArgs) {
  const {slug} = params;

  if (!slug) {
    throw new Response('Not found', {status: 404});
  }

  const puzzle = await getStrandsPuzzle({
    slug,
    sanity: context.sanity,
  });

  if (!puzzle) {
    throw new Response('Puzzle not found', {status: 404});
  }

  // Check if puzzle is published
  if (puzzle.status !== 'published') {
    throw new Response('Puzzle not available', {status: 404});
  }

  // Check expiry date
  if (puzzle.expiryDate && new Date(puzzle.expiryDate) < new Date()) {
    throw new Response('Puzzle expired', {status: 404});
  }

  // Normalize theme words to remove invisible Unicode characters
  const normalizedPuzzle = {
    ...puzzle,
    themeWords: puzzle.themeWords.map(tw => ({
      ...tw,
      word: normalizeWord(tw.word),
    })),
  };

  return {
    puzzle: normalizedPuzzle,
  };
}

export const meta: MetaFunction<typeof loader> = ({data}) => {
  const puzzle = data?.puzzle;
  if (!puzzle) {
    return [
      {title: 'Puzzle Not Found'},
      {name: 'description', content: 'The requested puzzle could not be found.'},
    ];
  }

  return [
    {title: puzzle.title || 'Word Puzzle Game'},
    {name: 'description', content: puzzle.theme?.clue || 'Play this word puzzle game'},
  ];
};

export default function StrandsGameRoute() {
  const {puzzle} = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <StrandsGame puzzle={puzzle} />
    </div>
  );
}
