import {Form} from '@remix-run/react';
import {useCallback, useEffect, useRef} from 'react';
import {StrandsGame} from '~/components/games/strands-game';
import type {ProtectionConfig, ProtectionContext, ProtectionViewState} from '~/lib/site-protection-states';
import {LockedView} from './LockedView';
import {PasswordGrantedView} from './PasswordGrantedView';
import {CountdownExpiredView} from './CountdownExpiredView';
import {MediaField} from '../media-field';
import {useColorsCssVars} from '~/hooks/use-colors-css-vars';

interface ProtectedPuzzleContainerProps {
  puzzle: any; // Will be SanityStrandsPuzzle type
  protection: ProtectionConfig;
  protectionContext: ProtectionContext;
  viewState: ProtectionViewState;
  redirectTo: string;
  actionData?: any;
}

export function ProtectedPuzzleContainer({
  puzzle,
  protection,
  protectionContext,
  viewState,
  redirectTo,
  actionData,
}: ProtectedPuzzleContainerProps) {
  // Track if form has already been submitted to prevent duplicate submissions
  const hasSubmittedRef = useRef(false);

  // Mark as submitted if actionData indicates puzzle was already completed
  // This prevents re-submission after a successful action
  useEffect(() => {
    if (actionData?.puzzleCompleted || actionData?.success) {
      hasSubmittedRef.current = true;
    }
  }, [actionData]);

  const handlePuzzleComplete = useCallback(() => {
    // Prevent duplicate submissions
    if (hasSubmittedRef.current) {
      return;
    }

    // Don't submit if puzzle was already completed (check actionData)
    if (actionData?.puzzleCompleted || actionData?.success) {
      return;
    }

    // Submit form to trigger puzzle-completed action
    const form = document.getElementById('puzzle-complete-form') as HTMLFormElement;
    if (form) {
      hasSubmittedRef.current = true;
      form.requestSubmit();
    }
  }, [actionData]);

  // Generate CSS variables for color scheme
  const hasColorScheme = protection?.colorScheme != null;
  const colorsCssVars = useColorsCssVars({
    settings: hasColorScheme ? {colorScheme: protection.colorScheme as any} : undefined,
    selector: '#protected-puzzle-page'
  });
  console.log(protection, protection.backgroundImage, protection.backgroundVideo);
  return (
    <div id={hasColorScheme ? "protected-puzzle-page" : undefined} className="relative min-h-screen">
      {hasColorScheme && <style dangerouslySetInnerHTML={{__html: colorsCssVars}} />}

      {/* Background Media */}
      {(protection.backgroundImage || protection.backgroundVideo) && (
        <div className="absolute inset-0 h-full w-full">
          <MediaField
            mediaType={protection.mediaType || 'image'}
            image={protection.backgroundImage}
            video={protection.backgroundVideo}
            className="h-full w-full object-cover"
            objectFit="cover"
            priority
            controls={false}
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
          />
        </div>
      )}

      {/* Hidden form for puzzle completion */}
      <Form method="post" id="puzzle-complete-form" className="hidden">
        <input type="hidden" name="actionType" value="puzzle-completed" />
        <input type="hidden" name="redirectTo" value={redirectTo} />
      </Form>

      {/* Two-column layout on desktop, single column on mobile */}
      <div className="relative z-10 flex flex-col md:flex-row h-screen">
        {/* Left column: Protection info (desktop only) */}
        <div className="hidden md:flex md:flex-1 flex-col items-center justify-center">
          {viewState === 'locked' && (
            <LockedView
              protection={protection}
              protectionContext={protectionContext}
              redirectTo={redirectTo}
              actionData={actionData}
              isSidebar={true}
            />
          )}
          {viewState === 'password-granted' && (
            <PasswordGrantedView
              protection={protection}
              protectionContext={protectionContext}
              isSidebar={true}
            />
          )}
          {viewState === 'countdown-expired' && (
            <CountdownExpiredView
              protection={protection}
              protectionContext={protectionContext}
              redirectTo={redirectTo}
              actionData={actionData}
              isSidebar={true}
            />
          )}
        </div>

        {/* Right column: Puzzle game */}
        <div className="flex-1 flex items-center justify-center overflow-auto">
          <StrandsGame
            puzzle={puzzle}
            onPuzzleComplete={handlePuzzleComplete}
            protectionCountdown={protection.countdown}
            isProtected={true}
            hideHeaderOnMobile={true}
          />
        </div>
      </div>

      {/* Show promo code if puzzle completed in 'both' mode with countdown active */}
      {actionData?.puzzleCompleted && actionData?.promoCode && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-bold mb-2">Puzzle Complete!</h3>
          <p className="mb-2">{protection.puzzleCompletionMessage?.[0]?.value || 'Congratulations!'}</p>
          {actionData.promoCode && (
            <p className="font-mono bg-white px-2 py-1 rounded">
              Promo Code: {actionData.promoCode}
            </p>
          )}
          {protection.countdown && (
            <p className="text-sm mt-2">Full access will be granted when the countdown expires.</p>
          )}
        </div>
      )}
    </div>
  );
}