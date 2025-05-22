import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'sizeLabel',
  title: 'Size Label',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'string',
      validation: Rule => Rule.required(),
      description: 'Short code for this size (e.g., xs, s, m, l, xl)',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'internationalizedArrayString',
      validation: Rule => Rule.required(),
      description: 'Translatable label for this size (e.g., Small, Petit, Klein)',
    }),
  ],
  preview: {
    select: {
      label: 'label',
      code: 'code',
    },
    prepare({ label, code }) {
      let labelText = code;
      if (Array.isArray(label) && label.length > 0 && typeof label[0] === 'object' && 'value' in label[0]) {
        labelText = label[0].value;
      }
      return {
        title: labelText || code,
        subtitle: code,
      };
    },
  },
}); 