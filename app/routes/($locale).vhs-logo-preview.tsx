import type {MetaFunction} from '@shopify/remix-oxygen';
import {useEffect, useRef} from 'react';

import {NmWaterGlitch} from '~/components/nm-water-glitch';

export const meta: MetaFunction = () => {
  return [{title: 'Water + Glitch Logo Preview'}];
};

export default function WaterGlitchPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // React doesn't reliably set the `muted` DOM property from the attribute,
  // which makes browsers block muted autoplay. Force it and kick off playback.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const play = v.play();
    if (play) play.catch(() => {});
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-24">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/signup-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <NmWaterGlitch className="relative z-10 w-[30rem] max-w-full" />
    </div>
  );
}
