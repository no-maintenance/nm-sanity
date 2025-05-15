import {EyeOff} from 'lucide-react';
import {defineField} from 'sanity';

import IconCollectionTag from '../../../components/icons/collection-tag-icon';

export default defineField({
  name: 'relatedProductsSection',
  title: 'Related Products',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'displayType',
      title: 'Display Type',
      description: 'Choose how to display the related products',
      type: 'string',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Swimlane', value: 'swimlane'},
        ],
        layout: 'radio',
      },
      initialValue: 'swimlane',
    }),
    defineField({
      name: 'maxProducts',
      title: 'Maximum products to show',
      type: 'rangeSlider',
      options: {
        min: 1,
        max: 25,
      },
      validation: (Rule) => Rule.required().min(1).max(25),
    }),
    defineField({
      name: 'desktopColumns',
      title: 'Number of columns on desktop',
      type: 'rangeSlider',
      options: {
        min: 1,
        max: 5,
      },
      validation: (Rule) => Rule.required().min(1).max(5),
      hidden: ({parent}) => parent?.displayType === 'swimlane',
    }),
    defineField({
      type: 'sectionSettings',
      name: 'settings',
    }),
  ],
  initialValue: {
    displayType: 'grid',
    maxProducts: 6,
    desktopColumns: 3,
  },
  preview: {
    select: {
      displayType: 'displayType',
      settings: 'settings',
    },
    prepare({displayType, settings}) {
      return {
        title: 'Related Products',
        subtitle: `${displayType === 'swimlane' ? 'Swimlane View' : 'Grid View'}`,
        media: () => (settings?.hide ? <EyeOff /> : <IconCollectionTag />),
      };
    },
  },
});
