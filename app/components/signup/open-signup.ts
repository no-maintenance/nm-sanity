// Small event bus so anything (e.g. the announcement banner) can open the
// full-bleed signup overlay without prop-drilling through the layout tree.
export const OPEN_SIGNUP_EVENT = 'nm:open-signup';

// Which animated logo the overlay should show when it opens.
export type SignupLogoChoice = 'glitch' | 'logo3d';

export function openSignup(logo?: SignupLogoChoice) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_SIGNUP_EVENT, {detail: {logo}}));
}
