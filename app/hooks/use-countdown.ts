import {useEffect, useState} from 'react';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export interface UseCountdownOptions {
  /** Target date/time string (ISO format) */
  targetDate: string | null | undefined;
  /** Update interval in milliseconds (default: 1000ms) */
  interval?: number;
}

export interface UseCountdownResult {
  /** Time remaining broken down by units */
  time: CountdownTime;
  /** Formatted countdown string (e.g., "2d 12:34:56" or "12:34:56") */
  formatted: string;
  /** Whether the countdown has expired */
  isExpired: boolean;
}

/**
 * Custom hook for countdown timer
 *
 * @param options - Configuration options
 * @returns Countdown time, formatted string, and expiration status
 *
 * @example
 * ```tsx
 * const { formatted, isExpired } = useCountdown({
 *   targetDate: '2025-12-31T23:59:59Z'
 * });
 * ```
 */
export function useCountdown({
  targetDate,
  interval = 1000,
}: UseCountdownOptions): UseCountdownResult {
  const [time, setTime] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!targetDate) {
      setTime({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      });
      return;
    }

    const calculateTimeLeft = (): CountdownTime => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isExpired: false,
      };
    };

    // Initial calculation
    setTime(calculateTimeLeft());

    // Update on interval
    const timerId = setInterval(() => {
      setTime(calculateTimeLeft());
    }, interval);

    return () => clearInterval(timerId);
  }, [targetDate, interval]);

  // Format the countdown string
  const formatted = time.isExpired
    ? '00:00:00'
    : time.days > 0
    ? `${time.days} ${time.days === 1 ? 'DAY' : 'DAYS'} ${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`
    : `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`;

  return {
    time,
    formatted,
    isExpired: time.isExpired,
  };
}
