import {defineField, defineType} from 'sanity';
import {Gamepad2} from 'lucide-react';
import {ThemeWordsWithCounter} from '~/sanity/components/theme-words-with-counter';

const GROUPS = [
  {name: 'puzzle', title: 'Puzzle', default: true},
  {name: 'gameplay', title: 'Gameplay Settings'},
  {name: 'metadata', title: 'Metadata'},
];

export default defineType({
  name: 'strandsPuzzle',
  title: 'Strands Puzzle',
  type: 'document',
  icon: Gamepad2,
  groups: GROUPS,

  fields: [
    // PUZZLE GROUP
    defineField({
      name: 'title',
      title: 'Puzzle Title',
      type: 'string',
      group: 'puzzle',
      description: 'Display name for this puzzle (e.g., "Strands #42")',
      validation: (Rule) => Rule.required().max(100),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'puzzle',
      description: 'URL-friendly identifier',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'puzzleMode',
      title: 'Grid Creation Mode',
      type: 'string',
      group: 'puzzle',
      options: {
        list: [
          {title: '✨ Auto-generate from words', value: 'auto'},
          {title: '✏️ Manual grid entry', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
    }),

    defineField({
      name: 'themeWords',
      title: 'Theme Words',
      type: 'array',
      of: [{type: 'themeWord'}],
      group: 'puzzle',
      description: 'All answer words including the spangram',
      components: {
        input: ThemeWordsWithCounter,
      },
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(30)
          .custom((words: Array<{word?: string; isSpangram?: boolean}> | undefined) => {
            if (!words) return true;

            // Check for exactly one spangram
            const spangrams = words.filter((w) => w.isSpangram);
            if (spangrams.length === 0) {
              return 'Please mark one word as the Spangram';
            }
            if (spangrams.length > 1) {
              return 'Only one word can be the Spangram';
            }

            // Validate spangram length (>= 6)
            const spangram = spangrams[0];
            if (spangram?.word && spangram.word.length < 6) {
              return `Spangram must be at least 6 characters (currently ${spangram.word.length})`;
            }

            // Validate total character count (must equal 48 for 8x6 grid)
            const totalChars = words.reduce((sum: number, w) => {
              return sum + (w.word?.length || 0);
            }, 0);

            if (totalChars !== 48) {
              return `Total characters must equal 48 for grid generation (currently ${totalChars})`;
            }

            return true;
          }),
    }),

    defineField({
      name: 'gridGenerator',
      title: '✨ Generate Your Grid',
      type: 'gridGenerator',
      group: 'puzzle',
      description: 'Click the button below to automatically generate a grid from your theme words',
      hidden: false,  // Explicitly show this field
    }),

    defineField({
      name: 'canonicalGrid',
      title: 'Canonical Grid',
      type: 'canonicalGrid',
      group: 'puzzle',
      description: 'Unified grid structure with word positions (auto-generated)',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          // Only require canonicalGrid when gridLocked is true
          const parent = context?.parent as any;
          const isLocked = parent?.gridLocked === true;

          if (isLocked && !value) {
            return 'Grid must be generated before locking';
          }
          return true;
        }),
      readOnly: true, // Make it read-only since it's auto-generated
      hidden: true, // Hide from UI - data is auto-generated and shown in preview
    }),

    defineField({
      name: 'gridLocked',
      title: 'Grid is Finalized',
      type: 'boolean',
      group: 'puzzle',
      description: 'Lock the grid to prevent accidental regeneration',
      initialValue: false,
      readOnly: ({parent}) => parent?.gridLocked === true,
    }),

    defineField({
      name: 'hintWordAnalyzer',
      title: '🔍 Analyze Hint Words',
      type: 'hintWordAnalyzer',
      group: 'puzzle',
      description: 'Discover all valid English words in your grid to test quality and find hint words',
      hidden: ({parent}) => !parent?.canonicalGrid,
    }),

    defineField({
      name: 'gridMetadata',
      title: 'Grid Generation Info',
      type: 'object',
      group: 'puzzle',
      readOnly: true,
      hidden: ({parent}) => !parent?.gridLocked,
      fields: [
        defineField({
          name: 'generatedAt',
          title: 'Generated At',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({
          name: 'hintWordCount',
          title: 'Available Hint Words',
          type: 'number',
          readOnly: true,
        }),
        defineField({
          name: 'algorithm',
          title: 'Algorithm Version',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 'canonicalPaths',
          title: 'Canonical Word Paths',
          type: 'text',
          description: 'JSON map of theme words to their canonical paths (cell indices)',
          readOnly: true,
          rows: 10,
        }),
      ],
    }),

    defineField({
      name: 'hintWords',
      title: 'Hint Words',
      type: 'array',
      of: [{type: 'string'}],
      group: 'puzzle',
      description: 'Valid English words in the grid that players can discover for hint progress (checked before API validation)',
      hidden: ({parent}) => !parent?.canonicalGrid,
      validation: (Rule) => Rule.max(100),
    }),

    defineField({
      name: 'theme',
      title: 'Puzzle Theme',
      type: 'object',
      group: 'puzzle',
      fields: [
        defineField({
          name: 'category',
          title: 'Theme Category',
          type: 'string',
          description: 'What connects all the words?',
          placeholder: 'e.g., "Things you find at the beach"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'clue',
          title: 'Player Clue',
          type: 'string',
          description: 'The hint players see (can be cryptic)',
          placeholder: 'e.g., "Where the waves meet the sand"',
          validation: (Rule) => Rule.required().max(100),
        }),
      ],
    }),

    // GAMEPLAY GROUP
    defineField({
      name: 'difficulty',
      title: 'Difficulty Level',
      type: 'string',
      group: 'gameplay',
      options: {
        list: [
          {title: '🟢 Easy - Common words', value: 'easy'},
          {title: '🟡 Medium - Mixed difficulty', value: 'medium'},
          {title: '🔴 Hard - Obscure words', value: 'hard'},
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    }),

    defineField({
      name: 'hintMode',
      title: 'Hint System',
      type: 'string',
      group: 'gameplay',
      options: {
        list: [
          {title: 'Category hint + 3-word accumulator', value: 'standard'},
          {title: 'No hints (expert mode)', value: 'none'},
        ],
        layout: 'radio',
      },
      initialValue: 'standard',
    }),

    defineField({
      name: 'timeLimit',
      title: 'Time Limit (minutes)',
      type: 'number',
      group: 'gameplay',
      description: 'Set to 0 for unlimited time',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(30),
    }),

    defineField({
      name: 'scoring',
      title: 'Scoring System',
      type: 'object',
      group: 'gameplay',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'pointsPerWord',
          title: 'Points per Word',
          type: 'number',
          initialValue: 10,
          validation: (Rule) => Rule.min(1).max(100),
        }),
        defineField({
          name: 'spangramBonus',
          title: 'Spangram Bonus Points',
          type: 'number',
          initialValue: 50,
          validation: (Rule) => Rule.min(1).max(500),
        }),
      ],
    }),

    defineField({
      name: 'reward',
      title: 'Completion Reward',
      type: 'object',
      group: 'gameplay',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enable Reward',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'type',
          title: 'Reward Type',
          type: 'string',
          options: {
            list: [
              {title: 'Discount Code', value: 'discount'},
              {title: 'Badge/Achievement', value: 'badge'},
              {title: 'Message Only', value: 'message'},
            ],
          },
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'discountCode',
          title: 'Discount Code',
          type: 'string',
          hidden: ({parent}) => parent?.type !== 'discount',
        }),
        defineField({
          name: 'discountPercent',
          title: 'Discount Percentage',
          type: 'number',
          hidden: ({parent}) => parent?.type !== 'discount',
          validation: (Rule) => Rule.min(5).max(50),
        }),
        defineField({
          name: 'message',
          title: 'Completion Message',
          type: 'text',
          rows: 3,
          hidden: ({parent}) => !parent?.enabled,
          placeholder: 'Congratulations! You solved the puzzle!',
        }),
      ],
    }),

  ],

  preview: {
    select: {
      title: 'title',
      themeWords: 'themeWords',
      status: 'status',
      gridLocked: 'gridLocked',
    },
    prepare({title, themeWords, status, gridLocked}) {
      const statusEmojiMap: Record<string, string> = {
        draft: '📝',
        ready: '✅',
        published: '🚀',
      };
      const statusEmoji = statusEmojiMap[status] || '📝';

      const spangram = themeWords?.find((w: any) => w.isSpangram);
      const wordCount = themeWords?.length || 0;

      return {
        title: `${statusEmoji} ${title || 'Untitled Puzzle'}`,
        subtitle: `${wordCount} words${spangram ? ` | Spangram: ${spangram.word}` : ''}${gridLocked ? ' | Grid locked ✓' : ''}`,
        media: Gamepad2,
      };
    },
  },

  orderings: [
    {
      title: 'Title (A-Z)',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
    {
      title: 'Title (Z-A)',
      name: 'titleDesc',
      by: [{field: 'title', direction: 'desc'}],
    },
  ],
});
