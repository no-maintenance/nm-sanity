import type {StringRule, ValidationContext} from 'sanity';

import {LayoutTemplate} from 'lucide-react';
import {defineField, defineType} from 'sanity';

import {validateDefaultStatus} from '../../utils/set-as-default-validation';

export default defineType({
  name: 'productTemplate',
  type: 'document',
  __experimental_formPreviewTitle: false,
  fields: [
    defineField({
      name: 'name',
      title: 'Template name',
      type: 'string',
      validation: (Rule: StringRule) => Rule.required(),
    }),
    defineField({
      name: 'default',
      title: 'Set as default template',
      type: 'boolean',
      validation: (Rule) =>
        Rule.required().custom(async (value, context: ValidationContext) =>
          validateDefaultStatus(value, context),
        ),
      initialValue: false,
    }),
    defineField({
      name: 'showBackInStockForm',
      title: 'Show Back in Stock Form?',
      description: 'When enabled, shows a "Notify me when back in stock" form for sold out products',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'sections',
      type: 'productSections',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'default',
    },
    prepare({title, subtitle}) {
      return {
        title,
        subtitle: subtitle ? 'Default template' : undefined,
        media: LayoutTemplate,
      };
    },
  },
});
