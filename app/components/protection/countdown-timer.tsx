interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface CountdownTimerProps {
  countdownExpired: boolean;
  isHydrated: boolean;
  timeLeft: TimeLeft | null;
  label?: string;
  isEmbeddedPuzzle?: boolean;
}

export function CountdownTimer({
  countdownExpired,
  isHydrated,
  timeLeft,
  label,
  isEmbeddedPuzzle = false,
}: CountdownTimerProps) {
  return (
    <div className="text-center">
      {countdownExpired ? (
        <div className="text-center">
          <p className="text-3xl md:text-5xl font-bold text-foreground">NOW LIVE</p>
        </div>
      ) : (
        <div
          className="flex justify-center gap-2 md:gap-4 text-black text-base md:text-2xl lg:text-3xl"
          style={{
            opacity: isHydrated && timeLeft ? 1 : 0.3,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          <p className="font-bold tabular-nums">
            {timeLeft?.days ? `${timeLeft.days}d ` : ''}
            {String(timeLeft?.hours ?? 0).padStart(2, '0')}:
            {String(timeLeft?.minutes ?? 0).padStart(2, '0')}:
            {String(timeLeft?.seconds ?? 0).padStart(2, '0')}
          </p>
        </div>
      )}
    </div>
  );
}

