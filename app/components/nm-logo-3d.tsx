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
      style={{aspectRatio: '1275 / 1005'}}
    />
  );
}
