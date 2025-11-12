/**
 * Server-side API route to validate words using Datamuse API
 * Avoids CORS issues by proxying the request through the server
 */
import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

interface DatamuseWord {
  word: string;
  score: number;
  tags?: string[];
  defs?: string[]; // Dictionary definitions (only present for real dictionary words)
}

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const word = url.searchParams.get('word');

  if (!word) {
    return json({error: 'Word parameter is required'}, {status: 400});
  }

  const normalizedWord = word.toLowerCase().trim();

  // Basic validation
  if (!normalizedWord || normalizedWord.length === 0) {
    return json({
      isValid: false,
      word,
      error: 'Word cannot be empty',
    });
  }

  // Check if word contains only letters
  if (!/^[a-z]+$/i.test(normalizedWord)) {
    return json({
      isValid: false,
      word,
      error: 'Word must contain only letters',
    });
  }

  try {
    // Query Datamuse API from server-side with timeout and retry
    // Use md=d parameter to request definitions (only real dictionary words have definitions)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(
        `https://api.datamuse.com/words?md=d&sp=${normalizedWord}&max=1`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        // If Datamuse is down or slow, reject the word gracefully
        console.warn(`Datamuse API returned ${response.status} for word: ${normalizedWord}`);
        return json({
          isValid: false,
          word: word.toUpperCase(),
          error: 'Dictionary temporarily unavailable - word not validated',
          apiDown: true,
        });
      }

      const results: DatamuseWord[] = await response.json();

      // Check if we got an exact match (case-insensitive)
      const exactMatch = results.find(
        (r) => r.word.toLowerCase() === normalizedWord.toLowerCase()
      );

      // Check if the word has definitions (defs field with content)
      // Words without definitions are pattern matches, not dictionary words
      const hasDefinitions = exactMatch && exactMatch.defs && exactMatch.defs.length > 0;

      const isValid = !!hasDefinitions;

      return json({
        isValid,
        word: word.toUpperCase(),
        error: isValid ? undefined : 'Not a valid English word',
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (fetchError.name === 'AbortError') {
        console.warn(`Datamuse API timeout for word: ${normalizedWord}`);
        return json({
          isValid: false,
          word: word.toUpperCase(),
          error: 'Dictionary request timed out - try again',
          apiDown: true,
        });
      }

      // Handle other fetch errors (network errors, etc.)
      console.error(`Datamuse API fetch error for word ${normalizedWord}:`, fetchError);
      return json({
        isValid: false,
        word: word.toUpperCase(),
        error: 'Dictionary service unavailable - please try again',
        apiDown: true,
      });
    }

  } catch (error) {
    console.error('Datamuse API error:', error);
    return json({
      isValid: false,
      word,
      error: 'Unable to validate word - dictionary unavailable',
      apiDown: true,
    });
  }
}
