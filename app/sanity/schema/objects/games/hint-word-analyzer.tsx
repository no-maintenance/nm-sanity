/**
 * Sanity Schema Object: Hint Word Analyzer
 * Custom input component for analyzing hint words in a Strands grid
 */

import {defineType} from 'sanity';
import {GenerateHintWordsButton} from '~/sanity/components/generate-hint-words-button';

export default defineType({
  name: 'hintWordAnalyzer',
  title: 'Hint Word Analyzer',
  type: 'object',
  fields: [
    {
      name: 'placeholder',
      type: 'string',
      hidden: true,
    },
  ],
  components: {
    input: (props) => {
      // Access parent document values
      const {value, ...rest} = props;
      const document = (props as any).document;

      return (
        <GenerateHintWordsButton
          grid={document?.generatedGrid}
          themeWords={document?.themeWords || []}
        />
      );
    },
  },
});

