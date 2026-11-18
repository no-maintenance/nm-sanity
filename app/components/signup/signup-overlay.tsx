import {useEffect, useState} from 'react';

import {BASE_IMAGE, DiscountSignup} from './discount-signup';
import {RED_TEXT_SRC} from './redtext-loop';
import {
  OPEN_SIGNUP_EVENT,
  SIGNUP_LAST_SHOWN_KEY,
  SIGNUP_SUBSCRIBED_KEY,
  type SignupLogoChoice,
} from './open-signup';


// Fetch + decode both pieces of card artwork once, so the card arrives whole
// instead of the art popping in piece by piece after the window appears.
let artReady: Promise<void> | null = null;
function preloadArt(): Promise<void> {
  if (artReady) return artReady;
  const load = (src: string) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const d = img.decode?.();
        if (d) d.then(() => resolve(), () => resolve());
        else resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  artReady = Promise.all([load(BASE_IMAGE), load(RED_TEXT_SRC)]).then(
    () => undefined,
  );
  return artReady;
}
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
  const [ready, setReady] = useState(false);

  // Warm the artwork as soon as the page is idle so a later open is instant.
  useEffect(() => {
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void) => number)
      | undefined;
    if (idle) idle(() => void preloadArt());
    else setTimeout(() => void preloadArt(), 300);
  }, []);

  // When opening, wait (briefly) for the artwork so the card shows up complete.
  // Capped so a slow connection can never hold the popup hostage.
  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    let cancelled = false;
    const cap = new Promise<void>((r) => setTimeout(r, 1200));
    Promise.race([preloadArt(), cap]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);
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
    // Lock background scroll while the overlay is up. Removing the scrollbar
    // would shift the page sideways, so pad the body by exactly its width.
    const body = document.body;
    const prev = {overflow: body.style.overflow, pad: body.style.paddingRight};
    const scrollbar =
      window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      window.removeEventListener('keydown', onKey);
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.pad;
    };
  }, [open]);

  if (!open || !ready) return null;
  return <DiscountSignup onClose={() => setOpen(false)} />;
}
