/**
 * Hint Button Component
 * Shows progress toward earning hints with a fill animation
 * Fills from left to right as hint progress increases based on WORDS_REQUIRED_FOR_HINT
 */

import {forwardRef} from 'react';
import {cn} from '~/lib/utils';
import {WORDS_REQUIRED_FOR_HINT} from '~/lib/games/strands-constants';

interface HintButtonProps {
  hintsEarned: number;
  hintProgress: number; // Progress toward next hint (0 to WORDS_REQUIRED_FOR_HINT-1)
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
  // Otherwise, show progress toward next hint (hintProgress counts from 0 to WORDS_REQUIRED_FOR_HINT-1)
  const fillPercentage = hintsEarned > 0
    ? 100
    : Math.min((hintProgress / WORDS_REQUIRED_FOR_HINT) * 100, 100);

  // Button is enabled only if we have hints earned
  const isButtonEnabled = hintsEarned > 0;

  return (
    <button
      ref={ref}
      className="relative h-auto overflow-hidden rounded-md border border-primary px-5 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 text-base font-medium transition-transform hover:scale-105"
      disabled={disabled || !isButtonEnabled}
      onClick={onClick}
      title={
        !isButtonEnabled
          ? `Find ${WORDS_REQUIRED_FOR_HINT} valid 4+ letter words to earn a hint (${hintProgress}/${WORDS_REQUIRED_FOR_HINT})`
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
        hintsEarned > 0 && "text-primary-foreground"
      )}>
        HINT
      </span>
    </button>
  );
});
