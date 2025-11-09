import type {SanityClient} from '@sanity/client';
import groq from 'groq';

export interface SanityStrandsPuzzle {
  _id: string;
  _type: 'strandsPuzzle';
  title: string;
  slug: {
    current: string;
  };
  puzzleMode: 'auto' | 'manual';
  themeWords: Array<{
    word: string;
    isSpangram: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    hint?: string;
  }>;
  generatedGrid: string;
  gridLocked: boolean;
  gridMetadata?: {
    generatedAt: string;
    hintWordCount: number;
    algorithm: string;
  };
  theme: {
    category: string;
    clue: string;
    emoji?: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  hintMode: 'standard' | 'none';
  timeLimit: number;
  scoring: {
    pointsPerWord: number;
    spangramBonus: number;
  };
  reward?: {
    enabled: boolean;
    type?: 'discount' | 'badge' | 'message';
    discountCode?: string;
    discountPercent?: number;
    message?: string;
  };
  status: 'draft' | 'ready' | 'published' | 'scheduled';
  publishDate?: string;
  expiryDate?: string;
  puzzleNumber?: number;
}

const STRANDS_PUZZLE_FRAGMENT = groq`
  _id,
  _type,
  title,
  slug,
  puzzleMode,
  themeWords[] {
    word,
    isSpangram,
    difficulty,
    hint
  },
  generatedGrid,
  gridLocked,
  gridMetadata {
    generatedAt,
    hintWordCount,
    algorithm
  },
  theme {
    category,
    clue,
    emoji
  },
  difficulty,
  hintMode,
  timeLimit,
  scoring {
    pointsPerWord,
    spangramBonus
  },
  reward {
    enabled,
    type,
    discountCode,
    discountPercent,
    message
  },
  status,
  publishDate,
  expiryDate,
  puzzleNumber
`;

export async function getStrandsPuzzle({
  slug,
  sanity,
}: {
  slug: string;
  sanity: {query: SanityClient['fetch']};
}): Promise<SanityStrandsPuzzle | null> {
  const query = groq`
    *[_type == "strandsPuzzle" && slug.current == $slug][0] {
      ${STRANDS_PUZZLE_FRAGMENT}
    }
  `;

  const puzzle = await sanity.query<SanityStrandsPuzzle>({
    query,
    params: {slug},
  });

  return puzzle;
}

export async function getAllPublishedPuzzles({
  sanity,
}: {
  sanity: {query: SanityClient['fetch']};
}): Promise<SanityStrandsPuzzle[]> {
  const query = groq`
    *[_type == "strandsPuzzle" && status == "published"] | order(puzzleNumber desc) {
      ${STRANDS_PUZZLE_FRAGMENT}
    }
  `;

  const puzzles = await sanity.query<SanityStrandsPuzzle[]>({
    query,
  });

  return puzzles || [];
}

export async function getLatestPuzzle({
  sanity,
}: {
  sanity: {query: SanityClient['fetch']};
}): Promise<SanityStrandsPuzzle | null> {
  const query = groq`
    *[_type == "strandsPuzzle" && status == "published"] | order(puzzleNumber desc)[0] {
      ${STRANDS_PUZZLE_FRAGMENT}
    }
  `;

  const puzzle = await sanity.query<SanityStrandsPuzzle>({
    query,
  });

  return puzzle;
}
