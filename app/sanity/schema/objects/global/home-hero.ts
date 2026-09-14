import {Image} from 'lucide-react';
import {defineField, defineType} from 'sanity';

/**
 * Home Hero — the big image + headline at the top of the homepage.
 *
 * Editable in Studio under Header → "Home Hero". Leaving fields empty falls
 * back to the values hardcoded in `app/components/sections/crash-denim-hero.tsx`,
 * so the hero never renders blank.
 */
export default defineType({
  name: 'homeHero',
  title: 'Home Hero',
  type: 'object',
  fields: [
    defineField({
      name: 'desktopImage',
      title: 'Desktop image',
      description: 'Wide/landscape photo shown on computers. The whole image is shown (not cropped), so any wide shape works.',
      type: 'image',
      icon: Image,
      options: {hotspot: true, aiAssist: {imageDescriptionField: 'alt'}},
      fields: [
        defineField({name: 'alt', type: 'string', title: 'Alt text (for accessibility)'}),
      ],
    }),
    defineField({
      name: 'mobileImage',
      title: 'Mobile image',
      description: 'Tall/portrait photo shown on phones.',
      type: 'image',
      icon: Image,
      options: {hotspot: true, aiAssist: {imageDescriptionField: 'alt'}},
      fields: [
        defineField({name: 'alt', type: 'string', title: 'Alt text (for accessibility)'}),
      ],
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      description: 'The text shown over the photo, e.g. "FW26 DELIVERY 3: RELEASING 9/11".',
      type: 'string',
    }),
    defineField({
      name: 'headlineSize',
      title: 'Headline size (desktop)',
      description: 'Drag to make the headline bigger or smaller on desktop. Leave empty for the default (~50px). Mobile sizes itself automatically.',
      type: 'rangeSlider',
      options: {min: 24, max: 80, suffix: 'px'},
      validation: (Rule) => Rule.min(24).max(80),
    }),
    defineField({
      name: 'link',
      title: 'Link (path)',
      description: 'Where clicking the hero goes, e.g. /collections/new-arrivals',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'headline', media: 'desktopImage'},
    prepare: ({title, media}) => ({title: title || 'Home Hero', media}),
  },
});
