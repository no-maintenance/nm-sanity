import {Form, useActionData} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {MediaField} from '../media-field';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import type {ProtectionConfig, ProtectionContext} from '~/lib/site-protection-states';
import {CountdownTimer} from './countdown-timer';
import {useCountdown} from '~/hooks/use-countdown';

interface LockedViewProps {
  protection: ProtectionConfig;
  protectionContext: ProtectionContext;
  redirectTo: string;
  actionData?: any;
  isOverlay?: boolean;
  isSidebar?: boolean;
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
  const [isHydrated, setIsHydrated] = useState(false);

  const showPassword = ['password', 'both', 'either'].includes(protection.accessMode || '');
  const showCountdown = ['countdown', 'both', 'either'].includes(protection.accessMode || '');

  // Use countdown hook
  const { time: timeLeft, isExpired } = useCountdown({
    targetDate: protection?.countdown,
  });

  // Check if countdown has already expired (for showing "NOW LIVE" instead of timer)
  const countdownExpired = isExpired;

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Reload page when countdown expires
  useEffect(() => {
    if (isExpired && protection?.countdown) {
      window.location.reload();
    }
  }, [isExpired, protection?.countdown]);

  // Get localized content
  const title = getLocalizedValue(protection.title) || 'Coming Soon';
  const message = getLocalizedValue(protection.message);
  const countdownLabel = getLocalizedValue(protection.countdownLabel);
  const passwordLabel = getLocalizedValue(protection.passwordLabel);

  // Sidebar layout for protected puzzle
  if (isSidebar) {
    return (
      <div className="flex flex-col w-full max-w-[640px] mx-auto p-8 md:p-12 space-y-8 text-center">

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
          <div className="space-y-6 w-full">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide">
              {title}
            </h1>

            {/* Subtitle */}
            {message && (
              <p className="text-base md:text-lg text-muted-foreground">
                {message}
              </p>
            )}

            {/* Password Form */}
            <Form method="post" className="space-y-4 mt-8">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Input
                type="password"
                name="password"
                placeholder={passwordLabel ?? "Enter password"}
                required
                autoComplete="off"
                className="h-14 text-base bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
              {actionData && 'error' in actionData && actionData.error && (
                <p className="text-sm text-destructive">
                  {actionData.error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full h-14 text-base bg-black text-white hover:bg-black/90 rounded-none"
              >
                ENTER THE QUEUE
              </Button>
            </Form>
          </div>
        )}
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
              className="text-background"
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