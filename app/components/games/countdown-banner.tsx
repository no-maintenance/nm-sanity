interface CountdownBannerProps {
  /** Countdown display string (e.g., "02:26:03" or "1d 02:26:03") */
  countdown: string;
  /** Label text to display before countdown */
  label?: string;
}

/**
 * Mobile countdown banner for game header
 * Based on Figma design: mobile countdown with black bottom border
 */
export function CountdownBanner({
  countdown,
  label = "Early access to NM's BFCM private sale in...",
}: CountdownBannerProps) {
  // Check if countdown has expired (all zeros)
  const isExpired = countdown === '00:00:00' || countdown === '0d 00:00:00';

  return (
    <div className="border-b border-foreground border-t">
      <div className="flex items-center justify-center px-2 py-1 text-sm">
        {isExpired ? (
          // When expired, show only the "NOW LIVE" label centered and larger
          <p className="font-bold text-xl uppercase">
            {label}
          </p>
        ) : (
          // When active, show label and countdown side by side
          <>
            <p className="font-bold whitespace-nowrap flex-1">
              {label}
            </p>
            <p className="font-bold whitespace-nowrap text-xl">
              {countdown}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
