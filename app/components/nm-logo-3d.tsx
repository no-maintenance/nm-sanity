import {useEffect, useRef} from 'react';

import {cn} from '~/lib/utils';

/**
 * Rotating, cursor-following 3D NO MAINTENANCE logo — the sale-gate treatment,
 * sized for inline use (e.g. the signup form). three.js runs only in the browser
 * (lazy-imported client module); size the footprint with `className`.
 */
export function NmLogo3D({className}: {className?: string}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cleanup = () => {};
    let cancelled = false;

    import('~/lib/nm-logo-3d/nm-logo-3d-init.client')
      .then(({initNmLogo3D}) => {
        if (cancelled || !ref.current) return;
        cleanup = initNmLogo3D(ref.current);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      aria-label="NO MAINTENANCE"
      role="img"
      ref={ref}
      className={cn('select-none', className)}
      style={{aspectRatio: '1275 / 1005', position: 'relative'}}
    >
      {/* Static logo shown while the 3D version loads, so the slot is always the
          logo (transparent PNG) or dark — never a white/blank box. The init
          fades this out once the 3D canvas has drawn its first frame. */}
      <img
        src="/nm-logo-white.png"
        alt=""
        aria-hidden="true"
        className="nm-logo-3d-placeholder"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transition: 'opacity 0.25s ease',
        }}
      />
    </div>
  );
}
