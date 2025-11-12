import type {ObjectInputProps} from 'sanity';

import {Button, Card, Stack, Text} from '@sanity/ui';
import {useCallback, useEffect, useState} from 'react';
import {useFormValue, useClient} from 'sanity';
import type {ThemeWordPath} from '~/lib/games/canonical-grid.types';
import {getThemeWordColor} from '~/lib/games/strands-logic';

// Simplified version for Sanity Studio - the full algorithm would be too heavy for browser
// In production, this could call an API endpoint to generate the grid server-side

type GridGeneratorButtonProps = ObjectInputProps & {
  value?: {
    placeholder?: string;
  };
};

// Helper function to find a word path in the grid
function findWordPath(
  word: string,
  startRow: number,
  startCol: number,
  grid: string[][],
  used: Set<string> = new Set()
): number[][] | null {
  if (!word) return [];

  const cell = `${startRow},${startCol}`;
  if (grid[startRow]?.[startCol] !== word[0]) return null;
  if (word.length === 1) return [[startRow, startCol]];

  used.add(cell);

  // Check all 8 neighbors
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = startRow + dr;
      const nc = startCol + dc;
      const neighborCell = `${nr},${nc}`;

      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 6 && !used.has(neighborCell)) {
        const path = findWordPath(word.slice(1), nr, nc, grid, new Set(used));
        if (path) return [[startRow, startCol], ...path];
      }
    }
  }

  return null;
}

// Find all theme words in the grid
function findAllWords(gridString: string, themeWords: Array<{word: string; isSpangram: boolean}>) {
  const grid: string[][] = [];
  for (let i = 0; i < 8; i++) {
    grid.push(gridString.slice(i * 6, (i + 1) * 6).split(''));
  }

  const wordPaths: Record<string, number[][]> = {};

  for (const {word} of themeWords) {
    const upperWord = word.toUpperCase();
    let found = false;

    for (let r = 0; r < 8 && !found; r++) {
      for (let c = 0; c < 6 && !found; c++) {
        const path = findWordPath(upperWord, r, c, grid);
        if (path) {
          wordPaths[upperWord] = path;
          found = true;
        }
      }
    }
  }

  return wordPaths;
}

export function GridGeneratorButton(props: GridGeneratorButtonProps) {
  const {value} = props;

  // Use Sanity client hook for proper API access
  const client = useClient({apiVersion: '2024-01-01'});

  // All hooks must be called at the top level, before any conditional returns
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedGridData, setGeneratedGridData] = useState<string | null>(null);

  // Use the form value hook to access the parent document - must be called unconditionally
  const document = useFormValue([]) as any;

  const [canonicalPaths, setCanonicalPaths] = useState<Record<string, number[]> | null>(null);

  // Restore canonical paths from saved data when document changes
  useEffect(() => {
    if (document?.gridMetadata?.canonicalPaths) {
      try {
        const parsed = JSON.parse(document.gridMetadata.canonicalPaths);
        setCanonicalPaths(parsed);
      } catch (e) {
        console.error('Failed to parse canonical paths:', e);
      }
    }
    if (document?.canonicalGrid?.cells) {
      setGeneratedGridData(document.canonicalGrid.cells.join(''));
    }
  }, [document?.gridMetadata?.canonicalPaths, document?.canonicalGrid?.cells]);

  const handleGenerate = useCallback(async () => {
    if (!document?._id) {
      setError('Document not yet saved. Please save the document first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCanonicalPaths(null);

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

      // Import the V2 grid generator (customstrandsnyt algorithm)
      const {generateStrandsGrid} = await import('~/lib/games/grid-generator-v2');

      // Generate the grid
      console.log('Generating grid with theme words:', themeWords.map((w: any) => w.word));

      const result = await generateStrandsGrid({
        themeWords: themeWords.map((w: any) => ({
          word: w.word?.toUpperCase() || '',
          isSpangram: w.isSpangram || false,
        })),
        ensureHints: false,
        minHintWords: 0,
      });

      console.log('Generation result:', {
        hasGrid: !!result.grid,
        gridLength: result.grid?.length,
        hintWordCount: result.hintWordCount,
        warning: result.warning,
      });

      if (!result.grid || result.grid.length === 0) {
        const errorMsg = result.warning || 'Failed to generate grid. Theme words may not fit on the 8x6 grid. Try using shorter words or fewer words.';
        console.error('Grid generation failed:', errorMsg);
        setError(errorMsg);
        setIsGenerating(false);
        return;
      }

      // Store the generated grid data and canonical paths
      setGeneratedGridData(result.grid);
      setCanonicalPaths(result.canonicalPaths || {});

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

      // Create canonical grid structure
      const themePaths: Record<string, ThemeWordPath> = {};
      const canonicalPaths = result.canonicalPaths || {};

      // Build theme paths with colors
      themeWords.forEach((tw: any, index: number) => {
        const word = tw.word?.toUpperCase() || '';
        const path = canonicalPaths[word];

        if (path) {
          // Calculate color index (non-spangram words only)
          const nonSpangramIndex = themeWords
            .slice(0, index)
            .filter((w: any) => !w.isSpangram)
            .length;

          const color = getThemeWordColor(nonSpangramIndex, tw.isSpangram);

          themePaths[word] = {
            word,
            path,
            isSpangram: tw.isSpangram || false,
            color,
          };
        }
      });

      // Create the canonical grid object
      // Note: themePaths and hintPaths are stored as JSON strings in Sanity
      const canonicalGrid = {
        cells: gridString.split(''),
        themePaths: JSON.stringify(themePaths, null, 2),
        hintPaths: JSON.stringify(result.hintPaths || {}, null, 2),
        metadata: {
          generatedAt: new Date().toISOString(),
          algorithm: 'v2',
          dimensions: { rows: 8, cols: 6 },
          totalHintWords: result.hintWordCount || 0,
        },
      };

      console.log('Generated canonicalGrid:', canonicalGrid);

      // Use Sanity client to directly patch the document
      // This is the proper Sanity pattern for custom input components that generate data
      try {
        console.log('Saving canonicalGrid to document...');

        await client
          .patch(document._id)
          .set({
            canonicalGrid: canonicalGrid,
            gridMetadata: {
              generatedAt: new Date().toISOString(),
              hintWordCount: result.hintWordCount || 0,
              algorithm: 'v2',
              canonicalPaths: JSON.stringify(result.canonicalPaths || {}, null, 2),
            },
          })
          .commit();

        console.log('✅ Grid saved successfully to document');
        setError(null);
      } catch (saveError) {
        console.error('Failed to save grid:', saveError);
        setError(`Failed to save grid: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
      }

      setIsGenerating(false);
    } catch (err) {
      console.error('Grid generation error:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsGenerating(false);
    }
  }, [client, document]);

  // Get theme words for validation and display
  const themeWords = document?.themeWords || [];
  const spangram = themeWords.find((w: any) => w.isSpangram);
  const gridData = generatedGridData;

  return (
    <Card padding={4} radius={2} shadow={1} tone="primary">
      <Stack space={4}>
        {/* Instructions */}
        <Stack space={2}>
          <Text size={2} weight="bold">
            Step 1: Add Theme Words Above ↑
          </Text>
          <Text size={1} muted>
            • Add theme words that total exactly 48 letters
          </Text>
          <Text size={1} muted>
            • Mark ONE word as the Spangram (6+ letters)
          </Text>
          <Text size={1} muted>
            • Current total: {themeWords.reduce((sum: number, w: any) => sum + (w.word?.length || 0), 0)} / 48 letters
          </Text>
        </Stack>

        {/* Status Messages */}
        {!document?._id && (
          <Card padding={3} tone="caution" radius={2}>
            <Text size={1}>⚠️ Please save the document first before generating a grid</Text>
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

        {themeWords.length > 0 && themeWords.reduce((sum: number, w: any) => sum + (w.word?.length || 0), 0) !== 48 && (
          <Card padding={3} tone="caution" radius={2}>
            <Text size={1}>
              ⚠️ Words must total exactly 48 letters (currently {themeWords.reduce((sum: number, w: any) => sum + (w.word?.length || 0), 0)})
            </Text>
          </Card>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={
            !document?._id ||
            isGenerating ||
            themeWords.length === 0 ||
            !spangram ||
            themeWords.reduce((sum: number, w: any) => sum + (w.word?.length || 0), 0) !== 48
          }
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

        {/* Success + Visual Grid Preview */}
        {gridData && (
          <Card padding={3} tone="positive" radius={2}>
            <Stack space={3}>
              <Text size={1} weight="bold">
                ✅ Grid Generated Successfully!
              </Text>

              {/* Visual 8x6 Grid Preview */}
              <Card padding={3} radius={2} tone="transparent">
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Grid Preview (8 rows × 6 columns):
                  </Text>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 40px)',
                    gap: '4px',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}>
                    {(() => {
                      // Use canonical paths directly instead of searching
                      const cellToWord: Record<string, {word: string; isSpangram: boolean}> = {};

                      if (canonicalPaths) {
                        themeWords.forEach((tw: any) => {
                          const upperWord = tw.word?.toUpperCase();
                          const path = canonicalPaths[upperWord];

                          if (path) {
                            path.forEach((cellIndex: number) => {
                              const row = Math.floor(cellIndex / 6);
                              const col = cellIndex % 6;
                              const key = `${row},${col}`;
                              cellToWord[key] = {word: upperWord, isSpangram: tw.isSpangram};
                            });
                          }
                        });
                      }

                      // Word colors - distinct colors for each word
                      const wordColors: Record<string, string> = {};
                      const colors = [
                        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739'
                      ];
                      themeWords.forEach((tw: any, idx: number) => {
                        wordColors[tw.word?.toUpperCase()] = colors[idx % colors.length];
                      });

                      return gridData.split('').map((letter, idx) => {
                        const row = Math.floor(idx / 6);
                        const col = idx % 6;
                        const key = `${row},${col}`;
                        const wordInfo = cellToWord[key];

                        return (
                          <div
                            key={idx}
                            style={{
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: wordInfo
                                ? wordColors[wordInfo.word]
                                : '#e0e0e0',
                              border: wordInfo?.isSpangram
                                ? '3px solid #2E7D32'
                                : '2px solid #999',
                              borderRadius: '4px',
                              color: '#fff',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                              position: 'relative',
                            }}
                            title={wordInfo ? `${wordInfo.word}${wordInfo.isSpangram ? ' (Spangram)' : ''}` : ''}
                          >
                            {letter}
                            {wordInfo?.isSpangram && (
                              <span style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                fontSize: '10px',
                              }}>★</span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </Stack>
              </Card>

              {/* Theme Words List */}
              <Card padding={3} radius={2} tone="transparent" style={{backgroundColor: '#f0f0f0'}}>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Theme Words (color-coded to match grid):
                  </Text>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {themeWords.map((w: any, idx: number) => {
                      const colors = [
                        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739'
                      ];
                      return (
                        <div
                          key={w._key}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: colors[idx % colors.length],
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            border: w.isSpangram ? '3px solid #2E7D32' : 'none',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          }}
                        >
                          {w.word?.toUpperCase()} {w.isSpangram && '★'}
                        </div>
                      );
                    })}
                  </div>
                </Stack>
              </Card>

              {/* Copy Grid String */}
              <Card padding={3} radius={2} tone="transparent" style={{backgroundColor: '#f0f0f0'}}>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Copy this grid string:
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

              {/* Regenerate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                tone="primary"
                mode="ghost"
                text={isGenerating ? '⏳ Regenerating...' : '🔄 Regenerate Grid'}
                fontSize={1}
              />

              <Text size={1}>
                📋 The canonical grid has been saved ✓
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
