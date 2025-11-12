import {defineField, defineType} from 'sanity';
import {Gamepad2} from 'lucide-react';

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
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(30)
          .custom((words) => {
            if (!words) return true;
            const spangrams = words.filter((w: any) => w.isSpangram);
            if (spangrams.length === 0) {
              return 'Please mark one word as the Spangram';
            }
            if (spangrams.length > 1) {
              return 'Only one word can be the Spangram';
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
      name: 'generatedGrid',
      title: 'Generated Grid',
      type: 'table',
      group: 'puzzle',
      description:
        '8 rows × 6 columns grid. Each cell should contain a single uppercase letter.',
      validation: (Rule) =>
        Rule.custom((grid: any) => {
          if (!grid || !grid.rows) return 'Grid is required';
          if (grid.rows.length !== 8) {
            return `Grid must have exactly 8 rows (currently ${grid.rows.length})`;
          }
          for (let i = 0; i < grid.rows.length; i++) {
            const row = grid.rows[i];
            if (!row.cells || row.cells.length !== 6) {
              return `Row ${i + 1} must have exactly 6 cells (currently ${row.cells?.length || 0})`;
            }
            for (let j = 0; j < row.cells.length; j++) {
              const cell = row.cells[j];
              if (!cell || !/^[A-Z]$/.test(cell)) {
                return `Cell at row ${i + 1}, column ${j + 1} must be a single uppercase letter (currently: "${cell}")`;
              }
            }
          }
          return true;
        }),
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
      hidden: ({parent}) => !parent?.generatedGrid,
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
      hidden: ({parent}) => !parent?.generatedGrid,
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
        defineField({
          name: 'emoji',
          title: 'Theme Emoji',
          type: 'string',
          placeholder: '🏖️',
          validation: (Rule) => Rule.max(4),
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
