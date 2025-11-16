import {Form} from '@remix-run/react';
import {useEffect, useRef, useState} from 'react';
import type {ProtectionConfig, ProtectionContext} from '~/lib/site-protection-states';
import {useCountdown} from '~/hooks/use-countdown';
import {Button} from '~/components/ui/button';
import {JoinEarlyAccessDialog} from '~/components/games/join-early-access-dialog';
import {GameHelpDialog} from '~/components/games/game-help-dialog';

interface PasswordGrantedViewProps {
  protection: ProtectionConfig;
  protectionContext: ProtectionContext;
  redirectTo?: string;
  isOverlay?: boolean;
  isSidebar?: boolean;
}

function TimeUnit({value, label}: {value: number; label: string}) {
  // Handle pluralization: remove 's' if value is 1
  const displayLabel = value === 1 ? label.slice(0, -1) : label;

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
        {displayLabel}
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
  redirectTo,
  isOverlay = false,
  isSidebar = false,
}: PasswordGrantedViewProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const hasSubmittedExpirationRef = useRef(false);

  // Use countdown hook
  const { time: timeLeft, isExpired } = useCountdown({
    targetDate: protection?.countdown,
  });

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Handle countdown expiration
  useEffect(() => {
    if (isExpired && protection?.countdown && !hasSubmittedExpirationRef.current && protection.password) {
      hasSubmittedExpirationRef.current = true;
      const form = document.getElementById('countdown-expired-form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }
  }, [isExpired, protection?.countdown, protection?.password]);

  // Get localized content with state-specific fallbacks
  const title = getLocalizedValue(protection.passwordGrantedTitle) || 'Access Granted';
  const message = getLocalizedValue(protection.passwordGrantedMessage) || 'Please wait for the countdown to complete.';
  const countdownLabel = getLocalizedValue(protection.countdownLabel) || 'Time remaining';

  // Sidebar layout for protected puzzle
  if (isSidebar) {
    return (
      <>
        {/* Hidden form for countdown expiration */}
        {protection.password && (
          <Form method="post" id="countdown-expired-form" className="hidden">
            <input type="hidden" name="password" value={protection.password} />
            <input type="hidden" name="redirectTo" value={redirectTo || ''} />
          </Form>
        )}
        <div className="flex flex-col p-6 space-y-6 w-[350px] mx-auto">
        {protection.countdown && (
          <div className="text-center">
            <p className="text-sm font-normal mb-4 uppercase tracking-wider">{countdownLabel}</p>
            <div
              className="flex justify-center gap-2 text-foreground"
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

        {/* Success indicator */}
        <div>
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center ">
          You have now entered the queue.
          </div>
        </div>

        {/* Newsletter CTA */}
        <div>
          <JoinEarlyAccessDialog 
            open={joinOpen} 
            onOpenChange={setJoinOpen}
            password={protection.password}
            redirectTo={redirectTo}
          >
            <Button className="w-full">
              JOIN FOR EARLY ACCESS
            </Button>
          </JoinEarlyAccessDialog>
        </div>

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
      </>
    );
  }

  // Original layout for overlay or full page
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
       <p>You have now entered the queue.</p>
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