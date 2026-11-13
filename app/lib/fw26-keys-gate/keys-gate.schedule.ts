/**
 * FW26 keys gate — THE SWITCH + the scheduled shut-off.
 *
 * Pure module on purpose (no imports) so the decision can be unit-checked with
 * fake clocks. The gate is up only while BOTH are true:
 *   1. KEYS_GATE_ENABLED is on (master switch — flip + deploy for an instant change), and
 *   2. the current time is before KEYS_GATE_ENDS_AT (the automatic take-down moment).
 *
 * Flipping the master switch ships a deploy, which purges Oxygen's edge cache, so
 * manual on/off is cache-clean. The scheduled shut-off needs no deploy: every
 * server starts letting visitors straight in at that exact moment.
 */
export const KEYS_GATE_ENABLED = false;

/** Fri Nov 13 2026, 11:00 AM Pacific (PST, UTC-8) → 19:00 UTC. */
export const KEYS_GATE_ENDS_AT = Date.parse('2026-11-13T19:00:00Z');

export function isKeysGateEnabled(now: number = Date.now()): boolean {
  return KEYS_GATE_ENABLED && now < KEYS_GATE_ENDS_AT;
}
