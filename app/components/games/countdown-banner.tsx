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
  return (
    <div className="border-b border-foreground border-t">
      <div className="flex items-center justify-between px-2 text-sm">
        <p className="font-bold whitespace-nowrap">
          {label}
        </p>
        <p className="font-bold whitespace-nowrap text-xl">
          {countdown}
        </p>
      </div>
    </div>
  );
}
