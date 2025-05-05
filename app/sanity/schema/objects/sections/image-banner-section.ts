import {EyeOff} from 'lucide-react';
import {defineField} from 'sanity';

export default defineField({
  name: 'imageBannerSection',
  title: 'Image Banner',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      type: 'internationalizedArrayBannerRichtext',
    }),
    defineField({
      type: 'contentPosition',
      name: 'contentPosition',
    }),
    defineField({
      name: 'contentAlignment',
      type: 'contentAlignment',
    }),
    defineField({
      type: 'image',
      name: 'backgroundImage',
      
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'text',
          description: 'Important for accessibility and SEO. Describes the content and function of the image.',
          rows: 2,
        }),
      ],
      options: {
        hotspot: true,
        aiAssist: {
          imageDescriptionField: 'alt',
        },
      },
    }),
    defineField({
      name: 'bannerHeight',
      type: 'rangeSlider',
      options: {
        min: 0,
        max: 2000,
        suffix: 'px',
      },
      validation: (Rule) => Rule.min(0).max(2000),
    }),
    defineField({
      name: 'overlayOpacity',
      type: 'rangeSlider',
      options: {
        min: 0,
        max: 100,
        suffix: '%',
      },
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      type: 'sectionSettings',
      name: 'settings',
    }),
  ],
  initialValue: {
    overlayOpacity: 0,
    contentPosition: 'middle_center',
    bannerHeight: 450,
    settings: {
      padding: {
        top: 0,
        bottom: 0,
      },
    },
  },
  preview: {
    select: {
      media: 'backgroundImage',
      settings: 'settings',
    },
    prepare({media, settings}) {
      return {
        title: 'Image Banner',
        media: settings.hide ? EyeOff : media,
      };
    },
  },
});
