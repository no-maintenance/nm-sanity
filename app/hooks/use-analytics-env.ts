import { useRootLoaderData } from '~/root';

export function useAnalyticsEnv() {
  const { env } = useRootLoaderData();
  
  return {
    googleAnalyticsId: env.GOOGLE_ANALYTICS_ID || '',
    facebookPixelId: env.FACEBOOK_PIXEL_ID || '',
    pinterestPixelId: env.PINTEREST_PIXEL_ID || '',
    klaviyoPixelId: env.KLAVIYO_PIXEL_ID || '',
    debugTracking: !!env.DEBUG_TRACKING,
  };
} 