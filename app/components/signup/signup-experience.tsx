import {Link} from '@remix-run/react';
import {useState} from 'react';
import {KLAVIYO_BASE_URL, KLAVIYO_COMPANY_ID} from '~/sanity/constants';
import {NmWaterGlitch} from '~/components/nm-water-glitch';
import {NmLogo3D} from '~/components/nm-logo-3d';

// Which animated logo to show above the form.
type SignupLogo = 'glitch' | 'logo3d';

// Newsletter list the rest of the app subscribes to.
const SIGNUP_LIST_ID = 'Wimtnj';

// Normalize a typed phone number to E.164 (Klaviyo requires it for SMS).
// Defaults unprefixed 10-digit input to US (+1).
function toE164(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

const SIGNUP_CSS = `
.nm-signup {
  position: fixed;
  inset: 0;
  z-index: 60;
  height: 100vh;
  height: 100dvh;
  background: #000;
  color: #fff;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  font-family: ui-monospace, Menlo, Monaco, Consolas, "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace;
  /* Cinematic reveal echoing the reference: the screen dissolves in (slow fade +
     gentle settle) while a soft white mist sweeps across and clears — the
     cloud-dissolve that reveals each scene in the reference site. */
  animation: nm-signup-dissolve 1.1s ease both;
  will-change: transform, opacity;
}
@keyframes nm-signup-dissolve {
  from { opacity: 0; transform: scale(1.05); }
  to   { opacity: 1; transform: scale(1); }
}
/* Soft white cloud that sweeps across and clears to reveal the signup. It's a
   real organic cloud (fractal-noise via SVG feTurbulence), not a flat gradient,
   so it has wispy edges like the reference site's cloud-dissolve. It drifts in
   from the left, passes over the screen, and exits right while fading. */
.nm-signup-cloud {
  position: fixed;
  inset: -45%;
  z-index: 2;
  pointer-events: none;
  animation: nm-signup-cloud-sweep 2.1s cubic-bezier(0.37, 0, 0.35, 1) both;
  will-change: transform, opacity;
}
.nm-signup-cloud-svg { width: 100%; height: 100%; display: block; }
@keyframes nm-signup-cloud-sweep {
  0%   { opacity: 0;    transform: translate3d(-36%, -6%, 0) scale(1.05); }
  20%  { opacity: 0.96; }
  55%  { opacity: 0.72; }
  100% { opacity: 0;    transform: translate3d(40%, 5%, 0) scale(1.22); }
}
@media (prefers-reduced-motion: reduce) {
  .nm-signup { animation: none; }
  .nm-signup-cloud { display: none; }
}
.nm-signup * { box-sizing: border-box; }

/* Full-bleed moving background video — the ONLY background layer. No still
   photo/poster, so nothing flashes before playback; the black backdrop shows
   until the first frame decodes, then the video eases in (no hard pop). */
.nm-signup-bgvideo {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;
}
.nm-signup-bgvideo.is-ready { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .nm-signup-bgvideo { display: none; }
}

/* Gentle veil so the form stays legible over the brighter light-leak areas. */
.nm-signup-veil {
  position: fixed;
  inset: 0;
  background: radial-gradient(70% 55% at 50% 45%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0.05) 100%);
  pointer-events: none;
}

.nm-signup-close {
  position: fixed;
  top: clamp(14px, 3vw, 28px);
  right: clamp(14px, 3vw, 32px);
  z-index: 3;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
}
.nm-signup-close:hover { opacity: 1; }

.nm-signup-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: clamp(20px, 4vh, 48px) 20px;
}
.nm-signup-inner { width: min(440px, 90vw); }

/* Moving logo — sits where the wordmark was. */
.nm-signup-logo {
  width: clamp(150px, 34vw, 260px);
  margin: 0 auto clamp(14px, 3vh, 32px);
}
/* The 3D logo reads smaller in the same box, so give it 50% more room. */
.nm-signup-logo-3d {
  width: clamp(225px, 51vw, 390px);
}

.nm-signup-sub {
  margin: 0 0 clamp(16px, 2.6vh, 26px);
  font-size: 11px;
  line-height: 1.7;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.82);
  text-shadow: 0 1px 12px rgba(0,0,0,0.85);
}

/* The four fields form one outlined box with hairline dividers, like the ref. */
.nm-signup-fields {
  border: 1px solid rgba(255,255,255,0.75);
}
.nm-signup-input {
  width: 100%;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(255,255,255,0.5);
  color: #fff;
  font: inherit;
  font-size: 15px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: left;
  padding: clamp(13px, 1.9vh, 18px) 18px;
  outline: none;
  transition: background-color 0.2s;
}
.nm-signup-fields .nm-signup-input:last-child { border-bottom: 0; }
.nm-signup-input:focus { background: rgba(255,255,255,0.06); }
.nm-signup-input::placeholder {
  color: rgba(255,255,255,0.72);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.nm-signup-consent {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  margin-top: clamp(14px, 2.4vh, 22px);
  text-align: left;
}
.nm-signup-consent input {
  margin-top: 1px;
  width: 15px;
  height: 15px;
  accent-color: #fff;
  flex: 0 0 auto;
}
.nm-signup-consent label {
  font-size: 10px;
  line-height: 1.6;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.78);
  max-width: 340px;
}
.nm-signup-consent a { color: #fff; text-decoration: underline; }

.nm-signup-submit {
  margin: clamp(16px, 2.6vh, 24px) auto 0;
  min-width: 180px;
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.85);
  font: inherit;
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  padding: 15px 34px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.nm-signup-submit:hover { background: #fff; color: #000; }
.nm-signup-submit:disabled { opacity: 0.5; cursor: default; }
.nm-signup-submit:disabled:hover { background: transparent; color: #fff; }

.nm-signup-msg {
  margin-top: 16px;
  min-height: 12px;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85);
}
.nm-signup-msg.is-error { color: #ff8f8f; }

.nm-signup-success {
  font-size: clamp(15px, 3vw, 20px);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1.6;
  color: #fff;
  text-shadow: 0 1px 12px rgba(0,0,0,0.85);
}
`;

export function SignupExperience({
  onClose,
  logo = 'logo3d',
}: {
  onClose?: () => void;
  logo?: SignupLogo;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>(
    'idle',
  );
  const [msg, setMsg] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailValue = email.trim();
    if (!emailValue) return;
    if (!consent) {
      setState('error');
      setMsg('Please accept the terms to continue');
      return;
    }
    setState('loading');
    setMsg('Signing you up…');

    const phoneE164 = toE164(phone);

    // Build the profile: always email marketing consent; add SMS marketing
    // consent + phone only when a phone number was provided.
    const profileAttributes: Record<string, unknown> = {
      email: emailValue,
      subscriptions: {
        email: {marketing: {consent: 'SUBSCRIBED'}},
        ...(phoneE164
          ? {sms: {marketing: {consent: 'SUBSCRIBED'}}}
          : {}),
      },
    };
    if (firstName.trim()) profileAttributes.first_name = firstName.trim();
    if (lastName.trim()) profileAttributes.last_name = lastName.trim();
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
                profile: {
                  data: {type: 'profile', attributes: profileAttributes},
                },
                custom_source: 'Signup Page',
              },
              relationships: {list: {data: {type: 'list', id: SIGNUP_LIST_ID}}},
            },
          }),
        },
      );
      if (res.ok) {
        setState('ok');
        setMsg('');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
      } else {
        setState('error');
        setMsg('Something went wrong. Try again.');
      }
    } catch {
      setState('error');
      setMsg('Network error. Try again.');
    }
  }

  return (
    <div className="nm-signup" role="dialog" aria-modal="true" aria-label="Sign up">
      <style dangerouslySetInnerHTML={{__html: SIGNUP_CSS}} />

      <video
        className={`nm-signup-bgvideo${bgReady ? ' is-ready' : ''}`}
        src="/signup-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={() => setBgReady(true)}
        onCanPlay={() => setBgReady(true)}
      />
      <div className="nm-signup-veil" aria-hidden="true" />
      <div className="nm-signup-cloud" aria-hidden="true">
        <svg
          className="nm-signup-cloud-svg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <filter
            id="nmSignupCloud"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.013"
              numOctaves={4}
              seed={11}
              stitchTiles="stitch"
              result="n"
            >
              <animate
                attributeName="baseFrequency"
                dur="7s"
                values="0.008 0.013;0.010 0.016;0.008 0.013"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.5 -0.55"
            />
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="#fff"
            filter="url(#nmSignupCloud)"
          />
        </svg>
      </div>

      {onClose ? (
        <button
          className="nm-signup-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>
      ) : null}

      <div className="nm-signup-content">
        <div className="nm-signup-inner">
          {logo === 'logo3d' ? (
            <NmLogo3D className="nm-signup-logo nm-signup-logo-3d" />
          ) : (
            <NmWaterGlitch className="nm-signup-logo" />
          )}

          {state === 'ok' ? (
            <p className="nm-signup-success">
              You&rsquo;re in.
              <br />
              Watch your inbox.
            </p>
          ) : (
            <>
              <p className="nm-signup-sub">
                Sign up for 10% off your first purchase.
              </p>

              <form onSubmit={onSubmit} autoComplete="off">
                <div className="nm-signup-fields">
                  <input
                    className="nm-signup-input"
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    autoComplete="given-name"
                    aria-label="First name"
                    value={firstName}
                    onChange={(ev) => setFirstName(ev.target.value)}
                  />
                  <input
                    className="nm-signup-input"
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    autoComplete="family-name"
                    aria-label="Last name"
                    value={lastName}
                    onChange={(ev) => setLastName(ev.target.value)}
                  />
                  <input
                    className="nm-signup-input"
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Email address"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                  />
                  <input
                    className="nm-signup-input"
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    autoComplete="tel"
                    aria-label="Phone number"
                    value={phone}
                    onChange={(ev) => setPhone(ev.target.value)}
                  />
                </div>

                <div className="nm-signup-consent">
                  <input
                    id="nm-signup-consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(ev) => setConsent(ev.target.checked)}
                  />
                  <label htmlFor="nm-signup-consent">
                    I agree to receive recurring marketing emails and automated
                    texts and accept the{' '}
                    <Link to="/policies/terms-of-service">
                      Terms of Service
                    </Link>{' '}
                    &amp;{' '}
                    <Link to="/policies/privacy-policy">Privacy Policy</Link>.
                    Msg &amp; data rates may apply.
                  </label>
                </div>

                <div style={{display: 'flex', justifyContent: 'center'}}>
                  <button
                    className="nm-signup-submit"
                    type="submit"
                    disabled={state === 'loading'}
                  >
                    {state === 'loading' ? 'Signing Up…' : 'Submit'}
                  </button>
                </div>

                <div
                  className={`nm-signup-msg${
                    state === 'error' ? ' is-error' : ''
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {msg}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
