import { useMemo } from 'react';
import { useRootLoaderData } from '~/root';

export function useAnalyticsEnv() {
  const { env } = useRootLoaderData();
  
  return useMemo(() => ({
    googleAnalyticsId: env.GOOGLE_ANALYTICS_ID || '',
    facebookPixelId: env.FACEBOOK_PIXEL_ID || '',
    pinterestPixelId: env.PINTEREST_PIXEL_ID || '',
    klaviyoPixelId: env.KLAVIYO_PIXEL_ID || '',
    debugTracking: env.DEBUG_TRACKING === 'true',
  }), [
    env.GOOGLE_ANALYTICS_ID,
    env.FACEBOOK_PIXEL_ID,
    env.PINTEREST_PIXEL_ID,
    env.KLAVIYO_PIXEL_ID,
    env.DEBUG_TRACKING,
  ]);
} 