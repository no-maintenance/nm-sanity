import {useEffect, useRef, useState} from 'react';
import type {KeyAttemptResult} from '~/lib/fw26-keys-gate/fw26-keys-init.client';
import {KEYS_TOTAL, pickWinningKeys} from '~/lib/fw26-keys-gate/winning-keys';
import {ClientOnly} from '~/components/client-only';
import {SignupOverlay} from '~/components/signup/signup-overlay';
import {openSignup} from '~/components/signup/open-signup';

interface KeysGateExperienceProps {
  /** Where the server sends the visitor after the lock opens. */
  redirectTo: string;
  /** Action response from the site-protected route (password-fallback errors). */
  actionData?: {error?: string; errorKey?: string | number} | null;
  /** Total number of keys in the swarm (winners + decoys). */
  keyCount?: number;
  /** Indices of this visitor's real, unlocking keys (per-session from server). */
  winningIndices?: number[];
  /**
   * Preview/testing override. When provided it replaces the server round-trip;
   * used by the standalone preview route so the experience runs with no CMS.
   */
  attempt?: (index: number) => Promise<{success: boolean; redirectUrl?: string}>;
}

const GATE_CSS = `
.fw26-gate {
  position: fixed; inset: 0; z-index: 50; color: #241d12;
  overflow: hidden; -webkit-font-smoothing: antialiased;
  background:
    radial-gradient(130% 120% at 50% 42%, #efe8d8 0%, #e4dbc6 55%, #d4c8ac 100%);
  font-family: ui-monospace, Menlo, Monaco, Consolas, "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace;
}
.fw26-gate * { box-sizing: border-box; }
.fw26-gate .fw26-canvas { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 1; touch-action: none; display: block; }
.fw26-gate .fw26-grain {
  position: fixed; inset: 0; z-index: 2; pointer-events: none;
  opacity: 0.08; mix-blend-mode: multiply;
}
.fw26-gate .fw26-vignette {
  position: fixed; inset: 0; z-index: 2; pointer-events: none;
  background: radial-gradient(120% 120% at 50% 45%, rgba(0,0,0,0) 58%, rgba(74,58,30,0.26) 100%);
}
.fw26-gate .fw26-ui { position: fixed; inset: 0; z-index: 3; pointer-events: none; }
.fw26-gate .fw26-title {
  position: absolute; top: 8%; left: 50%; transform: translateX(-50%);
  width: max-content; max-width: 92vw; text-align: center; margin: 0;
  font-size: clamp(15px, 3vw, 30px); letter-spacing: 0.34em; text-transform: uppercase;
  font-weight: 600; color: #211a0f; text-shadow: 0 1px 0 rgba(255,250,236,0.6);
}
.fw26-gate .fw26-sub {
  position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%);
  width: max-content; max-width: 90vw; text-align: center; margin: 0;
  font-size: clamp(9px, 1.3vw, 12px); letter-spacing: 0.28em; text-transform: uppercase;
  color: rgba(50,40,22,0.78); transition: color 0.3s, opacity 0.3s; min-height: 14px;
  text-shadow: 0 1px 0 rgba(255,250,236,0.5);
}
.fw26-gate .fw26-sub.is-wrong { color: #8a3321; }
.fw26-gate .fw26-sub.is-correct { color: #7a5a1c; }
.fw26-gate .fw26-fallback {
  position: absolute; bottom: 5%; left: 50%; transform: translateX(-50%);
  pointer-events: auto; text-align: center;
}
.fw26-gate .fw26-fallback-toggle {
  background: none; border: none; cursor: pointer; color: rgba(50,40,22,0.6);
  font-family: inherit; font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
}
.fw26-gate .fw26-fallback-toggle:hover { color: rgba(50,40,22,0.95); text-decoration: underline; }
.fw26-gate .fw26-pw { display: flex; gap: 8px; margin-top: 12px; justify-content: center; }
.fw26-gate .fw26-pw-input {
  pointer-events: auto; width: min(240px, 60vw); background: rgba(255,251,240,0.7);
  border: 1px solid rgba(60,48,26,0.55); color: #241d12; font: inherit; font-size: 14px;
  letter-spacing: 0.2em; text-align: center; padding: 10px 12px; outline: none;
}
.fw26-gate .fw26-pw-input::placeholder { color: rgba(60,48,26,0.5); }
.fw26-gate .fw26-pw-submit {
  pointer-events: auto; background: #2d2512; color: #efe8d8; border: 1px solid #2d2512;
  font: inherit; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase;
  padding: 10px 16px; cursor: pointer;
}
.fw26-gate .fw26-pw-submit:hover { opacity: 0.85; }
.fw26-gate .fw26-fade {
  position: fixed; inset: 0; z-index: 9; background: #e7ded0; opacity: 0;
  pointer-events: none; transition: opacity 0.6s ease;
}
.fw26-gate .fw26-fade.show { opacity: 1; }
@media (max-width: 720px) {
  .fw26-gate .fw26-title { letter-spacing: 0.22em; top: 7%; }
}
`;

// "How to play" reveal — a short poem that hints the winning key is a knowing,
// marked thing hidden in the swarm. Lines fade in one after another.
const POEM = [
  'A thousand keys adrift and cold,',
  'most are iron, brass, and old.',
  'Pay no mind to tooth or ring,',
  'the key that frees you is a knowing thing.',
  'It bears the mark we call our rune,',
  'retrieve the correct key and —',
  '\u00A0', // blank line — a dramatic pause before the closing line
  'we will be home again soon.',
];

const HTP_CSS = `
.fw26-htp { position: fixed; top: 54px; left: 20px; z-index: 30; pointer-events: none; }
.fw26-htp-btn {
  pointer-events: auto; background: rgba(43,37,18,0.92); color: #efe8d8;
  border: 1px solid rgba(201,178,120,0.55); font-family: ui-monospace, Menlo, Monaco, monospace;
  font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; padding: 10px 15px;
  cursor: pointer; transition: opacity .2s; box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}
.fw26-htp-btn:hover { opacity: 0.84; }
.fw26-htp-panel {
  position: relative; pointer-events: none; margin-top: 10px; width: min(380px, 84vw);
  display: flex; flex-direction: column;
  background: linear-gradient(158deg, #2c2213 0%, #15100a 100%);
  border: 1px solid rgba(201,178,120,0.5); box-shadow: 0 22px 60px rgba(0,0,0,0.5);
  color: #e9e2d1; padding: 0 24px; overflow: hidden; max-height: 0; opacity: 0;
  transform-origin: top left; transform: translateY(-8px) scale(0.95);
  transition: opacity .35s ease, transform .4s cubic-bezier(.2,.8,.2,1),
    max-height .55s ease, padding .4s ease;
  font-family: ui-monospace, Menlo, Monaco, monospace;
}
.fw26-htp-panel.is-open {
  pointer-events: auto; max-height: 680px; opacity: 1; padding: 30px 24px;
  transform: translateY(0) scale(1);
}
.fw26-htp-head { position: absolute; top: 10px; right: 14px; margin: 0; z-index: 2; }
.fw26-htp-close { background: none; border: none; color: #e9e2d1; font-size: 20px; line-height: 1; cursor: pointer; opacity: 0.65; }
.fw26-htp-close:hover { opacity: 1; }
.fw26-htp-line {
  margin: 0; font-size: 13px; line-height: 1.95; letter-spacing: 0.03em;
  text-shadow: 0 1px 10px rgba(0,0,0,0.5);
}
/* "home" gets the hand-drawn ring looped around it, like the annotation: a big
   loop that balloons up/down while hugging the word's sides. The ring keeps the
   PNG's own proportions (aspect-ratio + contain = never stretched). */
.fw26-htp-home { position: relative; display: inline-block; white-space: nowrap; }
.fw26-htp-home::before {
  content: ''; position: absolute; left: 50%; top: 50%;
  width: 150%; aspect-ratio: 190 / 206; transform: translate(-50%, calc(-55% + 3px));
  background: url(/fw26-keys/home-ring.png) center / contain no-repeat;
  opacity: 0.92; pointer-events: none;
}
`;

// Slim subscription bar pinned to the top of the gate (desktop + mobile).
const BANNER_CSS = `
.fw26-subbar {
  position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 38;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  height: 38px; padding: 0 16px; box-sizing: border-box; cursor: pointer;
  background: #2d2512; color: #efe8d8; text-decoration: none; pointer-events: auto;
  font-family: ui-monospace, Menlo, Monaco, monospace; font-size: 11px;
  letter-spacing: 0.26em; text-transform: uppercase;
  border: none; border-bottom: 1px solid rgba(201,178,120,0.45); transition: background .2s;
}
.fw26-subbar:hover { background: #3a2f18; }
.fw26-subbar .fw26-subbar-arrow { font-size: 13px; letter-spacing: 0; }
@media (max-width: 720px) {
  .fw26-subbar { height: 34px; font-size: 9px; letter-spacing: 0.08em; gap: 6px; padding: 0 10px; }
  .fw26-subbar .fw26-subbar-arrow { font-size: 11px; }
}
`;

// On a correct key, the scene fades to black before the real site loads.
const TRANSITION_CSS = `
.fw26-into {
  position: fixed; inset: 0; z-index: 40; pointer-events: none; background: #000;
  opacity: 0; transition: opacity 0.9s ease-in;
}
.fw26-into.show { opacity: 1; }
`;

export function KeysGateExperience({
  redirectTo,
  keyCount,
  winningIndices,
  attempt,
}: KeysGateExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redirectRef = useRef(redirectTo);
  const [zooming, setZooming] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  // Boot the imperative canvas swarm.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cleanup = () => {};
    let cancelled = false;
    document.body.style.overflow = 'hidden';

    // Desktop: ~1000 keys. Mobile: 1000 total.
    const isSmall = window.innerWidth < 760;
    const defaultCount = isSmall ? 1000 : KEYS_TOTAL;

    // This visitor's winning keys. The server picks a fresh random pair per
    // person and passes it in; the preview passes its own. Fall back to a
    // locally-chosen pair so the gate always has real keys to find.
    const winners =
      winningIndices && winningIndices.length
        ? winningIndices
        : pickWinningKeys();

    const serverAttempt = async (index: number) => {
      const fd = new FormData();
      fd.set('actionType', 'key-attempt');
      fd.set('keyIndex', String(index));
      fd.set('redirectTo', redirectTo);
      const res = await fetch(window.location.pathname + window.location.search, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        redirectUrl?: string;
      };
      return {success: !!data.success, redirectUrl: data.redirectUrl};
    };

    const doAttempt = attempt ?? serverAttempt;

    import('~/lib/fw26-keys-gate/fw26-keys-init.client')
      .then(({initKeysGate}) => {
        if (cancelled || !canvasRef.current) return;
        cleanup = initKeysGate(canvasRef.current, {
          count: keyCount ?? defaultCount,
          winningIndices: winners,
          // Keep the swarm below the fixed subscription bar (38px + border).
          topInset: 40,
          onAttempt: async (index): Promise<KeyAttemptResult> => {
            const result = await doAttempt(index);
            if (result.success) {
              redirectRef.current = result.redirectUrl || redirectTo;
              return 'correct';
            }
            return 'wrong';
          },
          onUnlock: () => {
            // Let the key + lock finish turning oxblood, fade out, hand off.
            setZooming(true);
            window.setTimeout(() => {
              window.location.assign(redirectRef.current);
            }, 1050);
          },
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cleanup();
      document.body.style.overflow = '';
    };
  }, [attempt, keyCount, redirectTo, winningIndices]);

  // Close the How-to-play panel on Escape.
  useEffect(() => {
    if (!howToOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHowToOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [howToOpen]);

  return (
    <div className="fw26-gate" ref={rootRef}>
      <style dangerouslySetInnerHTML={{__html: GATE_CSS}} />
      <style dangerouslySetInnerHTML={{__html: BANNER_CSS}} />
      <style dangerouslySetInnerHTML={{__html: HTP_CSS}} />
      <style dangerouslySetInnerHTML={{__html: TRANSITION_CSS}} />

      {/* Subscription bar — opens the site's signup overlay in place (so the
          visitor never leaves the gate / bypasses the game). */}
      <button
        type="button"
        className="fw26-subbar"
        onClick={() => openSignup()}
      >
        <span>Subscribe for 10% off your first purchase</span>
        <span className="fw26-subbar-arrow" aria-hidden="true">
          →
        </span>
      </button>

      {/* The branded signup overlay, mounted here so the bar can open it on
          the gate (normally it lives in the site layout). */}
      <ClientOnly fallback={null}>{() => <SignupOverlay />}</ClientOnly>

      {/* How to play — expands into a short poem that hints how to find the
          winning key in the swarm. */}
      <div className="fw26-htp">
        <button
          type="button"
          className="fw26-htp-btn"
          aria-expanded={howToOpen}
          onClick={() => setHowToOpen((v) => !v)}
        >
          How to Play
        </button>
        <div
          className={`fw26-htp-panel${howToOpen ? ' is-open' : ''}`}
          role="dialog"
          aria-label="How to play"
          aria-hidden={!howToOpen}
        >
          <div className="fw26-htp-head">
            <button
              type="button"
              className="fw26-htp-close"
              aria-label="Close"
              onClick={() => setHowToOpen(false)}
            >
              ×
            </button>
          </div>
          {POEM.map((line) => {
            // The closing line gets the nomaintenance ring drawn around "home".
            const parts = line.split('home');
            return (
              <p key={line} className="fw26-htp-line">
                {parts.length === 2 ? (
                  <>
                    {parts[0]}
                    <span className="fw26-htp-home">home</span>
                    {parts[1]}
                  </>
                ) : (
                  line
                )}
              </p>
            );
          })}
        </div>
      </div>


      <canvas
        ref={canvasRef}
        className="fw26-canvas"
        aria-hidden="true"
      />
      {/* Paper grain to sell the aged-archive feel. */}
      <svg className="fw26-grain" aria-hidden="true">
        <filter id="fw26-paper-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#fw26-paper-noise)" />
      </svg>
      <div className="fw26-vignette" />

      {/* No password entry — the only way in is finding a winning key. */}

      <div className={`fw26-into${zooming ? ' show' : ''}`} />
    </div>
  );
}
