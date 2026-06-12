/**
 * Imperative client-only setup for the SS26 sale gate background:
 *   - grayscale datamosh glitch canvas (with engrained grunge texture)
 *   - the price sheet "typed out like source code" terminal loop
 *   - the rotating 3D logo that follows the cursor
 *
 * Ported verbatim (behaviour-wise) from the approved standalone prototype.
 * Everything is scoped to a root element and returns a cleanup function so it
 * tears down safely on unmount. This module is loaded via dynamic import inside
 * a useEffect, so it (and three.js) only ever run in the browser.
 */
import * as THREE from 'three';

const SHEET: Array<[string, Array<[string, string]>]> = [
  ['Leather', [
    ['Aero Cow Fur Leather Jacket', '395 USD'],
    ['Aero Lambskin Leather Jacket', '370 USD'],
    ['Mechanic Blistered Suede Jackets', '370 USD'],
    ['Mechanic Lambskin Jacket - Black', '380 USD'],
    ['Mechanic Lambskin Jacket - Brown', '360 USD'],
  ]],
  ['Outerwear', [
    ['4-Zip Puffer', '210 USD'],
    ['Engineer Linen Jacket - Black', '170 USD'],
    ['High Collar Military Bomber - Olive', '225 USD'],
    ['High Twist Track Jacket', '170 USD'],
    ['Mechanic Canvas Jacket - Washed Olive', '140 USD'],
    ['Over-Dyed Wine Mechanic Jacket', '140 USD'],
    ['Padded Nylon Mechanic Jacket', '120 USD'],
    ['Pulse Balaclava Sherpa Fleece', '150 USD'],
    ['Quilted Mechanic Jacket - Merlot', '245 USD'],
    ['Quilted Mechanic Jacket - Slate', '245 USD'],
    ['Raw Edge Pinstripe Mechanic Jacket', '140 USD'],
    ['Torai Corduroy Jacket - Waxed Black', '200 USD'],
    ['Torai Corduroy Jacket - Waxed Brown', '200 USD'],
    ['Torai Denim Jacket - Light-Wash', '125 USD'],
  ]],
  ['Denim', [
    ['202XX Slim Straight Denim - Light Wash', '175 USD'],
    ['202XX Slim Straight Denim - Raw Black', '175 USD'],
    ['202XX Slim Straight Denim - Raw Indigo', '175 USD'],
    ['202XX Slim Straight Denim - Red-Line Wash', '175 USD'],
    ['Baggy Denim Double Knee - Garage Wash', '170 USD'],
    ['Baggy Denim Double Knee - Mud Wash', '170 USD'],
    ['Baggy Denim Double Knee - Raw Indigo', '155 USD'],
    ['Baggy Denim Double Knee - Waxed Sand Wash', '145 USD'],
    ['Baggy Japanese Denim - Light Wash', '140 USD'],
    ['Baggy Japanese Denim - Raw Napped Indigo', '140 USD'],
    ['Carpenter Shorts - Raw Indigo', '140 USD'],
    ['Carpenter Shorts - Raw Onyx Black', '140 USD'],
    ['Haze Straight Leg Denim - Raw Indigo', '155 USD'],
    ['Haze Straight Leg Japanese Denim - Dark-Wash', '165 USD'],
    ['Haze Straight Leg Japanese Denim - Garage-Wash', '165 USD'],
    ['Haze Straight Leg Japanese Denim - Light Wash', '165 USD'],
    ['Haze Straight Leg Japanese Denim - Raw Black', '160 USD'],
    ['Haze Straight Leg Japanese Denim - Raw Indigo', '160 USD'],
    ['Haze Trucker Jacket - Raw Indigo', '180 USD'],
    ['Haze Trucker Jacket - Raw Onyx Black', '180 USD'],
    ['Haze Trucker Jacket - Sand Wash', '195 USD'],
    ['Mechanic Jacket - Raw Indigo', '195 USD'],
    ['Mechanic Jacket - Raw Onyx Black', '195 USD'],
  ]],
  ['Bottoms', [
    ['High Twist Full Zip Flight Pants - Grey', '160 USD'],
    ['Raw Edge Pinstripe Double Pleated Trousers', '150 USD'],
    ['Torai Canvas Wide Leg Carpenters - Washed Brown', '135 USD'],
    ['Torai Canvas Wide Leg Carpenters - Washed Olive', '135 USD'],
    ['Wide Leg Denim Shorts - Natural', '90 USD'],
  ]],
  ['Jersey', [
    ['Darted Hoodie - Dark Brown', '125 USD'],
    ['Darted Hoodie - Faded Black', '125 USD'],
    ['Darted Hoodie - Forest Green', '125 USD'],
    ['Darted Zip-Hoodie - Faded Black', '125 USD'],
    ['Lera Long Sleeve Thermal - Black', '85 USD'],
    ['Lera Long Sleeve Thermal - Dark Brown', '85 USD'],
    ['Lera Long Sleeve Thermal - Natural', '85 USD'],
    ['Lera Longsleeve Thermal (2-Pack) - Black', '140 USD'],
    ['Lera Longsleeve Thermal (3-Pack) - Black', '190 USD'],
    ['USMC Slub Tee - Natural', '55 USD'],
  ]],
  ['Knitwear', [
    ['Fisherman Knit Crewneck - Black', '120 USD'],
    ['Fisherman Knit Crewneck - Olive', '120 USD'],
    ['Johnny Collar Knit Polo - Breton Stripe', '125 USD'],
    ['Johnny Collar Knit Polo - Indigo', '125 USD'],
    ['Johnny Collar Knit Polo - Smoke', '125 USD'],
    ['Raw Seam Cashmere Knit - Black', '150 USD'],
  ]],
  ['Shirting', [
    ['50s Spread Collar Long Sleeve Shirt - Mauve Plaid', '170 USD'],
    ['50s Spread Collar Long Sleeve Shirt - Navy Plaid', '165 USD'],
    ['50s Spread Collar Short Sleeve Shirt - Blue Plaid', '140 USD'],
    ['CPO Work Long Sleeve Shirt - Indigo Chambray', '165 USD'],
    ['Duvet Voile Oxford Shirt - Beige', '145 USD'],
    ['Index Oxford Shirt - Blue Stripe', '130 USD'],
    ['VIP Oxford Short Sleeve Shirt - Blue Dobby Stripe', '140 USD'],
    ['Wrinkled Dobby SS Camp Shirt - Olive', '120 USD'],
  ]],
  ['Accessories', [
    ['Membrane Leather Wallet - Phantom Black', '60 USD'],
    ['Membrane Leather Wallet - Saffron', '45 USD'],
    ['Membrane Scarf - Black', '50 USD'],
    ['Sling Canvas Bag - Washed Black', '115 USD'],
  ]],
];

function buildCode(): string {
  const L: string[] = [];
  L.push('// SS26: BY WAY OF MEMORY');
  L.push('// No Maintenance — Los Angeles');
  L.push('// 1651 S Central Ave Unit E, Glendale, CA 91204');
  L.push('');
  L.push('const priceSheet = {');
  SHEET.forEach((section) => {
    const key = section[0].toLowerCase();
    L.push('  ' + key + ': {');
    const items = section[1];
    for (let i = 0; i < items.length; i += 2) {
      const chunk = items
        .slice(i, i + 2)
        .map((item) => JSON.stringify(item[0]) + ': ' + JSON.stringify(item[1]) + ',')
        .join('   ');
      L.push('    ' + chunk);
    }
    L.push('  },');
  });
  L.push('};');
  return L.join('\n');
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function initSaleGate(root: HTMLElement): () => void {
  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    root.querySelector(sel) as T | null;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  let stopped = false;
  const cleanups: Array<() => void> = [];

  /* ---------------- TYPEWRITER ---------------- */
  (function typeLoop() {
    const codeEl = q('.ss26-code');
    const terminalEl = q('.ss26-terminal');
    if (!codeEl || !terminalEl) return;

    const full = buildCode();
    const CHARS_PER_TICK = isMobile ? 5 : 4;
    const TICK = isMobile ? 45 : 36;
    const MAX_LINES = isMobile ? 90 : 160;
    const loopText = full + '\n\n\n';
    let srcPos = 0;
    let shown = '';
    let timer: ReturnType<typeof setTimeout> | undefined;

    function autoscroll() {
      const avail = terminalEl!.clientHeight;
      const contentH = codeEl!.scrollHeight;
      const off = avail / 2 - contentH + 192;
      codeEl!.style.transform = `translateY(${off}px)`;
    }

    function step() {
      if (stopped) return;
      for (let n = 0; n < CHARS_PER_TICK; n++) {
        shown += loopText.charAt(srcPos);
        srcPos++;
        if (srcPos >= loopText.length) srcPos = 0;
      }
      const lines = shown.split('\n');
      if (lines.length > MAX_LINES) shown = lines.slice(lines.length - MAX_LINES).join('\n');
      codeEl!.textContent = shown;
      autoscroll();
      timer = setTimeout(step, TICK);
    }

    if (reduce) {
      codeEl.textContent = full;
      autoscroll();
      return;
    }
    step();
    cleanups.push(() => timer && clearTimeout(timer));
  })();

  /* ---------------- GLITCH BACKGROUND ---------------- */
  (function glitch() {
    const c = q<HTMLCanvasElement>('.ss26-glitch');
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    function resize() {
      W = c!.clientWidth;
      H = c!.clientHeight;
      c!.width = Math.floor(W * dpr);
      c!.height = Math.floor(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.imageSmoothingEnabled = false;
    }
    resize();
    window.addEventListener('resize', resize);
    cleanups.push(() => window.removeEventListener('resize', resize));

    // grunge texture, pre-inverted to light grit, engrained each frame
    let grungeInv: HTMLCanvasElement | null = null;
    const grungeImg = new Image();
    grungeImg.onload = function () {
      grungeInv = document.createElement('canvas');
      grungeInv.width = grungeImg.naturalWidth;
      grungeInv.height = grungeImg.naturalHeight;
      const gx = grungeInv.getContext('2d')!;
      gx.filter = 'grayscale(1) invert(1) contrast(1.15)';
      gx.drawImage(grungeImg, 0, 0);
      gx.filter = 'none';
    };
    grungeImg.src = '/sale-grunge.png';

    const bw = 220;
    const bh = 130;
    const buf = document.createElement('canvas');
    buf.width = bw;
    buf.height = bh;
    const bctx = buf.getContext('2d')!;
    bctx.fillStyle = '#3a3a3a';
    bctx.fillRect(0, 0, bw, bh);

    const blobs: Array<{x: number; y: number; r: number; vx: number; vy: number; dark: boolean}> = [];
    for (let b = 0; b < 7; b++) {
      blobs.push({
        x: rnd(0, bw),
        y: rnd(0, bh),
        r: rnd(bh * 0.2, bh * 0.6),
        vx: rnd(-0.5, 0.5),
        vy: rnd(-0.22, 0.22),
        dark: Math.random() < 0.62,
      });
    }

    const scan = document.createElement('canvas');
    scan.width = 4;
    scan.height = 3;
    const sctx = scan.getContext('2d')!;
    sctx.fillStyle = 'rgba(0,0,0,0.55)';
    sctx.fillRect(0, 0, 4, 1);
    const scanPat = ctx.createPattern(scan, 'repeat')!;

    const nW = 160;
    const nH = 110;
    const noise = document.createElement('canvas');
    noise.width = nW;
    noise.height = nH;
    const nctx = noise.getContext('2d')!;
    function genNoise() {
      const img = nctx.createImageData(nW, nH);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = Math.random() * 30;
      }
      nctx.putImageData(img, 0, 0);
    }

    let frame = 0;
    let raf: number | undefined;
    function draw() {
      if (stopped) return;
      raf = requestAnimationFrame(draw);
      frame++;
      if (isMobile && frame % 2 === 0) return; // ~30fps on mobile

      // evolve low-res buffer
      bctx.globalAlpha = 0.06;
      bctx.fillStyle = '#444';
      bctx.fillRect(0, 0, bw, bh);
      bctx.globalAlpha = 1;
      const shift = rnd(2, 7) * (Math.random() < 0.5 ? -1 : 1);
      bctx.globalAlpha = 0.9;
      bctx.drawImage(buf, shift, 0);
      bctx.globalAlpha = 1;
      if (Math.random() < 0.3) {
        const ty = rnd(0, bh);
        const th = rnd(2, bh * 0.18);
        bctx.drawImage(buf, 0, ty, bw, th, rnd(-25, 25), ty, bw, th);
      }
      for (let bi = 0; bi < blobs.length; bi++) {
        const p = blobs[bi];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.r) p.x = bw + p.r;
        else if (p.x > bw + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = bh + p.r;
        else if (p.y > bh + p.r) p.y = -p.r;
        const g0 = p.dark ? '0,0,0' : '230,230,230';
        const grad = bctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `rgba(${g0},0.16)`);
        grad.addColorStop(1, `rgba(${g0},0)`);
        bctx.fillStyle = grad;
        bctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }

      // composite to screen
      ctx!.clearRect(0, 0, W, H);
      ctx!.imageSmoothingEnabled = true;
      const cover = Math.max(W / bw, H / bh);
      const dw = bw * cover;
      const dh = bh * cover;
      ctx!.drawImage(buf, (W - dw) / 2, (H - dh) / 2, dw, dh);

      if (grungeInv) {
        ctx!.save();
        ctx!.globalCompositeOperation = 'screen';
        ctx!.globalAlpha = 0.42;
        const panX = ((frame * 0.2) % 80) - 40;
        const jit = Math.random() < 0.4 ? rnd(-8, 8) : 0;
        const margin = 60;
        ctx!.drawImage(grungeInv, panX + jit - margin, 0, W + margin * 2, H);
        ctx!.restore();
      }

      if (frame % 2 === 0) genNoise();
      ctx!.imageSmoothingEnabled = false;
      ctx!.globalAlpha = 0.3;
      ctx!.drawImage(noise, 0, 0, W, H);
      ctx!.globalAlpha = 1;

      ctx!.fillStyle = scanPat;
      ctx!.fillRect(0, 0, W, H);

      if (Math.random() < 0.25) {
        ctx!.fillStyle = `rgba(220,220,220,${rnd(0.05, 0.13)})`;
        ctx!.fillRect(0, rnd(0, H), W, rnd(1, 2));
      }

      ctx!.fillStyle = 'rgba(0,0,0,0.5)';
      ctx!.fillRect(0, 0, W, H);
    }

    if (reduce) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buf, 0, 0, W, H);
      ctx.fillStyle = scanPat;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
    } else {
      draw();
    }
    cleanups.push(() => raf && cancelAnimationFrame(raf));
  })();

  /* ---------------- 3D LOGO ---------------- */
  (function logo() {
    const mount = q('.ss26-scene');
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    let mesh: THREE.Group | null = null;
    let geo: THREE.PlaneGeometry | null = null;
    let mat: THREE.MeshBasicMaterial | null = null;
    let targetRY = 0;
    let targetRX = 0;
    let curRY = 0;
    let curRX = 0;

    function applyLogoScale() {
      if (!mesh) return;
      const s = Math.max(0.5, Math.min(1, window.innerWidth / 1440));
      mesh.scale.set(s, s, s);
    }

    const loader = new THREE.TextureLoader();
    loader.load('/nm-logo-white.png', (tex) => {
      if (stopped) return;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const h = 3.4;
      const w = h * (tex.image.width / tex.image.height);
      geo = new THREE.PlaneGeometry(w, h);
      const depth = 0.45;
      const layers = isMobile ? 8 : 16;
      mesh = new THREE.Group();
      for (let i = 0; i < layers; i++) {
        const slice = new THREE.Mesh(geo, mat);
        slice.position.z = -depth / 2 + (depth * i) / (layers - 1);
        mesh.add(slice);
      }
      scene.add(mesh);
      applyLogoScale();
    });

    function setTarget(clientX: number, clientY: number) {
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = (clientY / window.innerHeight) * 2 - 1;
      targetRY = nx * Math.PI;
      targetRX = ny * (Math.PI * 0.5);
    }
    const onPointer = (e: PointerEvent) => setTarget(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      applyLogoScale();
    };
    window.addEventListener('pointermove', onPointer, {passive: true});
    window.addEventListener('touchmove', onTouch, {passive: true});
    window.addEventListener('resize', onResize);

    let t = 0;
    let raf: number | undefined;
    function animate() {
      if (stopped) return;
      raf = requestAnimationFrame(animate);
      if (mesh) {
        curRY += (targetRY - curRY) * 0.042;
        curRX += (targetRX - curRX) * 0.042;
        t += 0.003;
        const idleY = reduce ? 0 : Math.sin(t) * 0.08;
        const idleX = reduce ? 0 : Math.cos(t * 0.8) * 0.04;
        mesh.rotation.y = curRY + idleY;
        mesh.rotation.x = curRX + idleX;
      }
      renderer.render(scene, camera);
    }
    animate();

    cleanups.push(() => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', onResize);
      geo?.dispose();
      mat?.map?.dispose();
      mat?.dispose();
      renderer.dispose();
      const el = renderer.domElement;
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  })();

  return () => {
    stopped = true;
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore teardown errors */
      }
    });
  };
}
