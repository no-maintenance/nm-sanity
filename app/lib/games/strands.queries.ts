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
  generatedGrid: string | {rows: Array<{cells: string[]}>};
  gridLocked: boolean;
  gridMetadata?: {
    generatedAt: string;
    hintWordCount: number;
    algorithm: string;
    canonicalPaths?: string; // JSON string of Record<string, number[]>
  };
  hintWords?: string[];
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
    algorithm,
    canonicalPaths
  },
  hintWords,
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
  sanity: {loadQuery: any};
}): Promise<SanityStrandsPuzzle | null> {
  const query = groq`
    *[_type == "strandsPuzzle" && slug.current == $slug][0] {
      ${STRANDS_PUZZLE_FRAGMENT}
    }
  `;

  const {data} = await sanity.loadQuery(query, {slug});

  return data as SanityStrandsPuzzle | null;
}

export async function getAllPublishedPuzzles({
  sanity,
}: {
  sanity: {loadQuery: any};
}): Promise<SanityStrandsPuzzle[]> {
  const query = groq`
    *[_type == "strandsPuzzle" && status == "published"] | order(puzzleNumber desc) {
      ${STRANDS_PUZZLE_FRAGMENT}
    }
  `;

  const {data} = await sanity.loadQuery(query, {});

  return (data as SanityStrandsPuzzle[]) || [];
}

export async function getLatestPuzzle({
  sanity,
}: {
  sanity: {loadQuery: any};
}): Promise<SanityStrandsPuzzle | null> {
  const query = groq`
    *[_type == "strandsPuzzle" && status == "published"] | order(puzzleNumber desc)[0] {
      ${STRANDS_PUZZLE_FRAGMENT}
    }
  `;

  const {data} = await sanity.loadQuery(query, {});

  return data as SanityStrandsPuzzle | null;
}
