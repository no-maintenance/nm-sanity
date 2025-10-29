import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import {defer} from '@shopify/remix-oxygen';
import {Await, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {getSeoMeta} from '~/lib/seo';
import type {SanityStrandsPuzzle} from '~/lib/games/strands.queries';
import {getStrandsPuzzle} from '~/lib/games/strands.queries';
import {StrandsGame} from '~/components/games/strands-game.client';

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

  return defer({
    puzzle,
  });
}

export const meta: MetaFunction<typeof loader> = ({data}) => {
  const puzzle = data?.puzzle;
  if (!puzzle) return [{title: 'Puzzle Not Found'}];

  return getSeoMeta({
    title: puzzle.title,
    description: puzzle.theme?.clue || 'Play this word puzzle game',
    url: `/games/${puzzle.slug.current}`,
  });
};

export default function StrandsGameRoute() {
  const {puzzle} = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-2xl">Loading puzzle...</div>
            </div>
          </div>
        }
      >
        <Await resolve={puzzle}>
          {(resolvedPuzzle) => <StrandsGame puzzle={resolvedPuzzle} />}
        </Await>
      </Suspense>
    </div>
  );
}
