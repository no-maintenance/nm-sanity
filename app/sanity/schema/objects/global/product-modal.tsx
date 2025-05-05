import {FileText} from 'lucide-react';
import {defineField, defineType} from 'sanity';

export default defineType({
  name: 'productModal',
  title: 'Modal',
  type: 'object',
  icon: FileText,
  fields: [
    defineField({
      name: 'triggerLabel',
      title: 'Trigger Label',
      description: 'Text shown for the modal trigger link (e.g., "Size Guide" or "Support")',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'modalTitle',
      title: 'Modal Title',
      description: 'Title shown at the top of the modal',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Modal Content',
      description: 'Content for the modal body',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          name: 'sizeChart',
          title: 'Size Chart',
          type: 'reference',
          to: [{type: 'product'}],
          options: {
            filter: 'defined(sizeChart)',
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'triggerLabel',
      subtitle: 'modalTitle',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Modal',
        subtitle: subtitle ? `Title: ${subtitle}` : '',
        media: FileText,
      };
    },
  },
});
