import {Form, useActionData} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {MediaField} from '../media-field';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import type {ProtectionConfig, ProtectionContext} from '~/lib/site-protection-states';
import {CountdownTimer} from './countdown-timer';

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
  isOverlay?: boolean;
  isSidebar?: boolean;
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

/**
 * Initial locked state - shows password field and/or countdown timer
 * User has not yet entered password or countdown hasn't expired
 */
export function LockedView({
  protection,
  protectionContext,
  redirectTo,
  actionData,
  isOverlay = false,
  isSidebar = false,
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

  // Sidebar layout for protected puzzle
  if (isSidebar) {
    return (
      <div className="flex flex-col w-full max-w-sm p-6 space-y-6">

        {/* Timer Section */}
        {showCountdown && (
          <CountdownTimer
            countdownExpired={countdownExpired}
            isHydrated={isHydrated}
            timeLeft={timeLeft}
            label={countdownLabel}
            isEmbeddedPuzzle={!!protection.embeddedPuzzle}
          />
        )}

        {/* Password Section */}
        {showPassword && (
          <div>
            <Form method="post" className="space-y-3">
              <input type="hidden" name="redirectTo" value={redirectTo} />
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
            </Form>
          </div>
        )}

        {/* Newsletter CTA - Placeholder */}
        <div>
          <Button className="w-full h-auto rounded-[3px] bg-[#2c2c2c] px-6 py-4 text-base font-medium text-[#f5f5f5] hover:bg-[#2c2c2c]/90">
            JOIN FOR EARLY ACCESS
          </Button>
        </div>

        {/* Help Icon */}
        <div className="flex justify-center">
          <button
            className="flex size-8 items-center justify-center transition-opacity hover:opacity-70"
            aria-label="Help"
            type="button"
          >
            <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="17" r="0.5" fill="currentColor" strokeWidth="0"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Original layout for overlay or full page
  return (
    <>
      {/* Collection/Product Context Indicator - hide in overlay mode */}
      {!isOverlay && (protectionContext.type === 'collection' || protectionContext.type === 'product') && (
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
        <h1 className={isOverlay ? "text-xl font-bold mb-3 text-foreground" : "text-3xl md:text-5xl font-bold mb-4 text-foreground"}>
          {title}
        </h1>
      )}

      {message && !isOverlay && (
        <p className="text-lg md:text-xl mb-8 text-muted-foreground">
          {message}
        </p>
      )}

      {showCountdown && (
        <div className="mb-8">
          <CountdownTimer
            countdownExpired={countdownExpired}
            isHydrated={isHydrated}
            timeLeft={timeLeft}
            label={countdownLabel}
            isEmbeddedPuzzle={!!protection.embeddedPuzzle}
          />
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