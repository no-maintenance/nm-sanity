import {Tag} from 'lucide-react';
import {defineField, defineType} from 'sanity';

export default defineType({
  name: 'blogCategory',
  title: 'Editorial Categories',
  type: 'document',
  icon: Tag,
  __experimental_formPreviewTitle: false,
  fields: [
    defineField({
      name: 'title',
      type: 'internationalizedArrayString',
      title: 'Category Name',
      description: 'Name of this editorial category',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'URL-friendly version of the category name',
      options: {
        source: (doc: any) => doc.title?.[0]?.value,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'internationalizedArrayText',
      title: 'Description',
      description: 'Brief description of what this category covers',
      validation: (Rule) => Rule.max(160).warning('Keep under 160 characters for SEO'),
    }),
    defineField({
      name: 'color',
      type: 'colorPicker',
      title: 'Category Color',
      description: 'Optional color for this category (used in UI)',
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      title: 'SEO',
      description: 'SEO settings for the category page',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      description: 'description',
      color: 'color',
    },
    prepare({title, description, color}) {
      const titleText = title?.[0]?.value || 'Untitled Category';
      const descText = description?.[0]?.value;
      
      return {
        title: titleText,
        subtitle: descText || 'No description',
        media: Tag,
      };
    },
  },
});