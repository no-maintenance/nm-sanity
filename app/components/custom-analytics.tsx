import { KlaviyoPixel } from '~/components/klaviyo/klaviyo-pixel';
import { useGoogleAnalytics } from '~/hooks/analytics/use-google-analytics';
import { usePinterestAnalytics } from '~/hooks/analytics/use-pinterest-analytics';
import { useFacebookAnalytics } from '~/hooks/analytics/use-facebook-analytics';
import {useIsDev} from '~/hooks/use-is-dev';
import { useAnalyticsEnv } from '~/hooks/use-analytics-env';
import { useEffect, useMemo } from 'react';
import { useNonce } from '@shopify/hydrogen';

export function CustomAnalytics() {
  const analyticsEnv = useAnalyticsEnv();
  const isDev = useIsDev();
  const nonce = useNonce();

  // Memoize the analytics IDs to prevent re-renders
  const analyticsConfig = useMemo(() => ({
    googleAnalyticsId: analyticsEnv.googleAnalyticsId || '',
    facebookPixelId: analyticsEnv.facebookPixelId || '',
    pinterestPixelId: analyticsEnv.pinterestPixelId || '',
    klaviyoPixelId: analyticsEnv.klaviyoPixelId || '',
    debugTracking: analyticsEnv.debugTracking,
  }), [
    analyticsEnv.googleAnalyticsId,
    analyticsEnv.facebookPixelId, 
    analyticsEnv.pinterestPixelId,
    analyticsEnv.klaviyoPixelId,
    analyticsEnv.debugTracking
  ]);

  // Memoize the condition to prevent unnecessary re-renders
  const shouldRender = useMemo(() => {
    return !isDev || analyticsConfig.debugTracking;
  }, [isDev, analyticsConfig.debugTracking]);

  // Setup analytics hooks
  useGoogleAnalytics({id: analyticsConfig.googleAnalyticsId});
  useFacebookAnalytics({id: analyticsConfig.facebookPixelId});
  usePinterestAnalytics({id: analyticsConfig.pinterestPixelId});

  if (!shouldRender) {
    return null;
  }
  
  return (
    <>
      <KlaviyoPixel id={'RDT3xD'} nonce={nonce} />
    </>
  );
}