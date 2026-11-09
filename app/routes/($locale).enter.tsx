import {type LoaderFunctionArgs, json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {KeysGateExperience} from '~/components/protection/keys-gate-experience';
import {pickWinningKeys} from '~/lib/fw26-keys-gate/winning-keys';
// Server-only switch (used only in the loader, so it's stripped from the
// browser bundle). The redirect path comes from the client-safe config.
import {KEYS_GATE_ENABLED} from '~/lib/fw26-keys-gate/keys-gate.server';
import {KEYS_GATE_SUCCESS_REDIRECT} from '~/lib/fw26-keys-gate/keys-gate.config';

const NO_CACHE = {'Cache-Control': 'no-cache, no-store, must-revalidate'};

/**
 * Standalone FW26 keys gate. Self-contained: it does not read the Sanity
 * site-protection config. It just hands this visitor a fresh pair of winning
 * key indices (stored in their session) and validates a dragged key against
 * them — a win unlocks the whole site and sends them home.
 */
export async function loader({context}: LoaderFunctionArgs) {
  const {passwordSession} = context;

  // Gate off, or already unlocked → no reason to be here.
  if (!KEYS_GATE_ENABLED || passwordSession.isGloballyAuthenticated()) {
    throw redirect(KEYS_GATE_SUCCESS_REDIRECT);
  }

  let winners = passwordSession.getKeysWinners();
  let setCookie: string | undefined;
  if (!winners || winners.length === 0) {
    winners = pickWinningKeys();
    passwordSession.setKeysWinners(winners);
    setCookie = await passwordSession.commit();
  }

  return json(
    {winners},
    {headers: setCookie ? {...NO_CACHE, 'Set-Cookie': setCookie} : NO_CACHE},
  );
}

// Keys are validated at the /api/keys-attempt resource route (which returns JSON
// the game client can read). We hand that call to the game via the `attempt`
// prop so it never posts to this page route (which would return HTML).
async function attemptKey(index: number) {
  const fd = new FormData();
  fd.set('keyIndex', String(index));
  const res = await fetch('/api/keys-attempt', {method: 'POST', body: fd});
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    redirectUrl?: string;
  };
  return {success: !!data.success, redirectUrl: data.redirectUrl};
}

export default function EnterGate() {
  const {winners} = useLoaderData<typeof loader>();
  return (
    <KeysGateExperience
      redirectTo={KEYS_GATE_SUCCESS_REDIRECT}
      winningIndices={winners}
      attempt={attemptKey}
    />
  );
}
