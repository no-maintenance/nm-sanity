import type {StringRule, ValidationContext} from 'sanity';

import {defineField, defineType} from 'sanity';

import IconPalette from '~/sanity/components/icons/palette-icon';

import ColorSchemeMedia from '../../components/color-scheme';
import {validateDefaultStatus} from '../../utils/set-as-default-validation';

export default defineType({
  name: 'colorScheme',
  title: 'Color schemes',
  type: 'document',
  __experimental_formPreviewTitle: false,
  icon: IconPalette,
  fields: [
    defineField({
      name: 'name',
      title: 'Scheme name',
      type: 'string',
      validation: (Rule: StringRule) => Rule.required(),
    }),
    defineField({
      name: 'default',
      title: 'Set as default color scheme',
      type: 'boolean',
      validation: (Rule) =>
        Rule.required().custom(
          async (value, context: ValidationContext) =>
            await validateDefaultStatus(value, context),
        ),
      initialValue: false,
    }),
    defineField({
      name: 'background',
      title: 'Background',
      description: 'Main page and section background color',
      type: 'colorPicker',
    }),
    defineField({
      name: 'foreground',
      title: 'Foreground',
      description: 'Default text and foreground elements',
      type: 'colorPicker',
    }),
    defineField({
      name: 'primary',
      title: 'Primary',
      description: 'Primary interactive elements (buttons, links, CTAs)',
      type: 'colorPicker',
    }),
    defineField({
      name: 'primaryForeground',
      title: 'Primary Foreground',
      description: 'Text and icons on primary elements',
      type: 'colorPicker',
    }),
    defineField({
      name: 'border',
      title: 'Border',
      description: 'Lines, borders, dividers, and input field outlines',
      type: 'colorPicker',
    }),
    defineField({
      name: 'card',
      title: 'Card',
      description: 'Background color for cards, panels, and boxed content',
      type: 'colorPicker',
    }),
    defineField({
      name: 'cardForeground',
      title: 'Card Foreground',
      description: 'Text and elements on card backgrounds',
      type: 'colorPicker',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'default',
      background: 'background',
      foreground: 'foreground',
    },
    prepare({title, subtitle, background, foreground}) {
      return {
        title,
        subtitle: subtitle ? 'Default color scheme' : undefined,
        media: ColorSchemeMedia({background, foreground}),
      };
    },
  },
});
