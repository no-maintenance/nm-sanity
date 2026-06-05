import {useEffect, useRef} from 'react';
import {MediaField} from '../media-field';
import type {ProtectionConfig} from '~/lib/site-protection-states';

interface ProtectionBackgroundProps {
  protection: ProtectionConfig;
  /**
   * Optional animation class to apply to background elements
   * (e.g., 'animate-fade-out-blur' for puzzle completion animations)
   */
  animationClass?: string;
}

/**
 * Drives the cursor-reactive parallax + tilt on the watermark logo.
 * The logo's own float/breathe stays on a CSS animation; this only sets
 * the transform on the wrapper, so the two compose without fighting.
 */
function useLogoParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const maxShift = isMobile ? 16 : 26; // px of cursor pull
    const maxTilt = 6; // degrees of cursor tilt

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf: number | null = null;

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.transform =
        `translate3d(${(cx * maxShift).toFixed(2)}px, ${(cy * maxShift).toFixed(2)}px, 0) ` +
        `rotateY(${(cx * maxTilt).toFixed(2)}deg) ` +
        `rotateX(${(-cy * maxTilt).toFixed(2)}deg)`;

      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    const setTarget = (clientX: number, clientY: number) => {
      tx = (clientX / window.innerWidth) * 2 - 1;
      ty = (clientY / window.innerHeight) * 2 - 1;
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const onPointer = (e: PointerEvent) => setTarget(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('pointermove', onPointer, {passive: true});
    window.addEventListener('touchmove', onTouch, {passive: true});

    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}

/**
 * Shared component for protection background layers:
 * - Background media (image/video)
 * - Overlay with opacity
 * - Watermark logo (gently floats + reacts to the cursor)
 */
export function ProtectionBackground({
  protection,
  animationClass,
}: ProtectionBackgroundProps) {
  const parallaxRef = useLogoParallax();

  return (
    <>
      {/* Background Media */}
      {(protection.backgroundImage || protection.backgroundVideo) && (
        <div className={`absolute inset-0 h-full w-full ${animationClass || ''}`}>
          <MediaField
            mediaType={protection.mediaType || 'image'}
            image={protection.backgroundImage}
            video={protection.backgroundVideo}
            className="h-full w-full object-cover"
            objectFit="cover"
            priority
            controls={false}
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
          />
        </div>
      )}

      {/* Overlay */}
      {protection.overlayOpacity !== undefined && protection.overlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgb(0 0 0)',
            opacity: protection.overlayOpacity / 100
          }}
        />
      )}

      {/* Watermark Logo */}
      <div
        className={`absolute w-9/12 md:w-full max-w-4xl inset-0 md:top-auto md:bottom-0 left-1/2 -translate-x-1/2 mr-10 z-[5] flex items-center justify-center pointer-events-none ${animationClass || ''}`}
        style={{perspective: '900px'}}
      >
        {/* Cursor-reactive parallax wrapper (transform set via JS) */}
        <div ref={parallaxRef} className="will-change-transform [transform-style:preserve-3d]">
          <img
            src="/nm-logo-white.png"
            alt=""
            className="opacity-20 object-contain animate-nm-float will-change-transform motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </>
  );
}
