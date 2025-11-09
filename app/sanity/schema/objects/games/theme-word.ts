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
    defineField({
      name: 'difficulty',
      title: 'Word Difficulty',
      type: 'string',
      options: {
        list: [
          {title: '🟢 Easy', value: 'easy'},
          {title: '🟡 Medium', value: 'medium'},
          {title: '🔴 Hard', value: 'hard'},
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'hint',
      title: 'Optional Hint',
      description: 'A clue to help players find this specific word',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      word: 'word',
      isSpangram: 'isSpangram',
      difficulty: 'difficulty',
    },
    prepare({word, isSpangram, difficulty}) {
      const difficultyEmoji =
        {
          easy: '🟢',
          medium: '🟡',
          hard: '🔴',
        }[difficulty] || '';
      return {
        title: `${isSpangram ? '⭐ ' : ''}${word || 'Untitled'}`,
        subtitle: `${difficultyEmoji} ${difficulty || 'medium'}`,
      };
    },
  },
});
