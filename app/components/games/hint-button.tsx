/**
 * Hint Button Component
 * Shows progress toward earning hints with a fill animation
 * Fills from left to right as hint progress increases (0/3 → 1/3 → 2/3 → 3/3)
 */

import {forwardRef} from 'react';
import {cn} from '~/lib/utils';

interface HintButtonProps {
  hintsEarned: number;
  hintProgress: number; // 0-2 (progress toward next hint)
  disabled?: boolean;
  onClick?: () => void;
}

export const HintButton = forwardRef<HTMLButtonElement, HintButtonProps>(function HintButton({
  hintsEarned,
  hintProgress,
  disabled = false,
  onClick,
}, ref) {
  // Calculate fill percentage
  // If we have hints available, show full (100%)
  // Otherwise, show progress toward next hint (0%, 33%, 66%)
  const fillPercentage = hintsEarned > 0 ? 100 : (hintProgress / 3) * 100;

  return (
    <button
      ref={ref}
      className="relative h-auto overflow-hidden rounded-md border border-primary px-5 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 text-base font-medium transition-transform hover:scale-105"
      disabled={disabled || hintsEarned === 0}
      onClick={onClick}
      title={
        hintsEarned === 0
          ? 'Find 3 valid 4+ letter words to earn a hint'
          : `Use a hint (${hintsEarned} available)`
      }
    >
      {/* Fill background that grows from left to right */}
      <div
        className="absolute left-0 top-0 h-full bg-primary transition-all duration-300 ease-out"
        style={{width: `${fillPercentage}%`}}
        aria-hidden="true"
      />

      {/* Button text */}
      <span className={cn(
        "relative z-10",
        "text-primary",
        (hintProgress > 1 || hintsEarned > 0) && "text-primary-foreground"

      )}>
        HINT
      </span>
    </button>
  );
});
