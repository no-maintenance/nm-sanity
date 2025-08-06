import {Tag} from 'lucide-react';
import {defineField, defineType} from 'sanity';

import type {SlugInt} from '../../utils/slug';

import {validateIntSlug} from '../../utils/slug';

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
      name: 'description',
      type: 'internationalizedArrayText',
      title: 'Description',
      description: 'Brief description of what this category covers',
      validation: (Rule) => Rule.max(160).warning('Keep under 160 characters for SEO'),
    }),
    defineField({
      name: 'slug',
      type: 'internationalizedArraySlug',
      title: 'Slug',
      description: 'URL-friendly version of the category name',
      validation: (Rule) =>
        Rule.required().custom((slugArray: SlugInt[], context) =>
          validateIntSlug({slugArray, context}),
        ),
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