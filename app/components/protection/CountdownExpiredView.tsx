import {Form} from '@remix-run/react';
import {useState} from 'react';
import {Button} from '../ui/button';
import type {ProtectionConfig, ProtectionContext} from '~/lib/site-protection-states';
import {JoinEarlyAccessDialog} from '~/components/games/join-early-access-dialog';
import {GameHelpDialog} from '~/components/games/game-help-dialog';
import {PasswordInput} from './password-input';

interface CountdownExpiredViewProps {
  protection: ProtectionConfig;
  protectionContext: ProtectionContext;
  redirectTo: string;
  actionData?: any;
  isOverlay?: boolean;
  isSidebar?: boolean;
}

/**
 * Countdown expired state - countdown has ended but password is still required
 * (for 'both' mode when user hasn't entered password yet)
 */
export function CountdownExpiredView({
  protection,
  protectionContext,
  redirectTo,
  actionData,
  isOverlay = false,
  isSidebar = false,
}: CountdownExpiredViewProps) {
  const [joinOpen, setJoinOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Get localized content with state-specific fallbacks
  const title = getLocalizedValue(protection.countdownExpiredTitle) || 'Now Available';
  const message = getLocalizedValue(protection.countdownExpiredMessage) || 'Enter your password to access the content.';
  const passwordLabel = getLocalizedValue(protection.passwordLabel);
  const actionError =
    actionData && typeof actionData === 'object' && 'error' in actionData
      ? (actionData.error as string | undefined)
      : undefined;
  const actionErrorKey =
    actionData && typeof actionData === 'object' && 'errorKey' in actionData
      ? (actionData.errorKey as string | number | undefined)
      : undefined;

  // Sidebar layout for protected puzzle
  if (isSidebar) {
    return (
      <div className="flex flex-col w-[350px] mx-auto space-y-6">
        {/* Launch indicator */}
        
        <div className="text-center"> 
          <p className="text-lg md:text-3xl font-bold mb-8 text-foreground">NOW LIVE</p>
        </div>

        {/* Password Section */}
        <div>
          <Form method="post" className="space-y-3">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <PasswordInput
              name="password"
              placeholder={passwordLabel ?? "Enter password"}
              required
              autoComplete="off"
              className="bg-foreground text-background"
              error={actionError}
              errorKey={actionErrorKey}
            />
            <Button type="submit" className="w-full">
              Enter Site
            </Button>
          </Form>
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
              JOIN FOR PASSWORD
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

      {/* Launch indicator */}
      <div className="mb-8">
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-6 text-center">
          <div className="text-blue-500 text-4xl mb-2">🚀</div>
          <p className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
            Now Live!
          </p>
          <p className="text-muted-foreground">
            The countdown has ended. Enter your password below to access the content.
          </p>
        </div>
      </div>

      {/* Password form */}
      <Form method="post" className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div className="space-y-4">
          <PasswordInput
            name="password"
            placeholder={passwordLabel ?? "Enter password"}
            required
            autoComplete="off"
            className="bg-foreground text-background"
            error={actionError}
            errorKey={actionErrorKey}
          />
          <Button type="submit" className="w-full">
            Enter Site
          </Button>
        </div>
      </Form>
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
