import {defineField, defineType} from 'sanity';

export default defineType({
  name: 'themeWord',
  title: 'Theme Word',
  type: 'object',
  fields: [
    defineField({
      name: 'word',
      title: 'Word',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .uppercase()
          .custom((word) => {
            if (!word) return true;
            if (!/^[A-Z]+$/.test(word)) {
              return 'Word must contain only uppercase letters A-Z';
            }
            return true;
          }),
    }),
    defineField({
      name: 'isSpangram',
      title: '⭐ This is the Spangram',
      description: 'The special word that spans opposite edges of the grid',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      word: 'word',
      isSpangram: 'isSpangram',
    },
    prepare({word, isSpangram}) {
      return {
        title: `${isSpangram ? '⭐ ' : ''}${word || 'Untitled'}`,
        subtitle: isSpangram ? 'Spangram' : 'Theme word',
      };
    },
  },
});
