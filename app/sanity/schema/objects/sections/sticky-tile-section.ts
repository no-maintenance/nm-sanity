import {defineField, defineType, defineArrayMember} from 'sanity';
import {PanelRightOpen} from 'lucide-react';

export default defineType({
  name: 'stickyTileSection',
  title: 'Sticky Tile Section',
  type: 'object',
  icon: PanelRightOpen,
  fields: [
    defineField({
      name: 'stickyColumn',
      title: 'Sticky Column',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
      description: 'Choose which column is sticky on desktop.',
    }),
    defineField({
      name: 'tiles',
      title: 'Tiles',
      type: 'array',
      of: [defineArrayMember({type: 'tile'})],
      validation: (Rule) =>
        Rule.min(2).error(
          'At least two tiles are required for the sticky tile section.',
        ),
      description:
        'Define the tiles for this section. The first tile in the designated sticky column will be sticky, others will scroll.',
    }),
    defineField({
      type: 'sectionSettings', // Assuming this is a defined type
      name: 'settings',
    }),
  ],
  preview: {
    select: {
      tiles: 'tiles',
      stickyColumn: 'stickyColumn',
      settings: 'settings',
    },
    prepare({tiles, stickyColumn, settings}) {
      const count = tiles?.length || 0;
      return {
        title: 'Sticky Tile Section',
        subtitle: `Sticky: ${
          stickyColumn?.charAt(0).toUpperCase() + stickyColumn?.slice(1) || 'N/A'
        }, Tiles: ${count}`,
        media: settings?.hide ? undefined : PanelRightOpen, // Show icon unless hidden
      };
    },
  },
}); 