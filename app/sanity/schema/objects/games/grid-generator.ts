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
      name: 'placeholder',
      type: 'string',
      title: 'Generator',
      description: 'This field enables the grid generator',
      readOnly: true,
      initialValue: 'ready',
    },
  ],
});

