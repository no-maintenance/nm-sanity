import {Form, useActionData} from '@remix-run/react';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import type {ProtectionConfig, ProtectionContext} from '~/lib/site-protection-states';

interface CountdownExpiredViewProps {
  protection: ProtectionConfig;
  protectionContext: ProtectionContext;
  redirectTo: string;
  actionData?: any;
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
}: CountdownExpiredViewProps) {
  // Get localized content with state-specific fallbacks
  const title = getLocalizedValue(protection.countdownExpiredTitle) || 'Now Available';
  const message = getLocalizedValue(protection.countdownExpiredMessage) || 'Enter your password to access the content.';
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