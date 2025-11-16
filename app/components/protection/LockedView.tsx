import {Form, useActionData} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {MediaField} from '../media-field';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import type {ProtectionConfig, ProtectionContext} from '~/lib/site-protection-states';
import {CountdownTimer} from './countdown-timer';
import {useCountdown} from '~/hooks/use-countdown';
import {GameHelpDialog} from '../games/game-help-dialog';
import {JoinEarlyAccessDialog} from '../games/join-early-access-dialog';

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

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
      <div className="flex flex-col w-full p-6 space-y-10 text-center">

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
          <div className="space-y-3  w-[350px] mx-auto">
            <Form method="post" className="space-y-3">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Input
                type="password"
                name="password"
                placeholder={passwordLabel ?? "Enter password"}
                required
                autoComplete="off"
                className="bg-transparent  border-foreground"
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
            <JoinEarlyAccessDialog 
              open={joinOpen} 
              onOpenChange={setJoinOpen}
              password={protection.password}
              redirectTo={redirectTo}
            >
              <Button className="w-full">
                JOIN FOR PASSWORD
              </Button>
            </JoinEarlyAccessDialog>
          </div>
        )}

        {/* Help Icon */}
        <div className="flex justify-center">
          <GameHelpDialog open={helpOpen} onOpenChange={setHelpOpen}>
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
          </GameHelpDialog>
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
