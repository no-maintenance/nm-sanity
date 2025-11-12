import {defineField, defineType} from 'sanity';

export default defineType({
  name: 'canonicalGrid',
  title: 'Canonical Grid',
  type: 'object',
  fields: [
    defineField({
      name: 'cells',
      title: 'Grid Cells',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Flat array of 48 letters (8 rows × 6 columns)',
      validation: (Rule) =>
        Rule.required()
          .length(48)
          .custom((cells: string[] | undefined) => {
            if (!cells) return 'Grid cells are required';

            for (let i = 0; i < cells.length; i++) {
              if (!cells[i] || !/^[A-Z]$/.test(cells[i])) {
                return `Cell at index ${i} must be a single uppercase letter (got: "${cells[i]}")`;
              }
            }

            return true;
          }),
      readOnly: true,
    }),

    defineField({
      name: 'themePaths',
      title: 'Theme Word Paths',
      type: 'text',
      description: 'JSON map of theme words to their positions and colors in the grid',
      validation: (Rule) => Rule.required(),
      readOnly: true,
      rows: 10,
    }),

    defineField({
      name: 'hintPaths',
      title: 'Hint Word Paths',
      type: 'text',
      description: 'JSON map of discovered hint words to their positions',
      readOnly: true,
      rows: 10,
    }),

    defineField({
      name: 'metadata',
      title: 'Grid Metadata',
      type: 'object',
      fields: [
        defineField({
          name: 'generatedAt',
          title: 'Generated At',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({
          name: 'algorithm',
          title: 'Algorithm Version',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 'dimensions',
          title: 'Grid Dimensions',
          type: 'object',
          fields: [
            defineField({
              name: 'rows',
              type: 'number',
              initialValue: 8,
              readOnly: true,
            }),
            defineField({
              name: 'cols',
              type: 'number',
              initialValue: 6,
              readOnly: true,
            }),
          ],
          readOnly: true,
        }),
        defineField({
          name: 'totalHintWords',
          title: 'Total Hint Words',
          type: 'number',
          description: 'Number of valid hint words discovered in the grid',
          readOnly: true,
        }),
        defineField({
          name: 'seed',
          title: 'Generation Seed',
          type: 'string',
          description: 'Optional seed for reproducible generation',
          readOnly: true,
        }),
      ],
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      cells: 'cells',
      totalHintWords: 'metadata.totalHintWords',
      algorithm: 'metadata.algorithm',
    },
    prepare({cells, totalHintWords, algorithm}) {
      const gridPreview = cells
        ? cells.slice(0, 6).join('') + '...'
        : 'No grid';

      return {
        title: `Grid: ${gridPreview}`,
        subtitle: `${totalHintWords || 0} hint words | Algorithm: ${algorithm || 'unknown'}`,
      };
    },
  },
});