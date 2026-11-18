import {useState} from 'react';

import {KLAVIYO_BASE_URL, KLAVIYO_COMPANY_ID} from '~/sanity/constants';

import {markSignupSubscribed} from './open-signup';
import {RedTextLoop} from './redtext-loop';

const SIGNUP_LIST_ID = 'Wimtnj';
const BASE_IMAGE = '/signup/signup-base.png';
// All three layers share this canvas (1500x1950) — width / height.
const IMAGE_ASPECT = 1500 / 1950;
// Warm-gray window background, sampled from the design.
const BG = '#dfdcd7';

// Normalize a typed phone number to E.164 (Klaviyo requires it for SMS).
function toE164(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// Measured field cells (fraction of the canvas); each overlays its drawn cell.
const FIELDS = [
  {key: 'firstName', top: 0.3244, height: 0.0997, autoComplete: 'given-name', type: 'text', label: 'First name'},
  {key: 'lastName', top: 0.4241, height: 0.0996, autoComplete: 'family-name', type: 'text', label: 'Last name'},
  {key: 'email', top: 0.5237, height: 0.0998, autoComplete: 'email', type: 'email', label: 'Email address'},
  {key: 'phone', top: 0.6235, height: 0.0996, autoComplete: 'tel', type: 'tel', label: 'Phone number'},
] as const;

const BOX_LEFT = 0.233;
const BOX_WIDTH = 0.758 - 0.233;
// Keep the filled background clear of the box's drawn left/right borders so
// focusing a field never paints over (fades) the black border lines.
const SIDE_INSET = 0.016;

const CSS = `
.nm-ds-backdrop {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: flex-start; justify-content: center;
  background: rgba(0,0,0,0.55);
  padding: 2vw;
  /* Sit the window directly beneath the moving announcement bar. */
  padding-top: var(--announcement-bar-height, 36px);
  overflow-y: auto;
}
.nm-ds-card {
  position: relative;
  container-type: inline-size;
  width: min(94vw, calc(60vh * ${IMAGE_ASPECT}));
  aspect-ratio: ${IMAGE_ASPECT};
  background: ${BG};
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  overflow: hidden;
}
.nm-ds-layer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.nm-ds-base { object-fit: fill; display: block; }
.nm-ds-form { position: absolute; inset: 0; }
.nm-ds-input {
  position: absolute;
  background: transparent;
  border: 0;
  outline: none;
  color: #111;
  font-size: max(16px, 2.2cqw) !important;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-align: left;
  padding: 0 1em;
  font-family: inherit;
}
/* Empty + unfocused: transparent so the drawn label in the base shows through.
   On focus or once it has a value, fill with the window colour to cover the
   drawn label and show the typed value (like a normal field) — no overlap.
   The placeholder is always transparent, so clicking into a field makes the
   drawn label disappear entirely (the fill covers it) rather than greying it. */
.nm-ds-input::placeholder { color: transparent; }
.nm-ds-input:focus,
.nm-ds-input:not(:placeholder-shown) { background: ${BG}; }
.nm-ds-checkbox { position: absolute; background: transparent; border: 0; cursor: pointer; padding: 0; }
.nm-ds-check { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #111; font-size: 2.4cqw; line-height: 1; }
.nm-ds-submit {
  position: absolute; background: transparent; border: 0; cursor: pointer; padding: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-family: inherit; text-transform: uppercase;
  font-size: 2.4cqw; letter-spacing: 0.14em; line-height: 1;
  /* letter-spacing adds trailing space after the last glyph; nudge right by
     half of it so the word sits optically centred in the bar. */
  text-indent: 0.14em;
}
.nm-ds-consent {
  position: absolute; left: 27%; width: 48.6%; top: 77.4%;
  transform: translateY(-50%);
  text-align: left; color: #111; font-family: inherit;
  /* Scales with the card (~7px on a laptop) so the copy always wraps to exactly
     three lines; a fixed px went to four on phones. Width 48.6% ends flush with
     the painted form box's right edge (75.7% of the card) so no line passes it. */
  text-transform: uppercase; font-size: 1.72cqw; line-height: 1.2;
  letter-spacing: 0.005em; cursor: pointer; background: transparent;
  border: 0; padding: 0 0 0 3px; display: block;
}
.nm-ds-close {
  position: absolute; top: 2%; right: 2.5%; z-index: 3;
  background: transparent; border: 0; cursor: pointer;
  font-size: 4cqw; line-height: 1; color: #111;
  width: 7cqw; height: 7cqw; display: flex; align-items: center; justify-content: center;
}
.nm-ds-status { position: absolute; left: 23.3%; right: 23.3%; top: 90.5%; text-align: center; font-size: 2.6cqw; text-transform: uppercase; letter-spacing: 0.03em; }
.nm-ds-status--error { color: #c0392b; }
.nm-ds-done {
  position: absolute; inset: 0; z-index: 4; background: ${BG};
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 10%; gap: 1.5cqw;
}
.nm-ds-done h2 { font-size: 6cqw; text-transform: uppercase; letter-spacing: 0.04em; margin: 0; }
.nm-ds-done p { font-size: 3cqw; text-transform: uppercase; letter-spacing: 0.03em; margin: 0; color: #444; }
`;

export function DiscountSignup({onClose}: {onClose: () => void}) {
  const [values, setValues] = useState({firstName: '', lastName: '', email: '', phone: ''});
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const set = (k: string, v: string) => setValues((p) => ({...p, [k]: v}));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailValue = values.email.trim();
    if (!emailValue) {
      setState('error');
      setMsg('Please enter your email');
      return;
    }
    if (!consent) {
      setState('error');
      setMsg('Please accept the terms to continue');
      return;
    }
    setState('loading');
    setMsg('');

    const phoneE164 = toE164(values.phone);
    const profileAttributes: Record<string, unknown> = {
      email: emailValue,
      subscriptions: {
        email: {marketing: {consent: 'SUBSCRIBED'}},
        ...(phoneE164 ? {sms: {marketing: {consent: 'SUBSCRIBED'}}} : {}),
      },
    };
    if (values.firstName.trim()) profileAttributes.first_name = values.firstName.trim();
    if (values.lastName.trim()) profileAttributes.last_name = values.lastName.trim();
    if (phoneE164) profileAttributes.phone_number = phoneE164;

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
                profile: {data: {type: 'profile', attributes: profileAttributes}},
                custom_source: 'Discount Signup',
              },
              relationships: {list: {data: {type: 'list', id: SIGNUP_LIST_ID}}},
            },
          }),
        },
      );
      if (res.ok) {
        setState('ok');
        markSignupSubscribed();
      }
      else {
        setState('error');
        setMsg('Something went wrong. Try again.');
      }
    } catch {
      setState('error');
      setMsg('Network error. Try again.');
    }
  }

  return (
    <div
      className="nm-ds-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style dangerouslySetInnerHTML={{__html: CSS}} />
      <div className="nm-ds-card">
        {/* animated scattered red text (bottom), then the static black base */}
        <RedTextLoop className="nm-ds-layer" />
        <img className="nm-ds-layer nm-ds-base" src={BASE_IMAGE} alt="Join No Maintenance" />

        <button className="nm-ds-close" onClick={onClose} aria-label="Close" type="button">
          ✕
        </button>

        {state === 'ok' ? (
          <div className="nm-ds-done">
            <h2>You&apos;re in</h2>
            <p>Check your inbox for your code.</p>
          </div>
        ) : (
          <form className="nm-ds-form" onSubmit={onSubmit}>
            {FIELDS.map((f) => (
              <input
                key={f.key}
                className="nm-ds-input"
                style={{
                  top: `${(f.top + 0.014) * 100}%`,
                  height: `${(f.height - 0.028) * 100}%`,
                  left: `${(BOX_LEFT + SIDE_INSET) * 100}%`,
                  width: `${(BOX_WIDTH - 2 * SIDE_INSET) * 100}%`,
                }}
                type={f.type}
                autoComplete={f.autoComplete}
                aria-label={f.label}
                placeholder={f.label}
                value={values[f.key as keyof typeof values]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ))}

            <button
              type="button"
              className="nm-ds-checkbox"
              role="checkbox"
              aria-checked={consent}
              aria-label="I agree to receive recurring marketing emails and automated texts and accept the terms of service & privacy policy."
              onClick={() => setConsent((c) => !c)}
              style={{left: '23.2%', top: '76.2%', width: '2.9%', height: '2.4%'}}
            >
              {consent && <span className="nm-ds-check">✕</span>}
            </button>

            <button
              type="button"
              className="nm-ds-consent"
              onClick={() => setConsent((c) => !c)}
              aria-hidden="true"
              tabIndex={-1}
            >
              I agree to receive recurring marketing emails and automated texts
              and accept the terms of service &amp; privacy policy. Msg &amp;
              data rates may apply.
            </button>

            <button
              type="submit"
              className="nm-ds-submit"
              disabled={state === 'loading'}
              style={{left: '47.93%', top: '81.95%', width: '28.34%', height: '4.41%'}}
              aria-label="Submit"
            >
              Submit
            </button>

            {state === 'error' && <div className="nm-ds-status nm-ds-status--error">{msg}</div>}
            {state === 'loading' && <div className="nm-ds-status">Signing you up…</div>}
          </form>
        )}
      </div>
    </div>
  );
}
