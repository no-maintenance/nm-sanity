import {useEffect, useState} from 'react';

import {DiscountSignup} from './discount-signup';
import {
  OPEN_SIGNUP_EVENT,
  SIGNUP_LAST_SHOWN_KEY,
  SIGNUP_SUBSCRIBED_KEY,
  type SignupLogoChoice,
} from './open-signup';

// Automatic first-visit popup. Same rules as the Klaviyo "Popup Newsletter"
// form it replaces: 1s after the page loads, any page, desktop and mobile,
// not again for 1 day — and never again once the visitor has subscribed.
const AUTO_OPEN_DELAY_MS = 1000;
const AUTO_OPEN_REPEAT_AFTER_MS = 24 * 60 * 60 * 1000;

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function shouldAutoOpen(): boolean {
  if (readStorage(SIGNUP_SUBSCRIBED_KEY)) return false;
  const last = Number(readStorage(SIGNUP_LAST_SHOWN_KEY)) || 0;
  return Date.now() - last >= AUTO_OPEN_REPEAT_AFTER_MS;
}

// Map a `?signup=` URL value to a logo choice. Any recognized value opens the
// overlay; unknown-but-present values still open it with the default logo.
function logoFromParam(value: string | null): SignupLogoChoice | null {
  if (value == null) return null;
  const v = value.toLowerCase();
  if (['parallax', '3d', 'logo3d', 'three'].includes(v)) return 'logo3d';
  return 'glitch';
}

/**
 * Mounts once in the app layout (every normal page). Opens the branded signup as
 * a full-bleed overlay on top of the current page when:
 *   - the announcement banner (or anything) calls openSignup(), or
 *   - the page loads with a `?signup=` param (a shareable link, e.g.
 *     `/?signup=3d`) — lets you drop someone straight onto the home page with
 *     the signup already up.
 *   - `autoOpen` is set (the normal site layout) and this visitor hasn't seen
 *     it in the last day — the automatic first-visit popup.
 * Closes via ✕, Escape, or backdrop.
 */
export function SignupOverlay({autoOpen = false}: {autoOpen?: boolean}) {
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<SignupLogoChoice>('logo3d');

  // Shareable-link open: read `?signup=` once on mount, then strip it so a
  // refresh or close behaves like a normal page (no sticky overlay).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const choice = logoFromParam(params.get('signup'));
    if (!choice) return;
    setLogo(choice);
    setOpen(true);
    params.delete('signup');
    const qs = params.toString();
    const url =
      window.location.pathname +
      (qs ? `?${qs}` : '') +
      window.location.hash;
    window.history.replaceState(window.history.state, '', url);
  }, []);

  // Automatic popup for new visitors (replaces the Klaviyo onsite popup).
  useEffect(() => {
    if (!autoOpen) return;
    // A shareable `?signup=` link already opened it above.
    if (new URLSearchParams(window.location.search).has('signup')) return;
    if (!shouldAutoOpen()) return;
    const t = window.setTimeout(() => {
      setLogo('glitch');
      setOpen(true);
      try {
        window.localStorage.setItem(SIGNUP_LAST_SHOWN_KEY, String(Date.now()));
      } catch {
        // Storage blocked — it may show again next page, same as no cookie.
      }
    }, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [autoOpen]);

  // Programmatic open (banner, etc.), optionally carrying a logo choice.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | {logo?: SignupLogoChoice}
        | undefined;
      if (detail?.logo) setLogo(detail.logo);
      setOpen(true);
    };
    window.addEventListener(OPEN_SIGNUP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SIGNUP_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    // Lock background scroll while the overlay is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return <DiscountSignup onClose={() => setOpen(false)} />;
}
