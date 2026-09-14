import {Link} from '@remix-run/react';
import {useEffect, useRef, useState} from 'react';
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
  /* The backdrop (video + veil) snaps in quickly; the logo + form themselves
     glitch into place on top (see .nm-signup-content). */
  animation: nm-signup-dissolve 0.25s ease-out both;
  will-change: opacity;
}
@keyframes nm-signup-dissolve {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Real B&W datamosh/glitch footage flashes over the screen then snaps away to
   reveal the signup — screen-blended so the clip's black drops out and only the
   white glitch shows. Actual footage (not CSS), so it reads like a real digital
   glitch transition. Grayscale-locked to stay on-brand. */
.nm-signup-glitch {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  mix-blend-mode: screen;
  animation: nm-signup-glitch-out 0.36s steps(12, end) both;
  will-change: opacity;
}
.nm-signup-glitch video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* Crush toward black so only the brightest streaks stay white (less white
     overall, more black) under the screen blend. */
  filter: grayscale(1) brightness(0.55) contrast(2.1);
}
/* Flicker as it clears — a glitch stutters out rather than fading smoothly.
   Fewer flickers = calmer, quicker glitch. */
@keyframes nm-signup-glitch-out {
  0%   { opacity: 0.65; }
  40%  { opacity: 0.65; }
  58%  { opacity: 0.25; }
  74%  { opacity: 0.55; }
  100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .nm-signup { animation: none; }
  .nm-signup-glitch { display: none; }
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
/* iOS Safari draws a native play-button overlay on any video it thinks the user
   should start manually (e.g. when autoplay is blocked in Low Power Mode). These
   videos are decorative + muted, so strip all native media controls so no play
   button ever shows on top of the design. */
.nm-signup video::-webkit-media-controls,
.nm-signup video::-webkit-media-controls-enclosure,
.nm-signup video::-webkit-media-controls-panel,
.nm-signup video::-webkit-media-controls-play-button,
.nm-signup video::-webkit-media-controls-start-playback-button,
.nm-signup video::-webkit-media-controls-overlay-play-button {
  display: none !important;
  -webkit-appearance: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
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
  /* The design itself glitches into place — hidden at first, then stutters in at
     jittered/clipped offsets (hard step cuts) and lands clean, synced to the
     glitch overlay flashing out on top. */
  animation: nm-signup-content-glitch 0.36s steps(1, end) both;
  will-change: transform, opacity, clip-path;
}
@keyframes nm-signup-content-glitch {
  0%, 18% { opacity: 0; transform: translate3d(0,0,0); clip-path: inset(0 0 100% 0); }
  32% { opacity: 1; transform: translate3d(-8px, 0, 0); clip-path: inset(0 0 55% 0); }
  46% { opacity: 0.3; transform: translate3d(6px, 0, 0); }
  60% { opacity: 1; transform: translate3d(-4px, 0, 0); clip-path: inset(0 0 18% 0); }
  80% { opacity: 1; transform: translate3d(2px, 0, 0); clip-path: inset(0 0 0 0); }
  100% { opacity: 1; transform: translate3d(0,0,0); clip-path: inset(0 0 0 0); }
}
@media (prefers-reduced-motion: reduce) {
  .nm-signup-content { animation: none; }
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

/* Embedded (page) mode: render inside the normal site layout, below the
   announcement bar + header. The signup becomes a section that fills exactly
   the space under the site chrome, so the whole form is visible on landing
   without scrolling. Its video/veil/glitch are bounded to that section. */
.nm-signup.is-embedded {
  position: relative;
  inset: auto;
  z-index: 0;
  height: auto;
  /* Height of the announcement bar + header (both set as runtime CSS vars). */
  --nm-chrome: calc(var(--announcement-bar-height, 0px) + var(--header-height, 0px));
  min-height: calc(100vh - var(--nm-chrome));
  min-height: calc(100dvh - var(--nm-chrome));
}
.nm-signup.is-embedded .nm-signup-bgvideo,
.nm-signup.is-embedded .nm-signup-veil,
.nm-signup.is-embedded .nm-signup-glitch,
.nm-signup.is-embedded .nm-signup-close {
  position: absolute;
}
.nm-signup.is-embedded .nm-signup-content {
  height: auto;
  min-height: calc(100vh - var(--nm-chrome));
  min-height: calc(100dvh - var(--nm-chrome));
  /* Tighter vertical rhythm so everything fits under the header on landing. */
  padding: clamp(6px, 1.4vh, 16px) 20px;
}
/* Bigger parallax logo. The 3D logo box is ~1.27:1, so its width drives a large
   height — cap it by viewport height too (min of width- and height-based caps)
   so it grows on tall screens but never overflows short ones. */
.nm-signup.is-embedded .nm-signup-logo-3d {
  width: min(clamp(240px, 48vw, 420px), 52vh);
}
.nm-signup.is-embedded .nm-signup-logo {
  margin-bottom: clamp(2px, 0.6vh, 8px);
}
/* Slightly smaller form so it makes room for the larger logo and still fits. */
.nm-signup.is-embedded .nm-signup-inner {
  width: min(380px, 86vw);
}
.nm-signup.is-embedded .nm-signup-sub {
  font-size: 10px;
  margin-bottom: clamp(8px, 1.3vh, 14px);
}
.nm-signup.is-embedded .nm-signup-input {
  padding: clamp(7px, 1.1vh, 11px) 16px;
  font-size: 13px;
}
.nm-signup.is-embedded .nm-signup-consent {
  margin-top: clamp(7px, 1.2vh, 12px);
}
.nm-signup.is-embedded .nm-signup-consent label {
  font-size: 9.5px;
}
.nm-signup.is-embedded .nm-signup-submit {
  margin-top: clamp(8px, 1.4vh, 14px);
  padding: 11px 30px;
  font-size: 11px;
  min-width: 150px;
}
.nm-signup.is-embedded .nm-signup-msg {
  margin-top: 10px;
  min-height: 8px;
}
`;

export function SignupExperience({
  onClose,
  logo = 'logo3d',
  embedded = false,
}: {
  onClose?: () => void;
  logo?: SignupLogo;
  // When true, render as an in-page section (keeps the site header/footer)
  // instead of a fixed full-viewport overlay.
  embedded?: boolean;
}) {
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const glitchVideoRef = useRef<HTMLVideoElement>(null);
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

  // Force autoplay/looping. React doesn't reliably set the `muted` property before
  // the first paint, so some browsers treat the video as unmuted and refuse to
  // autoplay. Set muted explicitly, kick off play() ourselves, and retry on the
  // first user interaction (scroll/tap) and when the tab becomes visible so the
  // muted loop starts as soon as it's allowed.
  useEffect(() => {
    const videos = [bgVideoRef.current, glitchVideoRef.current].filter(
      (v): v is HTMLVideoElement => v != null,
    );
    const kick = () => {
      for (const v of videos) {
        v.muted = true;
        v.defaultMuted = true;
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    };
    kick();
    // Safety net: if playback stalls but a frame is available, still reveal it.
    const bg = bgVideoRef.current;
    if (bg && bg.readyState >= 2) setBgReady(true);

    const onInteract = () => kick();
    const onVisible = () => {
      if (document.visibilityState === 'visible') kick();
    };
    window.addEventListener('touchstart', onInteract, {passive: true});
    window.addEventListener('pointerdown', onInteract, {passive: true});
    window.addEventListener('scroll', onInteract, {passive: true});
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('touchstart', onInteract);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('scroll', onInteract);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

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
    <div
      className={`nm-signup${embedded ? ' is-embedded' : ''}`}
      role={embedded ? undefined : 'dialog'}
      aria-modal={embedded ? undefined : 'true'}
      aria-label="Sign up"
    >
      <style dangerouslySetInnerHTML={{__html: SIGNUP_CSS}} />

      <video
        ref={bgVideoRef}
        className={`nm-signup-bgvideo${bgReady ? ' is-ready' : ''}`}
        src="/signup-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onLoadedData={() => setBgReady(true)}
        onPlaying={() => setBgReady(true)}
        onCanPlay={() => setBgReady(true)}
      />
      <div className="nm-signup-veil" aria-hidden="true" />
      <div className="nm-signup-glitch" aria-hidden="true">
        <video
          ref={glitchVideoRef}
          src="/signup-glitch.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
        />
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
