import {Form} from '@remix-run/react';
import {useEffect, useRef, useState} from 'react';
import {KLAVIYO_BASE_URL, KLAVIYO_COMPANY_ID} from '~/sanity/constants';

interface SaleGateExperienceProps {
  /** Where the server action sends the visitor after a correct password. */
  redirectTo: string;
  /** Action response from the site-protected route (carries password errors). */
  actionData?: {error?: string; errorKey?: string | number} | null;
}

// Early-access signups land on the same Klaviyo newsletter list the app uses.
const EARLY_ACCESS_LIST_ID = 'Wimtnj';

const GATE_CSS = `
.ss26-gate {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #000;
  color: #fff;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
.ss26-gate * { box-sizing: border-box; }
.ss26-gate .ss26-glitch {
  position: fixed; inset: 0; width: 100%; height: 100%;
  z-index: 0; display: block; pointer-events: none;
}
.ss26-gate .ss26-scene {
  position: fixed; inset: 0; width: 100%; height: 100%;
  z-index: 2; touch-action: none; pointer-events: none;
}
.ss26-gate .ss26-terminal {
  position: fixed; inset: 0; z-index: 1; overflow: hidden; pointer-events: none;
}
.ss26-gate .ss26-code {
  width: fit-content; max-width: 96vw; margin: 0 auto;
  padding: clamp(20px, 4vw, 64px);
  font-family: ui-monospace, Menlo, Monaco, Consolas, "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace;
  font-size: clamp(8px, 1.25vw, 13px);
  line-height: 1.7; white-space: pre; text-transform: lowercase;
  color: rgba(255,255,255,0.44);
  text-shadow: 0 1px 14px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9);
  filter: url(#ss26-grainy); will-change: transform;
}
@media (max-width: 720px) {
  .ss26-gate .ss26-code { white-space: pre-wrap; word-break: break-word; width: auto; max-width: 100%; filter: none; }
}
.ss26-gate .ss26-code::after {
  content: "\\2588"; margin-left: 1px; animation: ss26-caret 1s steps(1) infinite;
}
@keyframes ss26-caret { 50% { opacity: 0; } }
.ss26-gate .ss26-ui {
  position: fixed; inset: 0; z-index: 3; pointer-events: none;
  font-family: ui-monospace, Menlo, Monaco, Consolas, "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace;
}
.ss26-gate .ss26-pw { position: absolute; top: 26%; left: 50%; transform: translateX(-50%); text-align: center; margin: 0; }
.ss26-gate .ss26-pw-field { position: relative; display: inline-block; width: min(360px, 72vw); }
.ss26-gate .ss26-pw-input {
  pointer-events: auto; width: 100%; background: rgba(0,0,0,0.78);
  border: 1px solid rgba(255,255,255,0.55); color: #fff; font: inherit;
  font-size: 16px; letter-spacing: 0.28em; text-align: center;
  padding: 12px 42px 12px 18px; outline: none;
}
.ss26-gate .ss26-pw-input::placeholder { color: rgba(255,255,255,0.8); letter-spacing: 0.28em; }
.ss26-gate .ss26-pw-input.shake { animation: ss26-shake 0.4s ease-in-out; }
@keyframes ss26-shake {
  0%,100% { transform: translateX(0); }
  20%,60% { transform: translateX(-6px); }
  40%,80% { transform: translateX(6px); }
}
.ss26-gate .ss26-pw-arrow {
  position: absolute; top: 50%; right: 4px; transform: translateY(-50%);
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: #fff; font-size: 20px; line-height: 1;
  cursor: pointer; opacity: 0; pointer-events: none; transition: opacity 0.18s ease;
}
.ss26-gate .ss26-pw-arrow.show { opacity: 0.9; pointer-events: auto; }
.ss26-gate .ss26-pw-arrow.show:hover { opacity: 1; transform: translateY(-50%) translateX(2px); }
.ss26-gate .ss26-pw-msg {
  margin-top: 12px; min-height: 12px; font-size: 10px; letter-spacing: 0.26em;
  text-transform: uppercase; color: rgba(255,255,255,0.85);
}
.ss26-gate .ss26-signup {
  position: absolute; bottom: 6%; left: 50%; transform: translateX(-50%);
  pointer-events: auto; background: none; border: none; cursor: pointer;
  color: #fff; font-family: inherit; font-size: 11px; letter-spacing: 0.3em;
  text-transform: uppercase; opacity: 0.85; white-space: nowrap;
  text-shadow: 0 1px 12px rgba(0,0,0,0.9);
}
.ss26-gate .ss26-signup:hover { opacity: 1; text-decoration: underline; }
.ss26-gate .ss26-modal {
  position: fixed; inset: 0; z-index: 10; display: none;
  align-items: center; justify-content: center;
  font-family: ui-monospace, Menlo, Monaco, Consolas, "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace;
}
.ss26-gate .ss26-modal.show { display: flex; }
.ss26-gate .ss26-modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.78); backdrop-filter: blur(2px); }
.ss26-gate .ss26-modal-box {
  position: relative; width: min(460px, 88vw); background: #000;
  border: 1px solid rgba(255,255,255,0.6); padding: clamp(28px, 5vw, 44px);
  text-align: center; color: #fff;
}
.ss26-gate .ss26-modal-close {
  position: absolute; top: 10px; right: 14px; background: none; border: none;
  color: #fff; font-size: 22px; line-height: 1; cursor: pointer; opacity: 0.7;
}
.ss26-gate .ss26-modal-close:hover { opacity: 1; }
.ss26-gate .ss26-modal-title {
  margin: 0 0 22px; font-size: clamp(14px, 2.4vw, 18px); font-weight: 500;
  letter-spacing: 0.26em; text-transform: uppercase;
}
.ss26-gate .ss26-modal-input {
  width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.5);
  color: #fff; font: inherit; font-size: 16px; letter-spacing: 0.12em; text-align: center;
  padding: 13px 14px; outline: none;
}
.ss26-gate .ss26-modal-input::placeholder { color: rgba(255,255,255,0.55); }
.ss26-gate .ss26-modal-submit {
  width: 100%; margin-top: 12px; background: #fff; color: #000; border: 1px solid #fff;
  font: inherit; font-size: 13px; letter-spacing: 0.26em; text-transform: uppercase;
  padding: 14px; cursor: pointer; transition: opacity 0.2s;
}
.ss26-gate .ss26-modal-submit:hover { opacity: 0.85; }
.ss26-gate .ss26-modal-submit:disabled { opacity: 0.5; cursor: default; }
.ss26-gate .ss26-modal-msg {
  margin-top: 14px; min-height: 12px; font-size: 10px; letter-spacing: 0.2em;
  text-transform: uppercase; color: rgba(255,255,255,0.8);
}
@media (prefers-reduced-motion: reduce) {
  .ss26-gate .ss26-code::after { animation: none; }
}
`;

export function SaleGateExperience({redirectTo, actionData}: SaleGateExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pwValue, setPwValue] = useState('');
  const [shake, setShake] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subState, setSubState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [subMsg, setSubMsg] = useState('');

  const error = actionData?.error;
  const errorKey = actionData?.errorKey;

  // Boot the imperative background (glitch + typed terminal + 3D logo).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cleanup = () => {};
    let cancelled = false;
    document.body.style.overflow = 'hidden';

    import('~/lib/sale-gate/sale-gate-init.client')
      .then(({initSaleGate}) => {
        if (cancelled || !rootRef.current) return;
        cleanup = initSaleGate(rootRef.current);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cleanup();
      document.body.style.overflow = '';
    };
  }, []);

  // Replay the shake whenever the server reports a wrong password.
  useEffect(() => {
    if (!error) return;
    setShake(false);
    const id = requestAnimationFrame(() => setShake(true));
    return () => cancelAnimationFrame(id);
  }, [error, errorKey]);

  // Close the modal on Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  async function onSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setSubState('loading');
    setSubMsg('Subscribing…');
    try {
      const res = await fetch(
        `${KLAVIYO_BASE_URL}/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`,
        {
          method: 'POST',
          headers: {revision: '2025-01-15', 'content-type': 'application/json'},
          body: JSON.stringify({
            data: {
              type: 'subscription',
              attributes: {
                profile: {
                  data: {
                    type: 'profile',
                    attributes: {
                      subscriptions: {email: {marketing: {consent: 'SUBSCRIBED'}}},
                      email: value,
                    },
                  },
                },
                custom_source: 'SS26 Early Access Gate',
              },
              relationships: {list: {data: {type: 'list', id: EARLY_ACCESS_LIST_ID}}},
            },
          }),
        },
      );
      if (res.ok) {
        setSubState('ok');
        setSubMsg("You're on the list.");
        setEmail('');
        setTimeout(() => setModalOpen(false), 1600);
      } else {
        setSubState('error');
        setSubMsg('Something went wrong. Try again.');
      }
    } catch {
      setSubState('error');
      setSubMsg('Network error. Try again.');
    }
  }

  return (
    <div className="ss26-gate" ref={rootRef}>
      <style dangerouslySetInnerHTML={{__html: GATE_CSS}} />

      {/* Grain/spray filter for the typed code */}
      <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true">
        <filter id="ss26-grainy" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <canvas className="ss26-glitch" />
      <div className="ss26-scene" />

      <div className="ss26-terminal">
        <pre className="ss26-code" />
      </div>

      <div className="ss26-ui">
        <Form method="post" className="ss26-pw" autoComplete="off">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="ss26-pw-field">
            <input
              name="password"
              className={`ss26-pw-input${shake ? ' shake' : ''}`}
              type="text"
              placeholder="ENTER PASSWORD"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Enter password"
              value={pwValue}
              onChange={(e) => setPwValue(e.target.value)}
              onAnimationEnd={() => setShake(false)}
            />
            <button
              type="submit"
              className={`ss26-pw-arrow${pwValue.length >= 10 ? ' show' : ''}`}
              aria-label="Enter site"
              tabIndex={-1}
            >
              &rarr;
            </button>
          </div>
          <div className="ss26-pw-msg" role="status" aria-live="polite">
            {error ? 'Incorrect Password' : ''}
          </div>
        </Form>

        <button type="button" className="ss26-signup" onClick={() => setModalOpen(true)}>
          Sign Up For Early Access
        </button>
      </div>

      {/* Early-access subscribe modal */}
      <div className={`ss26-modal${modalOpen ? ' show' : ''}`} aria-hidden={!modalOpen}>
        <div className="ss26-modal-backdrop" onClick={() => setModalOpen(false)} />
        <div className="ss26-modal-box" role="dialog" aria-modal="true" aria-label="Subscribe for early access">
          <button className="ss26-modal-close" type="button" aria-label="Close" onClick={() => setModalOpen(false)}>
            &times;
          </button>
          <h2 className="ss26-modal-title">Subscribe For Early Access</h2>
          <form onSubmit={onSubscribe} autoComplete="off">
            <input
              className="ss26-modal-input"
              type="email"
              placeholder="Email Address"
              required
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="ss26-modal-submit" type="submit" disabled={subState === 'loading'}>
              Subscribe
            </button>
            <div className="ss26-modal-msg" role="status" aria-live="polite">
              {subMsg}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
