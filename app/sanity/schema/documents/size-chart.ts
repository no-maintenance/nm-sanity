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
      name: 'garmentType',
      title: 'Garment Type',
      type: 'string',
      description:
        'Which measurement diagram to show for this product. Choose "Footwear" for products that should show the table only (no diagram). Leave blank to auto-detect from the product type.',
      options: {
        layout: 'dropdown',
        list: [
          { title: 'Bottoms', value: 'bottoms' },
          { title: 'Outerwear', value: 'outerwear' },
          { title: 'Footwear', value: 'footwear' },
          { title: 'Hoodie', value: 'hoodie' },
          { title: 'Knitwear / Jersey Longsleeve', value: 'knitwear' },
          { title: 'Jersey Shortsleeve', value: 'jersey' },
          { title: 'Shorts', value: 'shorts' },
        ],
      },
    }),
    defineField({
      name: 'modelMeasurements',
      title: 'Model Measurements',
      type: 'object',
      description:
        'Shown beside the size guide diagram. Leave blank to use the site default (6ft 1", size M, chest 35.5", waist 31").',
      options: { collapsed: true, collapsible: true },
      fields: [
        { name: 'height', title: 'Model Height', type: 'string', description: 'e.g. 6ft 1"' },
        { name: 'sizeWorn', title: 'Size Worn', type: 'string', description: 'e.g. M' },
        { name: 'chest', title: 'Chest', type: 'string', description: 'e.g. 35.5"' },
        { name: 'waist', title: 'Waist', type: 'string', description: 'e.g. 31"' },
      ],
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