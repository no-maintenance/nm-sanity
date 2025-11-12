import {m} from 'motion/react';
import {useEffect} from 'react';

interface Position {
  x: number;
  y: number;
}

interface HintWordAnimationProps {
  /** Array of source positions for each circle (one per letter) */
  sourcePositions: Position[];
  /** Target position (hint button center) */
  targetPosition: Position;
  /** Callback when animation completes */
  onComplete: () => void;
}

const STAGGER_DELAY = 120; // ms between each circle
const ANIMATION_DURATION = 500; // ms per circle

export function HintWordAnimation({
  sourcePositions,
  targetPosition,
  onComplete,
}: HintWordAnimationProps) {
  // Calculate total animation time
  const totalDuration = STAGGER_DELAY * (sourcePositions.length - 1) + ANIMATION_DURATION;

  // Call onComplete after all animations finish
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [onComplete, totalDuration]);

  if (sourcePositions.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {sourcePositions.map((sourcePos, index) => {
        const delay = index * STAGGER_DELAY;
        
        return (
          <m.div
            key={`hint-anim-${index}`}
            className="absolute h-8 w-8 rounded-full ring-2 ring-black bg-black"
            initial={{
              x: sourcePos.x - 16, // Center the 32px (h-8) circle
              y: sourcePos.y - 16,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: targetPosition.x - 16,
              y: targetPosition.y - 16,
              scale: 0.6,
              opacity: [1, 1, 0.8, 0], // Stay visible longer, then fade
            }}
            transition={{
              duration: ANIMATION_DURATION / 1000, // Convert to seconds
              delay: delay / 1000,
              ease: [0.25, 0.1, 0.25, 1], // ease-out curve
            }}
          />
        );
      })}
    </div>
  );
}

