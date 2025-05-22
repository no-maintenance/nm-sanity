import { defineField, defineType, defineArrayMember } from 'sanity';

export default defineType({
  name: 'sizeChartTemplate',
  title: 'Size Chart Template',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Template Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'headers',
      title: 'Headers',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'internationalizedArrayString',
              description: 'Translatable label for this column header',
            })
          ],
          preview: {
            select: {
              title: 'label.0.value',
            },
          },
        }),
      ],
      validation: Rule => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      headers: 'headers',
    },
    prepare({ title, headers }) {
      return {
        title: title || 'Unnamed Template',
        subtitle: headers ? `${headers.length} headers` : '0 headers'
      };
    }
  },
}); 