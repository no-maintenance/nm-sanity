/**
 * "Winning key" selection for the FW26 keys gate.
 *
 * The gate renders a swarm of ~850 keys. For each visitor, a couple of them
 * are their own personal "real" keys — a fresh random pair per person, stored
 * in that visitor's password-session cookie (server-side) and sent to the
 * client only as index numbers so it can draw those keys as the distinct hero
 * key. The gate password still gates the whole experience (no password
 * configured → nothing opens).
 *
 * Winner indices are drawn from [0, KEYS_WINNER_POOL), which is smaller than
 * the smallest rendered key count, so a winner always maps to a real key on
 * every device. Pure + isomorphic so it runs in the Oxygen worker.
 */

// How many "real" keys each visitor gets.
export const KEYS_WINNER_COUNT = 2;
// Total keys the gate renders by default (desktop); mobile renders fewer.
export const KEYS_TOTAL = 852;
// Winner indices come from [0, pool). Must be < the smallest render count.
export const KEYS_WINNER_POOL = 600;

/** Pick `count` distinct random winning indices from [0, pool). */
export function pickWinningKeys(
  count: number = KEYS_WINNER_COUNT,
  pool: number = KEYS_WINNER_POOL,
): number[] {
  const n = Math.max(0, Math.min(Math.floor(count), Math.floor(pool)));
  const chosen = new Set<number>();
  while (chosen.size < n) chosen.add(Math.floor(Math.random() * pool));
  return Array.from(chosen);
}
