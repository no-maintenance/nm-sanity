import {ImageIcon} from '@sanity/icons';
import {EyeOff} from 'lucide-react';
import {defineField} from 'sanity';

export default defineField({
  name: 'featuredCollectionSection',
  title: 'Featured Collection',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'collection',
      type: 'reference',
      to: [{type: 'collection'}],
    }),
    defineField({
      name: 'displayType',
      title: 'Display Type',
      description: 'Choose how to display the products from this collection',
      type: 'string',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Swimlane', value: 'swimlane'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
    }),
    // Grid-specific settings
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
      name: 'viewAll',
      type: 'boolean',
      title: 'View all button',
      description: 'Show a button to view all products in the collection.',
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
      collection: 'collection.store',
      displayType: 'displayType',
      settings: 'settings',
    },
    prepare({collection, displayType, settings}) {
      return {
        title: collection?.title || 'No collection selected',
        subtitle: `Featured Collection (${displayType === 'swimlane' ? 'Swimlane View' : 'Grid View'})`,
        media: () =>
          settings?.hide ? (
            <EyeOff />
          ) : collection?.imageUrl ? (
            <img alt={collection.title} src={collection.imageUrl} />
          ) : (
            <ImageIcon />
          ),
      };
    },
  },
});
