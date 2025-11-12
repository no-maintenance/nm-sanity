import type {ArrayOfObjectsInputProps} from 'sanity';
import {Box, Card, Flex, Stack, Text} from '@sanity/ui';

type ThemeWord = {
  _key: string;
  word?: string;
  isSpangram?: boolean;
};

export function ThemeWordsWithCounter(props: ArrayOfObjectsInputProps) {
  const {value} = props;

  // Cast value to ThemeWord array
  const words = (value || []) as ThemeWord[];

  // Calculate total character count
  const totalChars = words.reduce((sum: number, item) => {
    return sum + (item.word?.length || 0);
  }, 0);

  const isExact = totalChars === 48;
  const spangram = words.find((item) => item.isSpangram);
  const spangramLength = spangram?.word?.length || 0;
  const isValidSpangram = spangramLength >= 6;

  return (
    <Stack space={3}>
      {/* Character Counter Card */}
      <Card
        padding={3}
        radius={2}
        tone={isExact ? 'positive' : 'caution'}
        shadow={1}
      >
        <Flex align="center" justify="space-between" gap={3}>
          <Box flex={1}>
            <Stack space={2}>
              <Flex align="center" gap={2}>
                <Text size={1} weight="semibold">
                  Character Count:
                </Text>
                <Text
                  size={2}
                  weight="bold"
                  style={{
                    color: isExact ? '#2e7d32' : '#ed6c02',
                  }}
                >
                  {totalChars} / 48
                </Text>
              </Flex>

              {spangram && (
                <Flex align="center" gap={2}>
                  <Text size={1} muted>
                    Spangram ({spangram.word}):
                  </Text>
                  <Text
                    size={1}
                    weight="semibold"
                    style={{
                      color: isValidSpangram ? '#2e7d32' : '#ed6c02',
                    }}
                  >
                    {spangramLength} chars {isValidSpangram ? '✓' : '(need 6+)'}
                  </Text>
                </Flex>
              )}
            </Stack>
          </Box>

          <Box>
            {isExact ? (
              <Text size={4} style={{color: '#2e7d32'}}>
                ✓
              </Text>
            ) : (
              <Text size={4} style={{color: '#ed6c02'}}>
                ⚠
              </Text>
            )}
          </Box>
        </Flex>

        {/* Progress Bar */}
        <Box marginTop={3}>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min((totalChars / 48) * 100, 100)}%`,
                height: '100%',
                backgroundColor: isExact ? '#2e7d32' : totalChars > 48 ? '#d32f2f' : '#ed6c02',
                transition: 'width 0.3s ease, background-color 0.3s ease',
              }}
            />
          </div>
        </Box>
      </Card>

      {/* Default Array Input */}
      {props.renderDefault(props)}
    </Stack>
  );
}
