import {stegaClean} from '@sanity/client/stega';
import {useEffect} from 'react';

import {useRootLoaderData} from '~/root';

// Fallback used only if the Sanity announcement bar is empty. Keep this in sync
// with the live copy so the banner never renders blank if the CMS field clears.
const DEFAULT_MARQUEE_TEXT =
  'FW26 DELIVERY 3: RELEASING 9/11 AT 11AM PST/2PM EST, SIGN UP FOR 10% OFF YOUR FIRST PURCHASE';
const KLAVIYO_FORM_ID = 'Rc2Qwz';
const COPIES = 8;

export function AnnouncementBar() {
  const {sanityRoot} = useRootLoaderData();
  const sanityText = stegaClean(
    sanityRoot?.data?.header?.announcementBar?.[0]?.text,
  )?.trim();
  const marqueeText = sanityText || DEFAULT_MARQUEE_TEXT;

  useEffect(() => {
    const el = document.getElementById('announcement-bar');
    if (!el) return;
    const setHeight = () =>
      document.documentElement.style.setProperty(
        '--announcement-bar-height',
        `${el.clientHeight}px`,
      );
    setHeight();
    window.addEventListener('resize', setHeight);
    return () => {
      window.removeEventListener('resize', setHeight);
      document.documentElement.style.removeProperty('--announcement-bar-height');
    };
  }, [marqueeText]);

  const handleClick = () => {
    if (typeof window === 'undefined') return;
    const w = window as any;

    if (w.klaviyo?.openForm) {
      w.klaviyo.openForm(KLAVIYO_FORM_ID);
      return;
    }

    w._klOnsite = w._klOnsite || [];
    w._klOnsite.push(['openForm', KLAVIYO_FORM_ID]);
  };

  return (
    <section
      className="bg-black text-white overflow-hidden"
      id="announcement-bar"
    >
      <button
        aria-label={marqueeText}
        className="block w-full py-2 text-xs tracking-wider uppercase transition-opacity hover:opacity-80"
        onClick={handleClick}
        type="button"
      >
        <div
          aria-hidden="true"
          className="flex w-max animate-marquee whitespace-nowrap will-change-transform motion-reduce:animate-none"
        >
          {Array.from({length: COPIES}).map((_, i) => (
            <span className="shrink-0 px-8 sm:px-32" key={i}>
              {marqueeText}
            </span>
          ))}
        </div>
      </button>
    </section>
  );
}
