import type {ObjectInputProps} from 'sanity';

import {Button, Card, Stack, Text} from '@sanity/ui';
import {useCallback, useState} from 'react';
import {set, unset, useFormValue} from 'sanity';

// Simplified version for Sanity Studio - the full algorithm would be too heavy for browser
// In production, this could call an API endpoint to generate the grid server-side

type GridGeneratorButtonProps = ObjectInputProps & {
  value?: {
    generated?: boolean;
    message?: string;
    grid?: string;
    hintWordCount?: number;
  };
};

export function GridGeneratorButton(props: GridGeneratorButtonProps) {
  const {onChange, value} = props;
  // All hooks must be called at the top level, before any conditional returns
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedGridData, setGeneratedGridData] = useState<string | null>(null);

  // Use the form value hook - must be called unconditionally
  const document = useFormValue([]) as any;

  const handleGenerate = useCallback(async () => {
    if (!onChange) {
      setError('Grid generator not properly initialized');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get theme words from document
      const themeWords = document?.themeWords || [];

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
          word: w.word?.toUpperCase() || '',
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

      // Store the generated grid data
      setGeneratedGridData(result.grid);

      // Convert grid string (48 chars) to table format (8 rows x 6 columns)
      const gridString = result.grid;
      const rows = [];
      for (let i = 0; i < 8; i++) {
        const row = {
          _key: `row-${i}`,
          _type: 'tableRow',
          cells: gridString.slice(i * 6, (i + 1) * 6).split(''),
        };
        rows.push(row);
      }

      // Update the generatedGrid table field and metadata using onFieldGroupChange
      const patches = [
        {
          type: 'set' as const,
          path: ['generatedGrid'],
          value: {
            _type: 'table',
            rows,
          },
        },
        {
          type: 'set' as const,
          path: ['gridMetadata'],
          value: {
            generatedAt: new Date().toISOString(),
            hintWordCount: result.hintWordCount,
            algorithm: 'v1.0',
            canonicalPaths: JSON.stringify(result.canonicalPaths || {}, null, 2),
          },
        },
      ];

      // Update this field's value to show success
      onChange(set({
        generated: true,
        message: `✓ Grid generated with ${result.hintWordCount} hint words! The grid has been populated in the table below.`,
        grid: result.grid,
        hintWordCount: result.hintWordCount,
      }));

      // Update the generatedGrid field
      (props as any).onFieldGroupChange?.(patches);

      setIsGenerating(false);
      setError(null);
    } catch (err) {
      console.error('Grid generation error:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsGenerating(false);
    }
  }, [onChange, document, props]);

  const handleUnlock = useCallback(() => {
    if (!onChange) return;
    
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

  // Handle missing onChange more gracefully - it might not be available on initial render
  const themeWords = document?.themeWords || [];
  const spangram = themeWords.find((w: any) => w.isSpangram);
  const gridData = value?.grid || generatedGridData;

  return (
    <Card padding={4} radius={2} shadow={1} tone="primary">
      <Stack space={4}>
        {/* Instructions */}
        <Stack space={2}>
          <Text size={2} weight="bold">
            Step 1: Add Theme Words Above ↑
          </Text>
          <Text size={1} muted>
            • Add 3-6 theme words
          </Text>
          <Text size={1} muted>
            • Mark ONE word as the Spangram
          </Text>
        </Stack>

        {/* Status Messages */}
        {!onChange && (
          <Card padding={3} tone="default" radius={2}>
            <Text size={1}>⏳ Grid generator initializing...</Text>
          </Card>
        )}

        {themeWords.length === 0 && (
          <Card padding={3} tone="caution" radius={2}>
            <Text size={1}>⚠️ Please add theme words first</Text>
          </Card>
        )}

        {themeWords.length > 0 && !spangram && (
          <Card padding={3} tone="caution" radius={2}>
            <Text size={1}>⚠️ Please mark ONE word as the Spangram</Text>
          </Card>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!onChange || isGenerating || themeWords.length === 0 || !spangram}
          tone="primary"
          text={isGenerating ? '⏳ Generating Grid...' : '✨ Generate Grid from Words'}
          fontSize={2}
          padding={4}
        />

        {/* Error Display */}
        {error && (
          <Card padding={3} tone="critical" radius={2}>
            <Text size={1}>❌ {error}</Text>
          </Card>
        )}

        {/* Success + Copy Grid */}
        {gridData && (
          <Card padding={3} tone="positive" radius={2}>
            <Stack space={3}>
              <Text size={1} weight="bold">
                ✅ {value?.message || 'Grid Generated!'}
              </Text>
              <Card padding={3} radius={2} tone="transparent" style={{backgroundColor: '#f0f0f0'}}>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Copy this grid:
                  </Text>
                  <code style={{
                    display: 'block',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    letterSpacing: '2px',
                    wordBreak: 'break-all',
                    userSelect: 'all',
                  }}>
                    {gridData}
                  </code>
                  <Text size={1} muted>
                    👆 Click to select all, then copy (Cmd+C / Ctrl+C)
                  </Text>
                </Stack>
              </Card>
              <Text size={1}>
                📋 The grid has been automatically populated in the table below ↓
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
