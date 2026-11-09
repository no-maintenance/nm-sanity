/**
 * Client-safe constants for the standalone FW26 keys gate.
 *
 * Kept OUT of `keys-gate.server.ts` on purpose: Remix forbids importing a
 * `.server` module into code that ships to the browser, and the gate page
 * component needs the success redirect. Nothing here is secret.
 */

/** Where the standalone gate lives. */
export const KEYS_GATE_PATH = '/enter';

/** Where winners land once they beat the game. */
export const KEYS_GATE_SUCCESS_REDIRECT = '/';
