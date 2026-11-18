// Small event bus so anything (e.g. the announcement banner) can open the
// full-bleed signup overlay without prop-drilling through the layout tree.
export const OPEN_SIGNUP_EVENT = 'nm:open-signup';

// Which animated logo the overlay should show when it opens.
export type SignupLogoChoice = 'glitch' | 'logo3d';

export function openSignup(logo?: SignupLogoChoice) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_SIGNUP_EVENT, {detail: {logo}}));
}

// Where the auto-open popup records itself, so a visitor isn't shown it again
// right away (mirrors the Klaviyo popup's "don't show again for 1 day") and
// never again once they've subscribed.
export const SIGNUP_LAST_SHOWN_KEY = 'nm:signup-popup:last-shown';
export const SIGNUP_SUBSCRIBED_KEY = 'nm:signup-popup:subscribed';

export function markSignupSubscribed() {
  try {
    window.localStorage.setItem(SIGNUP_SUBSCRIBED_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode / disabled) — nothing to persist.
  }
}
