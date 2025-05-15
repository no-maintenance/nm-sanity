import {EyeOff} from 'lucide-react';
import {defineField} from 'sanity';

import IconCollectionTag from '../../../components/icons/collection-tag-icon';

export default defineField({
  name: 'productSwimlaneSection',
  title: 'Product Swimlane',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      type: 'internationalizedArrayString',
      title: 'Heading',
      description: 'The title that appears above the product swimlane',
    }),
    defineField({
      name: 'source',
      title: 'Product Source',
      description: 'Select where products should be sourced from',
      type: 'string',
      options: {
        list: [
          {title: 'Manual Selection', value: 'manual'},
          {title: 'Collection', value: 'collection'},
          {title: 'Related Products', value: 'related'},
        ],
        layout: 'radio',
      },
      initialValue: 'manual',
    }),
    defineField({
      name: 'manualProducts',
      title: 'Products',
      description: 'Select specific products to display',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      hidden: ({parent}) => parent?.source !== 'manual',
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      description: 'Select a collection to display products from',
      type: 'reference',
      to: [{type: 'collection'}],
      hidden: ({parent}) => parent?.source !== 'collection',
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
      initialValue: 12,
    }),
    defineField({
      name: 'viewAll',
      type: 'boolean',
      title: 'View all button',
      description: 'Show a button to view all products in the collection.',
      hidden: ({parent}) => parent?.source !== 'collection',
      initialValue: true,
    }),
    defineField({
      type: 'sectionSettings',
      name: 'settings',
    }),
  ],
  initialValue: {
    maxProducts: 12,
  },
  preview: {
    select: {
      heading: 'heading',
      source: 'source',
      collection: 'collection.store.title',
      settings: 'settings',
    },
    prepare({heading, source, collection, settings}) {
      let title = heading?.[0]?.value || 'Product Swimlane';
      let subtitle = '';
      
      switch (source) {
        case 'manual':
          subtitle = 'Manually selected products';
          break;
        case 'collection':
          subtitle = `Products from: ${collection || 'No collection selected'}`;
          break;
        case 'related':
          subtitle = 'Related products';
          break;
      }
      
      return {
        title,
        subtitle,
        media: () => (settings?.hide ? <EyeOff /> : <IconCollectionTag />),
      };
    },
  },
});
