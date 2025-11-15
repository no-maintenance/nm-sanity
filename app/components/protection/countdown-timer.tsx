import type {CountdownTime} from '~/hooks/use-countdown';

interface CountdownTimerProps {
  countdownExpired: boolean;
  isHydrated: boolean;
  timeLeft: CountdownTime | null;
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
    <div className="text-center space-y-10">
      {label && (
        <p className="font-medium text-2xl md:text-3xl text-foreground uppercase ">
          {label}
        </p>
      )}
      {countdownExpired ? (
        <div className="text-center">
          <p className="text-3xl md:text-5xl font-bold text-foreground">NOW LIVE</p>
        </div>
      ) : (
        <div
          className="flex justify-center gap-2 md:gap-4 text-5xl"
          style={{
            opacity: isHydrated && timeLeft ? 1 : 0.3,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          <p className="font-bold tabular-nums">
            {timeLeft?.days
              ? `${timeLeft.days} ${timeLeft.days === 1 ? 'DAY' : 'DAYS'} `
              : ''}
            {String(timeLeft?.hours ?? 0).padStart(2, '0')}:
            {String(timeLeft?.minutes ?? 0).padStart(2, '0')}:
            {String(timeLeft?.seconds ?? 0).padStart(2, '0')}
          </p>
        </div>
      )}
    </div>
  );
}

