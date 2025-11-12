/**
 * Sanity Studio Component: Generate Hint Words Button
 *
 * Analyzes the puzzle grid and generates a list of valid hint words
 * that can be found in the grid. Useful for testing grid quality
 * and understanding what words players might discover.
 */

import {Button, Card, Code, Flex, Stack, Text, Spinner} from '@sanity/ui';
import {useState} from 'react';
import {SearchIcon} from '@sanity/icons';
import {generateHintWords, formatHintWordSummary, getTopHintWords} from '~/lib/games/hint-word-generator';
import type {GridData} from '~/lib/games/strands-logic';
import type {GridAnalysisResult} from '~/lib/games/hint-word-generator';

interface GenerateHintWordsButtonProps {
  grid?: GridData;
  themeWords?: Array<{word: string}>;
}

export function GenerateHintWordsButton({grid, themeWords = []}: GenerateHintWordsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GridAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({current: 0, total: 0});

  const handleGenerate = async () => {
    if (!grid) {
      setError('No grid available. Please generate a grid first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress({current: 0, total: 0});

    try {
      const themeWordStrings = themeWords.map(tw => tw.word);

      const analysisResult = await generateHintWords(
        grid,
        themeWordStrings,
        {
          minLength: 4,
          maxLength: 12,
          maxWords: 300,
          progressCallback: (p) => setProgress(p),
        }
      );

      setResult(analysisResult);
    } catch (err) {
      console.error('Error generating hint words:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyTopWords = () => {
    if (!result) return;

    const top20 = getTopHintWords(result, 20);
    const wordList = top20.map(w => w.word).join(', ');

    navigator.clipboard.writeText(wordList);
    alert('Top 20 words copied to clipboard!');
  };

  const handleCopyAllWords = () => {
    if (!result) return;

    const allWords = result.allWords.map(w => w.word).join(', ');
    navigator.clipboard.writeText(allWords);
    alert(`All ${result.totalWordsFound} words copied to clipboard!`);
  };

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} shadow={1}>
        <Stack space={3}>
          <Flex align="center" justify="space-between">
            <Text weight="semibold">Hint Word Analysis</Text>
            <Button
              icon={SearchIcon}
              text={isGenerating ? 'Generating...' : 'Analyze Grid'}
              onClick={handleGenerate}
              disabled={isGenerating || !grid}
              tone="primary"
            />
          </Flex>

          <Text size={1} muted>
            Discovers all valid English words in the grid. Use this to test grid quality
            and understand what hint words players might find.
          </Text>

          {isGenerating && (
            <Card padding={3} tone="transparent" border>
              <Flex align="center" gap={3}>
                <Spinner />
                <Text size={1}>
                  Finding words... {progress.current} found so far
                </Text>
              </Flex>
            </Card>
          )}

          {error && (
            <Card padding={3} tone="critical" border>
              <Text size={1}>{error}</Text>
            </Card>
          )}

          {result && (
            <Stack space={4}>
              {/* Summary Stats */}
              <Card padding={3} tone="positive" border>
                <Stack space={2}>
                  <Text size={2} weight="semibold">
                    ✅ Found {result.totalWordsFound} words in {result.processingStats.duration}ms
                  </Text>
                  <Flex gap={4} wrap="wrap">
                    <Text size={1}>
                      <strong>4-letter:</strong> {result.gridQuality.fourLetterWords}
                    </Text>
                    <Text size={1}>
                      <strong>5-letter:</strong> {result.gridQuality.fiveLetterWords}
                    </Text>
                    <Text size={1}>
                      <strong>6+ letter:</strong> {result.gridQuality.sixPlusLetterWords}
                    </Text>
                    <Text size={1}>
                      <strong>Avg length:</strong> {result.gridQuality.averageWordLength}
                    </Text>
                  </Flex>
                  <Text size={1} muted>
                    Cache hit rate: {Math.round((result.processingStats.cacheHits / (result.processingStats.apiCalls + result.processingStats.cacheHits)) * 100)}%
                    ({result.processingStats.cacheHits} cached, {result.processingStats.apiCalls} API calls)
                  </Text>
                </Stack>
              </Card>

              {/* Action Buttons */}
              <Flex gap={2}>
                <Button
                  text="Copy Top 20"
                  onClick={handleCopyTopWords}
                  mode="ghost"
                  fontSize={1}
                />
                <Button
                  text="Copy All Words"
                  onClick={handleCopyAllWords}
                  mode="ghost"
                  fontSize={1}
                />
              </Flex>

              {/* Top 20 Words */}
              <Card padding={3} border>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Top 20 Hint Words (Best for hints)
                  </Text>
                  <Text size={1} style={{wordWrap: 'break-word'}}>
                    {getTopHintWords(result, 20).map(w => w.word).join(', ')}
                  </Text>
                </Stack>
              </Card>

              {/* Words by Length */}
              <Card padding={3} border>
                <Stack space={3}>
                  <Text size={1} weight="semibold">Words by Length</Text>
                  {Array.from(result.wordsByLength.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([length, words]) => (
                      <Stack key={length} space={1}>
                        <Text size={1} weight="medium">
                          {length} letters ({words.length} words):
                        </Text>
                        <Text size={1} style={{wordWrap: 'break-word'}}>
                          {words.map(w => w.word).join(', ')}
                        </Text>
                      </Stack>
                    ))}
                </Stack>
              </Card>

              {/* Detailed Summary */}
              <Card padding={3} border>
                <Stack space={2}>
                  <Text size={1} weight="semibold">Detailed Analysis</Text>
                  <Code size={1} style={{whiteSpace: 'pre-wrap', fontSize: '11px'}}>
                    {formatHintWordSummary(result)}
                  </Code>
                </Stack>
              </Card>
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
