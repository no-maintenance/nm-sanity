import {Form} from '@remix-run/react';
import {StrandsGame} from '~/components/games/strands-game';
import type {ProtectionConfig, ProtectionContext, ProtectionViewState} from '~/lib/site-protection-states';
import {LockedView} from './LockedView';
import {PasswordGrantedView} from './PasswordGrantedView';
import {CountdownExpiredView} from './CountdownExpiredView';

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
  const handlePuzzleComplete = () => {
    // Submit form to trigger puzzle-completed action
    const form = document.getElementById('puzzle-complete-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  // Render protection overlay based on view state
  const renderProtectionOverlay = () => {
    if (viewState === 'fully-unlocked' || actionData?.puzzleCompleted) {
      // Don't show overlay if fully unlocked or puzzle completed
      return null;
    }

    return (
      <div className="fixed inset-0 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            {viewState === 'locked' && (
              <LockedView
                protection={protection}
                protectionContext={protectionContext}
                redirectTo={redirectTo}
                actionData={actionData}
                isOverlay={true}
              />
            )}
            {viewState === 'password-granted' && (
              <PasswordGrantedView
                protection={protection}
                protectionContext={protectionContext}
                isOverlay={true}
              />
            )}
            {viewState === 'countdown-expired' && (
              <CountdownExpiredView
                protection={protection}
                protectionContext={protectionContext}
                redirectTo={redirectTo}
                actionData={actionData}
                isOverlay={true}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Hidden form for puzzle completion */}
      <Form method="post" id="puzzle-complete-form" className="hidden">
        <input type="hidden" name="actionType" value="puzzle-completed" />
        <input type="hidden" name="redirectTo" value={redirectTo} />
      </Form>

      {/* Puzzle game (always visible) */}
      <div className="relative z-10">
        <StrandsGame
          puzzle={puzzle}
          onPuzzleComplete={handlePuzzleComplete}
          protectionCountdown={protection.countdown}
          isProtected={true}
        />
      </div>

      {/* Protection overlay */}
      {renderProtectionOverlay()}

      {/* Show promo code if puzzle completed in 'both' mode with countdown active */}
      {actionData?.puzzleCompleted && actionData?.promoCode && (
        <div className="fixed bottom-4 right-4 z-30 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg max-w-sm">
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