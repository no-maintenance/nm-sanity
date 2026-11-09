/**
 * Imperative, client-only physics + rendering for the FW26 "WE WILL BE HOME
 * AGAIN SOON" password gate.
 *
 * The whole scene is a single full-screen 2D canvas, styled like an antique
 * archival plate:
 *   - up to 1000 real vintage keys (12 scanned cutouts, multiplied) drift and
 *     bounce off every edge of the page
 *   - an ornate antique-steel keyhole escutcheon sits in the centre
 *   - the pointer grabs the nearest key, drags it (with weight), and pulls it
 *     toward the keyhole; releasing it over the hole "tries" that key
 *   - a correct key turns in the lock with a warm glow; a wrong key is rejected
 *     and flung back into the swarm
 *
 * Only ~25 of the keys actually open the lock. Which ones is decided by the
 * server (see the site-protected route action) — the client never knows, it
 * just submits the dragged key's index and animates the answer. Loaded via
 * dynamic import inside a useEffect, so it only ever runs in the browser.
 */

export type KeyAttemptResult = 'correct' | 'wrong';
export type GatePhase = 'idle' | 'holding' | 'testing' | 'wrong' | 'correct';

export interface KeysGateOptions {
  /** Total keys to render (winners + decoys). */
  count: number;
  /** Indices of this visitor's "real" keys; rendered as the hero key. */
  winningIndices: number[];
  /** Submit a dragged key for validation. Resolves 'correct' | 'wrong'. */
  onAttempt: (index: number) => Promise<KeyAttemptResult>;
  /** Called once, after the winning-key turn animation finishes. */
  onUnlock: () => void;
  /** Optional: surface the current phase to the React layer. */
  onPhase?: (phase: GatePhase) => void;
  /** Top inset (px) the swarm stays below — e.g. a fixed banner's height. */
  topInset?: number;
}

interface KeyBody {
  index: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  scale: number;
  winner: boolean; // one of the 10 "real" keys (uses the hero sprite)
  variant: number; // which decoy sprite (ignored for winners)
}

const TWO_PI = Math.PI * 2;

// Deep oxblood the key + lock turn when the correct key opens the lock.
const OXBLOOD = '#5a2420';
const OXBLOOD_GLOW = 'rgba(150,55,45,0.95)';

// The ornate keyhole plate — a background-removed antique-steel escutcheon
// (gadrooned border, sunburst oval, engraved "WE WILL BE HOME AGAIN SOON",
// transparent keyhole) drawn at the lock's centre.
const LOCK_PLATE_SRC = '/fw26-keys/lock-plate.png';
const PLATE_ASPECT = 494 / 800; // sprite width / height
// Where the keyhole sits within the sprite (fraction of w/h). Keys are drawn to
// this point, so it must line up with the lock's logical centre.
const KEYHOLE_FX = 0.4983;
const KEYHOLE_FY = 0.4832;

// The 10 "real" keys all use this one scanned key the client gave us.
const HERO_SRC = '/fw26-keys/hero.png';
// The decoy swarm cycles through the 12 scanned keys from the reference chart.
const DECOY_SRCS = Array.from(
  {length: 12},
  (_, i) => `/fw26-keys/key-${String(i + 1).padStart(2, '0')}.png`,
);

export function initKeysGate(
  canvas: HTMLCanvasElement,
  options: KeysGateOptions,
): () => void {
  const {onAttempt, onUnlock, onPhase} = options;
  const topInset = Math.max(0, options.topInset ?? 0);
  const ctx = canvas.getContext('2d', {alpha: true})!;
  const reduceMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)')
    .matches;

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;
  let baseH = 46; // nominal key height in CSS px (before per-key scale)
  const lock = {x: 0, y: 0, r: 46};

  let heroSprite: HTMLImageElement | null = null;
  let plateSprite: HTMLImageElement | null = null;
  const decoySprites: HTMLImageElement[] = [];

  const count = Math.max(1, Math.floor(options.count));
  const winnerSet = new Set(
    (options.winningIndices || []).filter((i) => Number.isInteger(i) && i >= 0 && i < count),
  );
  const fewKeys = count <= 40;
  const keys: KeyBody[] = [];

  let active: KeyBody | null = null;
  let pointerActive = false;
  let pointerX = 0;
  let pointerY = 0;
  let phase: GatePhase = 'idle';
  let openAmount = 0;
  let denyShake = 0;
  let seatT = 0;
  let activeWhiteness = 0; // held key glows white as it nears the keyhole
  let running = true;
  let started = false;
  let cancelled = false;
  let rafId = 0;

  function setPhase(p: GatePhase) {
    if (p === phase) return;
    phase = p;
    onPhase?.(p);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lock.x = W / 2;
    lock.y = H / 2;
    lock.r = Math.max(21, Math.min(40, Math.min(W, H) * 0.04375));
    // Few keys → big, prominent keys; a dense swarm → small keys.
    baseH = fewKeys
      ? Math.max(84, Math.min(170, Math.min(W, H) * 0.17))
      : Math.max(30, Math.min(54, Math.min(W, H) * 0.062));
  }

  function seed() {
    keys.length = 0;
    const speedMul = fewKeys ? 0.6 : 1;
    const spinMul = fewKeys ? 0.4 : 1;
    const nDecoy = Math.max(1, decoySprites.length);
    for (let i = 0; i < count; i++) {
      const speed = (reduceMotion ? 0.12 : 0.3 + Math.random() * 0.65) * speedMul;
      const dir = Math.random() * TWO_PI;
      keys.push({
        index: i, // indices 0..winnerCount-1 are the real keys
        x: Math.random() * W,
        y: topInset + Math.random() * Math.max(1, H - topInset),
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed,
        angle: Math.random() * TWO_PI,
        spin: reduceMotion ? 0 : (Math.random() - 0.5) * 0.018 * spinMul,
        scale: fewKeys ? 0.82 + Math.random() * 0.36 : 0.6 + Math.random() * 0.55,
        winner: winnerSet.has(i),
        variant: Math.floor(Math.random() * nDecoy),
      });
    }
    // Shuffle so the winning keys are scattered through the swarm, not clumped
    // at the front of the draw order / spawn sequence.
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = keys[i];
      keys[i] = keys[j];
      keys[j] = tmp;
    }
  }

  // key display height in CSS px
  const keyH = (k: KeyBody) => baseH * k.scale;
  const halfExtent = (k: KeyBody) => keyH(k) * 0.5;

  function nearestKey(px: number, py: number, maxDist: number): KeyBody | null {
    let best: KeyBody | null = null;
    let bestD = maxDist * maxDist;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const dx = k.x - px;
      const dy = k.y - py;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  }

  function toLocal(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    return {x: e.clientX - rect.left, y: e.clientY - rect.top};
  }

  function onPointerDown(e: PointerEvent) {
    if (phase === 'testing' || phase === 'correct') return;
    const {x, y} = toLocal(e);
    pointerX = x;
    pointerY = y;
    const grab = Math.max(30, Math.min(W, H) * 0.05) + 26;
    const k = nearestKey(x, y, grab);
    if (k) {
      active = k;
      pointerActive = true;
      seatT = 0;
      k.vx = 0;
      k.vy = 0;
      setPhase('holding');
      canvas.setPointerCapture?.(e.pointerId);
      canvas.style.cursor = 'grabbing';
    }
  }

  function onPointerMove(e: PointerEvent) {
    const {x, y} = toLocal(e);
    pointerX = x;
    pointerY = y;
    if (!pointerActive) {
      const grab = Math.max(30, Math.min(W, H) * 0.05);
      canvas.style.cursor = nearestKey(x, y, grab) ? 'grab' : 'default';
    }
  }

  function ejectActive() {
    if (!active) return;
    const dx = active.x - lock.x;
    const dy = active.y - lock.y;
    const len = Math.hypot(dx, dy) || 1;
    const power = 6 + Math.random() * 3;
    active.vx = (dx / len) * power + (Math.random() - 0.5);
    active.vy = (dy / len) * power + (Math.random() - 0.5);
    active.spin = (Math.random() - 0.5) * 0.3;
    active = null;
    pointerActive = false;
    seatT = 0;
  }

  function throwActive() {
    if (!active) return;
    active.spin = (Math.random() - 0.5) * 0.06;
    active = null;
    pointerActive = false;
    seatT = 0;
  }

  async function tryKey(k: KeyBody) {
    setPhase('testing');
    pointerActive = false;
    let result: KeyAttemptResult = 'wrong';
    try {
      result = await onAttempt(k.index);
    } catch {
      result = 'wrong';
    }
    if (!running) return;
    if (result === 'correct') {
      setPhase('correct');
    } else {
      setPhase('wrong');
      denyShake = 1;
      ejectActive();
      window.setTimeout(() => {
        if (running && phase === 'wrong') setPhase('idle');
      }, 650);
    }
  }

  function onPointerUp(e: PointerEvent) {
    canvas.style.cursor = 'default';
    if (!active || !pointerActive) return;
    canvas.releasePointerCapture?.(e.pointerId);
    const dist = Math.hypot(active.x - lock.x, active.y - lock.y);
    if (dist < lock.r * 1.3 && phase === 'holding') {
      active.vx = 0;
      active.vy = 0;
      void tryKey(active);
    } else {
      throwActive();
      setPhase('idle');
    }
  }

  function lerpAngle(a: number, b: number, t: number) {
    let d = (b - a) % TWO_PI;
    if (d > Math.PI) d -= TWO_PI;
    if (d < -Math.PI) d += TWO_PI;
    return a + d * t;
  }

  function step() {
    const damp = 0.995;
    const wall = 0.86;
    const clear = lock.r * 2.75;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k === active) continue;
      k.x += k.vx;
      k.y += k.vy;
      k.vx *= damp;
      k.vy *= damp;
      k.angle += k.spin;

      const ext = halfExtent(k) * 0.55;
      if (k.x < ext) {
        k.x = ext;
        k.vx = Math.abs(k.vx) * wall + 0.05;
      } else if (k.x > W - ext) {
        k.x = W - ext;
        k.vx = -Math.abs(k.vx) * wall - 0.05;
      }
      if (k.y < topInset + ext) {
        k.y = topInset + ext;
        k.vy = Math.abs(k.vy) * wall + 0.05;
      } else if (k.y > H - ext) {
        k.y = H - ext;
        k.vy = -Math.abs(k.vy) * wall - 0.05;
      }
      const sp = Math.hypot(k.vx, k.vy);
      if (!reduceMotion && sp < 0.16) {
        const a = Math.random() * TWO_PI;
        k.vx += Math.cos(a) * 0.08;
        k.vy += Math.sin(a) * 0.08;
      }

      // Keep a clear zone around the ornate plate so it reads cleanly.
      const ldx = k.x - lock.x;
      const ldy = k.y - lock.y;
      const ld = Math.hypot(ldx, ldy);
      if (ld < clear) {
        const n = ld || 1;
        const push = (clear - ld) / clear;
        k.x += (ldx / n) * push * 2.8;
        k.y += (ldy / n) * push * 2.8;
        k.vx += (ldx / n) * 0.35;
        k.vy += (ldy / n) * 0.35;
      }
    }

    if (active) {
      let targetX = pointerX;
      let targetY = pointerY;
      const dx = lock.x - active.x;
      const dy = lock.y - active.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pullRadius = lock.r * 4;

      if (phase === 'testing' || phase === 'correct') {
        targetX = lock.x;
        targetY = lock.y - lock.r * 0.05;
        seatT = Math.min(1, seatT + 0.12);
      } else if (dist < pullRadius) {
        const pull = 1 - dist / pullRadius;
        const mag = pull * pull;
        targetX = pointerX + (lock.x - pointerX) * mag * 0.9;
        targetY = pointerY + (lock.y - pointerY) * mag * 0.9;
        seatT = Math.max(0, Math.min(1, (pullRadius - dist) / (lock.r * 1.4)));
      } else {
        seatT = Math.max(0, seatT - 0.08);
      }

      const ease = phase === 'testing' || phase === 'correct' ? 0.4 : 0.32;
      active.x += (targetX - active.x) * ease;
      active.y += (targetY - active.y) * ease;

      // Keys sit bow-up / bit-down (natural image orientation = angle 0). While
      // approaching they point bit-first toward the hole; on correct they turn.
      // A correct key rotates a full 90° to open the lock.
      const turn = phase === 'correct' ? openAmount * (Math.PI / 2) : 0;
      const towardLock = Math.atan2(lock.y - active.y, lock.x - active.x);
      const wantAngle = seatT > 0.35 ? turn : towardLock - Math.PI / 2;
      active.angle = lerpAngle(active.angle, wantAngle, 0.25 + seatT * 0.45);
      active.spin = 0;

      // Turn the held key white as it hovers over the keyhole.
      if (phase === 'testing' || phase === 'correct') {
        activeWhiteness = Math.min(1, activeWhiteness + 0.18);
      } else {
        activeWhiteness = Math.max(0, Math.min(1, (seatT - 0.35) / 0.45));
      }
    } else {
      activeWhiteness = 0;
    }

    if (phase === 'correct') {
      openAmount = Math.min(1, openAmount + 0.04);
      if (openAmount >= 1 && running) {
        running = false;
        window.setTimeout(() => onUnlock(), 260);
      }
    }
    if (denyShake > 0) denyShake = Math.max(0, denyShake - 0.06);
  }

  // Cache a solid-colour silhouette of a sprite (alpha preserved).
  const tintCache = new Map<string, HTMLCanvasElement>();
  function tintSprite(img: HTMLImageElement, color: string): HTMLCanvasElement {
    const cacheKey = `${img.src}|${color}`;
    const cached = tintCache.get(cacheKey);
    if (cached) return cached;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    tintCache.set(cacheKey, c);
    return c;
  }

  function drawKey(k: KeyBody, highlight: boolean) {
    const sp = k.winner ? heroSprite : decoySprites[k.variant];
    if (!sp || !sp.naturalWidth) return;
    const h = keyH(k);
    const w = h * (sp.naturalWidth / sp.naturalHeight);
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.angle);
    if (highlight) {
      ctx.shadowColor =
        phase === 'correct' ? OXBLOOD_GLOW : 'rgba(30,20,6,0.5)';
      ctx.shadowBlur = phase === 'correct' ? 28 : 12;
      ctx.shadowOffsetY = phase === 'correct' ? 0 : 3;
    }
    ctx.drawImage(sp, -w / 2, -h / 2, w, h);
    if (highlight && phase === 'correct') {
      // The correct key goes white, then turns oxblood as it opens the lock.
      ctx.drawImage(tintSprite(sp, '#ffffff'), -w / 2, -h / 2, w, h);
      ctx.globalAlpha = openAmount;
      ctx.shadowColor = OXBLOOD_GLOW;
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 0;
      ctx.drawImage(tintSprite(sp, OXBLOOD), -w / 2, -h / 2, w, h);
      ctx.globalAlpha = 1;
    } else if (highlight && activeWhiteness > 0.01) {
      // Fade the held key to white as it hovers the keyhole.
      ctx.globalAlpha = activeWhiteness;
      ctx.shadowColor = 'rgba(255,255,255,0.95)';
      ctx.shadowBlur = 26 * activeWhiteness;
      ctx.shadowOffsetY = 0;
      ctx.drawImage(tintSprite(sp, '#ffffff'), -w / 2, -h / 2, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawLock() {
    if (!plateSprite) return;
    const {x, y, r} = lock;
    const shake = denyShake > 0 ? Math.sin(denyShake * 40) * denyShake * 5 : 0;
    const glow = phase === 'correct' ? openAmount : seatT * 0.5;

    if (glow > 0.02) {
      // Oxblood glow on unlock; a soft near-white glow while a key hovers.
      const glowRgb = phase === 'correct' ? '150,55,45' : '235,225,205';
      const rad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
      rad.addColorStop(0, `rgba(${glowRgb},${0.3 * glow})`);
      rad.addColorStop(1, `rgba(${glowRgb},0)`);
      ctx.fillStyle = rad;
      ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
    }

    // Scale the plate by the lock radius (matching the old procedural size), then
    // offset so the sprite's keyhole lands exactly on the lock's logical centre.
    const dh = r * 5.8;
    const dw = dh * PLATE_ASPECT;

    ctx.save();
    ctx.translate(x + shake, y);
    if (phase === 'correct') {
      ctx.shadowColor = OXBLOOD_GLOW;
      ctx.shadowBlur = 34 * openAmount;
    }
    ctx.drawImage(plateSprite, -KEYHOLE_FX * dw, -KEYHOLE_FY * dh, dw, dh);
    if (phase === 'correct') {
      // Wash the lock oxblood as it opens.
      ctx.shadowBlur = 0;
      ctx.globalAlpha = openAmount * 0.65;
      ctx.drawImage(
        tintSprite(plateSprite, OXBLOOD),
        -KEYHOLE_FX * dw,
        -KEYHOLE_FY * dh,
        dw,
        dh,
      );
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k === active) continue;
      drawKey(k, false);
    }
    drawLock();
    if (active) drawKey(active, true);
  }

  let lastTime = 0;
  function frame(t: number) {
    const dt = lastTime ? Math.min(50, t - lastTime) : 16;
    lastTime = t;
    const substeps = dt > 26 ? 2 : 1;
    for (let s = 0; s < substeps; s++) step();
    render();
    if (running) rafId = requestAnimationFrame(frame);
    else render();
  }

  function start() {
    if (started || cancelled) return;
    started = true;
    resize();
    seed();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp as EventListener);
    rafId = requestAnimationFrame(frame);
  }

  // Load the keyhole plate + the hero key + the 12 decoy keys, then start.
  let remaining = 2 + DECOY_SRCS.length;
  const done = () => {
    if (--remaining === 0) start();
  };
  const plate = new Image();
  plate.onload = () => {
    plateSprite = plate;
    done();
  };
  plate.onerror = done;
  plate.src = LOCK_PLATE_SRC;
  const hero = new Image();
  hero.onload = () => {
    heroSprite = hero;
    done();
  };
  hero.onerror = done;
  hero.src = HERO_SRC;
  DECOY_SRCS.forEach((src) => {
    const img = new Image();
    img.onload = () => {
      decoySprites.push(img);
      done();
    };
    img.onerror = done;
    img.src = src;
  });

  return () => {
    running = false;
    cancelled = true;
    cancelAnimationFrame(rafId);
    if (started) {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp as EventListener);
    }
  };
}
