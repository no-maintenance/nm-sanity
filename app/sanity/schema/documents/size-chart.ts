import { FileText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'sizeChart',
  title: 'Size Chart',
  type: 'document',
  icon: FileText,
  description: 'Reusable size chart for products, including a table and optional image/description.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'For internal use only',
      validation: Rule => Rule.required(),
    }),
    // defineField({
    //   name: 'template',
    //   title: 'Size Chart Template',
    //   type: 'reference',
    //   to: [{ type: 'sizeChartTemplate' }],
    //   validation: Rule => Rule.required(),
    //   description: 'Select the template that defines the columns for this size chart.',
    // }),
    defineField({
      name: 'table',
      title: 'Size Table',
      type: 'table',
      description: 'The main size chart table.',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'richtext',
      description: 'Optional description or instructions for the size chart.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Optional image for the size chart (e.g., measurement diagram).',
      fields: [
        {
          name: 'alt',
          type: 'string',
          description: "Alt text for accessibility and SEO.",
          title: 'Alt Text',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Size Chart',
        media,
      };
    },
  },
}); 