import type {MetaFunction} from '@shopify/remix-oxygen';
import {useMemo} from 'react';

import {KeysGateExperience} from '~/components/protection/keys-gate-experience';
import {pickWinningKeys} from '~/lib/fw26-keys-gate/winning-keys';

export const meta: MetaFunction = () => {
  return [{title: 'FW26 Keys Gate — Preview'}];
};

/**
 * Standalone preview of the FW26 keys gate. Runs with no CMS / server round-
 * trip: a fresh random pair of winning keys is chosen per load, exactly like a
 * real visitor gets their own pair. On the live gate the pair is picked + stored
 * server-side per session (see the site-protected route).
 */
export default function Fw26KeysPreview() {
  // This "visitor's" winning keys — a fresh pair each page load.
  const winners = useMemo(() => pickWinningKeys(), []);

  // Add ?unlock=demo to make every key open the lock — handy for showing off
  // the turn-and-open animation without hunting for a real key.
  const alwaysWin =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('unlock') === 'demo';

  return (
    <KeysGateExperience
      redirectTo="/"
      winningIndices={winners}
      attempt={async (index) => {
        // Small delay to mimic the network round-trip + "testing" state.
        await new Promise((r) => setTimeout(r, 260));
        return {
          success: alwaysWin || winners.includes(index),
          redirectUrl: '/',
        };
      }}
    />
  );
}
