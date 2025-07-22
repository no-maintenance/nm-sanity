import { useRootLoaderData } from '~/root';
import { useEffect, useState } from 'react';

export function useAnalyticsEnv() {
  const { env } = useRootLoaderData();
  const [clientSideDebug, setClientSideDebug] = useState(false);
  
  useEffect(() => {
    // Check for URL parameter or localStorage to enable debugging in production
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDebug = urlParams.get('debug_analytics') === 'true';
      const localStorageDebug = localStorage.getItem('debug_analytics') === 'true';
      
      setClientSideDebug(urlDebug || localStorageDebug);
      
      // If URL param is present, save to localStorage for persistence
      if (urlDebug) {
        localStorage.setItem('debug_analytics', 'true');
      }
    }
  }, []);
  
  const isDebugEnabled = !!env.DEBUG_TRACKING || clientSideDebug;
  
  return {
    googleAnalyticsId: env.GOOGLE_ANALYTICS_ID || '',
    facebookPixelId: env.FACEBOOK_PIXEL_ID || '',
    pinterestPixelId: env.PINTEREST_PIXEL_ID || '',
    klaviyoPixelId: env.KLAVIYO_PIXEL_ID || '',
    debugTracking: isDebugEnabled,
  };
} 