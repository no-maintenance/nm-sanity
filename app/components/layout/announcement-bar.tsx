import {useEffect} from 'react';

import {openSignup} from '~/components/signup/open-signup';

const MARQUEE_TEXT =
  'DOUBLE COLLAR POLO & MOC TOE LOAFER NOW LIVE, SIGN UP FOR 10% OFF YOUR FIRST PURCHASE';
const COPIES = 8;

export function AnnouncementBar() {
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
  }, []);

  const handleClick = () => {
    openSignup();
  };

  return (
    <section
      className="bg-black text-white overflow-hidden"
      id="announcement-bar"
    >
      <button
        aria-label={MARQUEE_TEXT}
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
              {MARQUEE_TEXT}
            </span>
          ))}
        </div>
      </button>
    </section>
  );
}
