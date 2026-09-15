/**
 * The rotating 3D NO MAINTENANCE logo that follows the cursor — the exact
 * treatment from the password-protected sale gate (see sale-gate-init.client.ts),
 * extracted so it can stand alone inside a sized mount (e.g. the signup form).
 *
 * The wordmark texture is stacked across N plane slices along Z to fake extruded
 * depth; the group yaws/pitches toward the pointer with a slow idle wobble.
 * Client-only (three.js) — import it lazily inside a useEffect.
 */
import * as THREE from 'three';

export function initNmLogo3D(mount: HTMLElement): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  let stopped = false;

  const getW = () => mount.clientWidth || 240;
  const getH = () => mount.clientHeight || 190;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, getW() / getH(), 0.1, 100);
  camera.position.set(0, 0, 7.5);

  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(getW(), getH());
  const canvas = renderer.domElement;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 0.25s ease';
  // Render fully transparent until there's a logo to show (no white/blank flash).
  renderer.setClearColor(0x000000, 0);
  // NOTE: the canvas is deliberately NOT added to the DOM here. An empty WebGL
  // canvas can flash white for a frame on real GPUs, so we only attach it once
  // the logo mesh has actually been drawn (see the reveal block below). Rendering
  // works off-DOM; sizing reads the mount element, not the canvas.

  let mesh: THREE.Group | null = null;
  let geo: THREE.PlaneGeometry | null = null;
  let mat: THREE.MeshBasicMaterial | null = null;
  let targetRY = 0;
  let targetRX = 0;
  let curRY = 0;
  let curRX = 0;

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
    // Leave a little margin so the logo never clips as it rotates.
    mesh.scale.setScalar(0.86);
    scene.add(mesh);
  });

  // Follow the pointer across the whole window (matches the sale gate feel).
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
  window.addEventListener('pointermove', onPointer, {passive: true});
  window.addEventListener('touchmove', onTouch, {passive: true});

  const ro = new ResizeObserver(() => {
    camera.aspect = getW() / getH();
    camera.updateProjectionMatrix();
    renderer.setSize(getW(), getH());
  });
  ro.observe(mount);

  let t = 0;
  let raf: number | undefined;
  let revealed = false;
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
    // Attach + fade the canvas in only once the logo mesh has been drawn, then
    // fade out the static placeholder. The slot only ever shows the logo (PNG
    // then 3D) or dark — never a white box.
    if (!revealed && mesh) {
      revealed = true;
      if (!stopped && !canvas.parentNode) mount.appendChild(canvas);
      requestAnimationFrame(() => {
        canvas.style.opacity = '1';
        const placeholder = mount.querySelector<HTMLElement>(
          '.nm-logo-3d-placeholder',
        );
        if (placeholder) placeholder.style.opacity = '0';
      });
    }
  }
  animate();

  return () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('touchmove', onTouch);
    ro.disconnect();
    geo?.dispose();
    mat?.map?.dispose();
    mat?.dispose();
    renderer.dispose();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}
