import {EyeOff, Image, ImageIcon} from 'lucide-react';
import {defineField} from 'sanity';

import IconTag from '../../../components/icons/tag-icon';

export default defineField({
  name: 'productInformationSection',
  title: 'Product Information',
  type: 'object',
  fields: [
    defineField({
      name: 'richtext',
      type: 'internationalizedArrayProductRichtext',
    }),
    defineField({
      type: 'string',
      name: 'desktopMediaWidth',
      title: 'Media Width',
      description: 'Set the width of the media column for simple gallery',
      options: {
        list: [
          {
            title: 'Small',
            value: 'small',
          },
          {
            title: 'Medium',
            value: 'medium',
          },
          {
            title: 'Large',
            value: 'large',
          },
        ],
        layout: 'radio',
      },
      hidden: ({ parent }) => parent?.galleryStyle !== 'simple',
    }),
    defineField({
      type: 'string',
      name: 'desktopMediaPosition',
      title: 'Media Position',
      description: 'Set the position of the media column for simple gallery',
      options: {
        list: [
          {
            title: 'Left',
            value: 'left',
          },
          {
            title: 'Right',
            value: 'right',
          },
        ],
        layout: 'radio',
      },
      hidden: ({ parent }) => parent?.galleryStyle !== 'simple',
    }),
    defineField({
      type: 'string',
      name: 'galleryStyle',
      title: 'Gallery Style',
      description: 'Choose which gallery style to use for product images',
      options: {
        list: [
          {
            title: 'Scrollable Gallery',
            value: 'scrollable',
          },
          {
            title: 'Simple Gallery',
            value: 'simple',
          },
        ],
        layout: 'radio',
      },
      initialValue: 'scrollable',
    }),
    defineField({
      type: 'boolean',
      name: 'stickyProductInfo',
      title: 'Sticky Product Information',
      description: 'Make product information sticky when scrolling (recommended for scrollable gallery)',
      initialValue: true,
      hidden: ({parent}) => parent?.galleryStyle !== 'scrollable',
    }),
    defineField({
      type: 'aspectRatios',
      name: 'mediaAspectRatio',
    }),
    defineField({
      type: 'sectionSettings',
      name: 'settings',
    }),
  ],
  preview: {
    select: {
      settings: 'settings',
    },
    prepare({settings}) {
      return {
        title: 'Product Information',
        media: () => (settings?.hide ? <EyeOff /> : <IconTag />),
      };
    },
  },
});
