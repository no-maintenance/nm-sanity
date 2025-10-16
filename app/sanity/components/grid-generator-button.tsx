import type {ObjectInputProps} from 'sanity';

import {Button, Card, Flex, Stack, Text} from '@sanity/ui';
import {useCallback, useState} from 'react';
import {set, unset} from 'sanity';

// Simplified version for Sanity Studio - the full algorithm would be too heavy for browser
// In production, this could call an API endpoint to generate the grid server-side

type GridGeneratorButtonProps = ObjectInputProps & {
  value?: {
    generated?: boolean;
    message?: string;
  };
};

export function GridGeneratorButton(props: GridGeneratorButtonProps) {
  const {onChange, value} = props;
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get the document context
      const documentValue = (props as any).document;
      const themeWords = documentValue?.themeWords || [];

      if (themeWords.length === 0) {
        setError('Please add theme words first');
        setIsGenerating(false);
        return;
      }

      const spangram = themeWords.find((w: any) => w.isSpangram);
      if (!spangram) {
        setError('Please mark one word as the Spangram');
        setIsGenerating(false);
        return;
      }

      // Import the grid generator
      const {generateStrandsGrid} = await import('~/lib/games/grid-generator');

      // Generate the grid
      const result = await generateStrandsGrid({
        themeWords: themeWords.map((w: any) => ({
          word: w.word.toUpperCase(),
          isSpangram: w.isSpangram || false,
        })),
        ensureHints: true,
        minHintWords: 15,
      });

      if (!result.success && !result.grid) {
        setError(result.warning || 'Failed to generate grid. Please try again.');
        setIsGenerating(false);
        return;
      }

      // Update the document with generated grid using patches
      const patches = [];

      // Set the generated grid
      patches.push({
        type: 'set' as const,
        path: ['generatedGrid'],
        value: result.grid,
      });

      // Lock the grid
      patches.push({
        type: 'set' as const,
        path: ['gridLocked'],
        value: true,
      });

      // Set metadata
      patches.push({
        type: 'set' as const,
        path: ['gridMetadata'],
        value: {
          generatedAt: new Date().toISOString(),
          hintWordCount: result.hintWordCount,
          algorithm: 'v1.0',
        },
      });

      // Apply patches
      (props as any).onFieldGroupChange?.(patches);

      // Update this field's value to show success
      onChange(set({generated: true, message: `✓ Grid generated with ${result.hintWordCount} hint words`}));

      setIsGenerating(false);
    } catch (err) {
      console.error('Grid generation error:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsGenerating(false);
    }
  }, [onChange, props]);

  const handleUnlock = useCallback(() => {
    const patches = [
      {
        type: 'set' as const,
        path: ['gridLocked'],
        value: false,
      },
      {
        type: 'unset' as const,
        path: ['gridMetadata'],
      },
    ];

    (props as any).onFieldGroupChange?.(patches);
    onChange(unset());
    setError(null);
  }, [onChange, props]);

  const documentValue = (props as any).document;
  const gridLocked = documentValue?.gridLocked;
  const gridMetadata = documentValue?.gridMetadata;
  const themeWords = documentValue?.themeWords || [];

  return (
    <Card padding={3} radius={2} shadow={1}>
      <Stack space={3}>
        <Flex gap={2} align="center">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || gridLocked || themeWords.length === 0}
            tone="primary"
            text={isGenerating ? 'Generating Grid...' : 'Generate Grid from Words'}
            style={{flex: 1}}
          />
          {gridLocked && (
            <Button
              onClick={handleUnlock}
              tone="caution"
              text="Unlock & Regenerate"
              mode="ghost"
            />
          )}
        </Flex>

        {error && (
          <Card padding={2} tone="critical" radius={2}>
            <Text size={1}>{error}</Text>
          </Card>
        )}

        {gridLocked && gridMetadata && (
          <Card padding={2} tone="positive" radius={2}>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                ✓ Grid Generated & Locked
              </Text>
              <Text size={1} muted>
                {gridMetadata.hintWordCount} hint words available
              </Text>
              <Text size={1} muted>
                Generated: {new Date(gridMetadata.generatedAt).toLocaleString()}
              </Text>
            </Stack>
          </Card>
        )}

        {!gridLocked && themeWords.length === 0 && (
          <Card padding={2} tone="caution" radius={2}>
            <Text size={1}>Add theme words above to generate a grid</Text>
          </Card>
        )}

        {value?.message && (
          <Card padding={2} tone="positive" radius={2}>
            <Text size={1}>{value.message}</Text>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
