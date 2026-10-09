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
      description: 'Drag to make the headline bigger or smaller on desktop. Leave empty for the default (17px). Mobile sizes itself automatically (~0.7x).',
      type: 'rangeSlider',
      // The current hero design runs ~17px desktop (see crash-denim-hero.tsx),
      // but this range used to start at 24 — leaving the saved value of 17
      // permanently invalid. Sanity disables Publish when ANY field on a
      // document fails validation, so that stale floor silently blocked every
      // edit to the Header (announcement bar, nav, everything). Floor is now 10.
      options: {min: 10, max: 80, suffix: 'px'},
      validation: (Rule) => Rule.min(10).max(80),
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
