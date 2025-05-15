import {defineField} from 'sanity';
import {BookOpen} from 'lucide-react';

export default defineField({
  name: 'footerWithNav',
  title: 'Footer With Nav',
  type: 'object',
  icon: BookOpen,
  fields: [
    defineField({
      name: 'copyright',
      title: 'Copyright',
      type: 'internationalizedArrayString',
      description: 'Copyright text shown at the bottom of the footer (e.g. © NO MAINTENANCE CORP. 2024)',
    }),
    defineField({
      name: 'showNewsletter',
      title: 'Show Newsletter',
      type: 'boolean',
      description: 'Toggle to show or hide the newsletter subscription form',
      initialValue: true,
    }),
    defineField({
      name: 'showCountrySelector',
      title: 'Show Country Selector',
      type: 'boolean',
      description: 'Toggle to show or hide the country selector',
      initialValue: true,
    }),
    defineField({
      name: 'menu',
      title: 'Navigation Menu',
      type: 'internationalizedArrayHeaderNavigation',
      description: 'Add navigation links to display in the footer',
    }),
    defineField({
      type: 'sectionSettings',
      name: 'settings',
      description: 'Color settings and other styling options for the footer',
    }),
  ],
  preview: {
    select: {
      title: 'copyright',
    },
    prepare({title}) {
      return {
        title: title?.[0]?.value || 'Footer With Navigation',
        subtitle: 'Navigation links and newsletter subscription',
      };
    },
  },
});
