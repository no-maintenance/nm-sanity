import {Form, useActionData} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {MediaField} from '../media-field';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import type {ProtectionConfig, ProtectionContext} from '~/lib/site-protection-states';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface LockedViewProps {
  protection: ProtectionConfig;
  protectionContext: ProtectionContext;
  redirectTo: string;
  actionData?: any;
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
 * Initial locked state - shows password field and/or countdown timer
 * User has not yet entered password or countdown hasn't expired
 */
export function LockedView({
  protection,
  protectionContext,
  redirectTo,
  actionData,
}: LockedViewProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const showPassword = ['password', 'both', 'either'].includes(protection.accessMode || '');
  const showCountdown = ['countdown', 'both', 'either'].includes(protection.accessMode || '');

  // Check if countdown has already expired (for showing "NOW LIVE" instead of timer)
  const countdownExpired = protection.countdown
    ? new Date(protection.countdown) <= new Date()
    : false;

  // Initialize and update countdown (client-side only)
  useEffect(() => {
    setIsHydrated(true);

    if (!protection?.countdown) return;

    const initialRemaining = calculateTimeLeft(protection.countdown);
    setTimeLeft(initialRemaining);

    if (initialRemaining.total <= 0) {
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

  // Get localized content
  const title = getLocalizedValue(protection.title) || 'Coming Soon';
  const message = getLocalizedValue(protection.message);
  const countdownLabel = getLocalizedValue(protection.countdownLabel);
  const passwordLabel = getLocalizedValue(protection.passwordLabel);

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

      {title && (
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
          {title}
        </h1>
      )}

      {message && (
        <p className="text-lg md:text-xl mb-8 text-muted-foreground">
          {message}
        </p>
      )}

      {showCountdown && (
        <div className="mb-8">
          {countdownExpired ? (
            <div className="text-center">
              <p className="text-4xl md:text-6xl font-bold text-foreground">
                NOW LIVE
              </p>
            </div>
          ) : (
            <>
              {countdownLabel && (
                <p className="mb-6 text-sm md:text-base uppercase tracking-wider text-muted-foreground">
                  {countdownLabel}
                </p>
              )}
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
            </>
          )}
        </div>
      )}

      {showCountdown && showPassword && protection.accessMode === 'either' && !countdownExpired && (
        <div className="my-6 md:my-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 uppercase tracking-wider bg-background text-muted-foreground">
                Or
              </span>
            </div>
          </div>
        </div>
      )}

      {showPassword && (
        <Form method="post" className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="space-y-4">
            <Input
              type="password"
              name="password"
              placeholder={passwordLabel ?? "Enter password"}
              required
              autoComplete="off"
              className="bg-foreground text-background"
            />
            {actionData && 'error' in actionData && actionData.error && (
              <p className="text-sm text-destructive">
                {actionData.error}
              </p>
            )}
            <Button type="submit" className="w-full">
              Enter Site
            </Button>
          </div>
        </Form>
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