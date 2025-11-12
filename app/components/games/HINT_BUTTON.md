# Hint Button Component

Progressive fill button that visualizes hint progress in the Strands game.

## Overview

The `HintButton` component displays the hint count and shows visual progress toward earning the next hint. As players find valid 4+ letter words, the button fills from left to right (0% → 33% → 66% → 100%).

## Usage

```tsx
import {HintButton} from './hint-button';

<HintButton
  hintsEarned={3}          // Total hints available
  hintProgress={2}         // Progress toward next (0-2)
  disabled={false}         // Optional: disable button
  onClick={handleUseHint}  // Callback when clicked
/>
```

## Visual States

### Empty (0/3 progress, 0 hints)
```text
┌──────────────┐
│ HINT (0)     │  ← Outline only, no fill
└──────────────┘
```

### 1/3 Progress (0 hints)
```text
┌──────────────┐
│█░░ HINT (0)  │  ← 33% filled
└──────────────┘
```

### 2/3 Progress (0 hints)
```text
┌──────────────┐
│████░ HINT (0)│  ← 66% filled
└──────────────┘
```

### 1 Hint Earned (stays full)
```text
┌──────────────┐
│██████ HINT(1)│  ← 100% filled, stays full
└──────────────┘
```

### Multiple Hints Stacked
```text
┌──────────────┐
│██████ HINT(3)│  ← 100% filled, shows count
└──────────────┘
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hintsEarned` | `number` | - | Total hints available to use |
| `hintProgress` | `number` | - | Progress toward next hint (0-2) |
| `disabled` | `boolean` | `false` | Whether button is disabled |
| `onClick` | `() => void` | - | Callback when button is clicked |

## How It Works

1. **Fill Percentage**:
   - If `hintsEarned > 0`: Always shows 100% (full)
   - Otherwise: `(hintProgress / 3) * 100`
     - 0/3 = 0% filled
     - 1/3 = 33% filled
     - 2/3 = 66% filled
   - When 3/3 is reached, `hintsEarned` increments and button stays full

2. **Hint Stacking**:
   - Hints accumulate and stack
   - Button stays full (100%) as long as `hintsEarned > 0`
   - Progress continues in the background while hints are available
   - Only shows progress bar again when all hints are used

3. **Fill Animation**:
   - Smooth 300ms transition when progress changes
   - Fills from left to right
   - Black background (#000000)

4. **Text Color**:
   - Uses `mix-blend-difference` for contrast
   - Always readable against fill (white on black, black on white)

## Styling

The component uses:
- Tailwind CSS classes
- Existing `Button` component from `~/components/ui/button`
- `outline` variant with custom styles
- Absolute positioned fill div for progress visualization

### Key Classes

```tsx
// Button container
"relative h-auto overflow-hidden rounded-md border border-black px-5 py-2"

// Fill background
"absolute left-0 top-0 h-full bg-black transition-all duration-300"
style={{width: `${fillPercentage}%`}}

// Text (always visible)
"relative z-10 text-white mix-blend-difference"
```

## Implementation Notes

- **Mix Blend Mode**: The `mix-blend-difference` ensures text is always readable
  - On empty area: black text on white background
  - On filled area: white text on black background
  - Smooth transition as fill grows

- **Smooth Transition**: The `transition-all duration-300 ease-out` provides smooth fill animation

- **Accessibility**:
  - Title attribute explains how to earn hints
  - Disabled state when no hints available
  - ARIA label on fill div (`aria-hidden="true"`)

## Example in GameLockedView

```tsx
<HintButton
  hintsEarned={hintsEarned}
  hintProgress={hintProgress}
  disabled={hintsEarned === 0}
  onClick={() => {
    // Use a hint
    handleUseHint();
  }}
/>
```

## Game Logic Integration

The button integrates with the hint system:

1. **Finding Words**: When player finds a valid 4+ letter word:
   ```tsx
   setHintProgress(prev => prev + 1);
   if (hintProgress + 1 >= 3) {
     setHintsEarned(prev => prev + 1);
     setHintProgress(0); // Reset progress, start tracking next hint
   }
   ```

2. **Using Hints**: When button is clicked:
   ```tsx
   onClick={() => {
     if (hintsEarned > 0) {
       setHintsEarned(prev => prev - 1);
       // Show hint to player
       // Button will stay full if more hints available
       // Otherwise shows current progress
     }
   }
   ```

3. **Visual Feedback**: Progress indicator updates in real-time:
   - Find word 1 → Fill to 33% (if no hints available)
   - Find word 2 → Fill to 66% (if no hints available)
   - Find word 3 → Fill to 100%, earn hint, stays full
   - Find word 4 → Still 100% (1 hint earned, 1/3 progress)
   - Find word 5 → Still 100% (1 hint earned, 2/3 progress)
   - Find word 6 → Still 100% (2 hints earned)
   - Use hint → Still 100% if more hints, otherwise shows progress

## Design Credits

Based on Figma design with:
- Black outline border
- Progressive fill from left to right
- Mix-blend-difference for text contrast
- Matches Strands game aesthetic
