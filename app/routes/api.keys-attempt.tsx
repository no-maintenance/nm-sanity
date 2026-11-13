import {type ActionFunctionArgs, json} from '@shopify/remix-oxygen';
import {isKeysGateEnabled} from '~/lib/fw26-keys-gate/keys-gate.server';
import {KEYS_GATE_SUCCESS_REDIRECT} from '~/lib/fw26-keys-gate/keys-gate.config';

const NO_CACHE = {'Cache-Control': 'no-cache, no-store, must-revalidate'};

/** The game only POSTs here; a stray GET gets a clean 405 instead of an error. */
export async function loader() {
  return json({success: false}, {status: 405, headers: NO_CACHE});
}

/**
 * Validates a dragged key for the standalone FW26 keys gate.
 *
 * This is a RESOURCE route (no component) on purpose: a POST returns the action's
 * JSON directly, which the game's client reads. Posting the attempt to a normal
 * page route instead returns re-rendered HTML, which the client can't parse — so
 * the key must be validated here. Lives under /api so the gate exempts it.
 */
export async function action({context, request}: ActionFunctionArgs) {
  const {passwordSession} = context;

  if (!isKeysGateEnabled() || request.method !== 'POST') {
    return json({success: false}, {headers: NO_CACHE});
  }

  const form = await request.formData();
  const keyIndex = Number(form.get('keyIndex'));
  const winners = passwordSession.getKeysWinners();
  const isWinner =
    Number.isInteger(keyIndex) &&
    Array.isArray(winners) &&
    winners.includes(keyIndex);

  if (!isWinner) {
    return json({success: false}, {headers: NO_CACHE});
  }

  // A winning key unlocks the whole site, just like a correct password.
  passwordSession.authenticateGlobally();
  passwordSession.clearPendingRedirect();
  return json(
    {success: true, redirectUrl: KEYS_GATE_SUCCESS_REDIRECT},
    {headers: {...NO_CACHE, 'Set-Cookie': await passwordSession.commit()}},
  );
}
