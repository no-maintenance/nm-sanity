import {defineType} from 'sanity';

import {GridGeneratorButton} from '~/sanity/components/grid-generator-button';

export default defineType({
  name: 'gridGenerator',
  type: 'object',
  title: 'Grid Generator',
  components: {
    input: GridGeneratorButton,
  },
  fields: [
    {
      name: 'generated',
      type: 'boolean',
      hidden: true,
    },
    {
      name: 'message',
      type: 'string',
      hidden: true,
    },
    {
      name: 'grid',
      type: 'text',
      hidden: true,
    },
    {
      name: 'hintWordCount',
      type: 'number',
      hidden: true,
    },
  ],
});

