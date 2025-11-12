import {useEffect, useState} from 'react';
import type {ProtectionConfig, ProtectionContext} from '~/lib/site-protection-states';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface PasswordGrantedViewProps {
  protection: ProtectionConfig;
  protectionContext: ProtectionContext;
  isOverlay?: boolean;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0, total: 0};
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function TimeUnit({value, label}: {value: number; label: string}) {
  return (
    <div className="flex flex-col items-center" style={{minWidth: '60px'}}>
      <div
        className="text-4xl md:text-5xl font-bold tabular-nums"
        style={{
          lineHeight: '1.2',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {value.toString().padStart(2, '0')}
      </div>
      <div
        className="text-sm md:text-base uppercase mt-1"
        style={{
          opacity: 0.75,
          lineHeight: '1.2',
          minHeight: '20px'
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * Password granted state - password has been entered correctly,
 * but countdown is still active (for 'both' mode)
 */
export function PasswordGrantedView({
  protection,
  protectionContext,
  isOverlay = false,
}: PasswordGrantedViewProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize and update countdown (client-side only)
  useEffect(() => {
    setIsHydrated(true);

    if (!protection?.countdown) return;

    const initialRemaining = calculateTimeLeft(protection.countdown);
    setTimeLeft(initialRemaining);

    if (initialRemaining.total <= 0) {
      // Countdown has ended, reload to trigger state change
      window.location.reload();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(protection.countdown!);
      setTimeLeft(remaining);

      if (remaining.total <= 0) {
        clearInterval(interval);
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [protection?.countdown]);

  // Get localized content with state-specific fallbacks
  const title = getLocalizedValue(protection.passwordGrantedTitle) || 'Access Granted';
  const message = getLocalizedValue(protection.passwordGrantedMessage) || 'Please wait for the countdown to complete.';
  const countdownLabel = getLocalizedValue(protection.countdownLabel) || 'Time remaining';

  return (
    <>
      {/* Collection/Product Context Indicator */}
      {(protectionContext.type === 'collection' || protectionContext.type === 'product') && (
        <div className="mb-6">
          {protectionContext.type === 'collection' && (
            <p className="text-sm md:text-base uppercase tracking-wider text-muted-foreground mb-2">
              🔒 Collection Protected
            </p>
          )}
          {protectionContext.type === 'product' && (
            <p className="text-sm md:text-base uppercase tracking-wider text-muted-foreground mb-2">
              Product Protected
            </p>
          )}
          {protectionContext.collectionName && (
            <p className="text-base md:text-lg font-medium text-foreground">
              {protectionContext.collectionName}
            </p>
          )}
          {protectionContext.type === 'product' && protectionContext.productName && (
            <p className="text-sm text-muted-foreground">
              {protectionContext.productName}
            </p>
          )}
        </div>
      )}

      <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
        {title}
      </h1>

      <p className="text-lg md:text-xl mb-8 text-muted-foreground">
        {message}
      </p>

      {/* Success indicator */}
      <div className="mb-8">
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-6 text-center">
          <div className="text-green-500 text-4xl mb-2">✓</div>
          <p className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
            Password Accepted
          </p>
          <p className="text-muted-foreground">
            Your access has been verified. Please wait for the countdown to complete.
          </p>
        </div>
      </div>

      {/* Countdown display */}
      {protection.countdown && (
        <div className="mb-8">
          <p className="mb-6 text-sm md:text-base uppercase tracking-wider text-muted-foreground">
            {countdownLabel}
          </p>
          <div
            className="flex justify-center gap-2 md:gap-4 text-foreground"
            style={{
              minHeight: '80px',
              opacity: isHydrated && timeLeft ? 1 : 0.3,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            <TimeUnit value={timeLeft?.days ?? 0} label="Days" />
            <div className="text-3xl md:text-4xl font-bold self-start mt-2" style={{opacity: 0.5}}>:</div>
            <TimeUnit value={timeLeft?.hours ?? 0} label="Hours" />
            <div className="text-3xl md:text-4xl font-bold self-start mt-2" style={{opacity: 0.5}}>:</div>
            <TimeUnit value={timeLeft?.minutes ?? 0} label="Minutes" />
            <div className="text-3xl md:text-4xl font-bold self-start mt-2" style={{opacity: 0.5}}>:</div>
            <TimeUnit value={timeLeft?.seconds ?? 0} label="Seconds" />
          </div>
        </div>
      )}
    </>
  );
}

function getLocalizedValue(field: any[] | string | undefined): string | undefined {
  if (!field) return undefined;
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && field.length > 0) {
    return (field[0] as any)?.value;
  }
  return undefined;
}