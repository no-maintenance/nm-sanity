import { KlaviyoPixel, useKlaviyoAnalytics } from '~/components/klaviyo/klaviyo-pixel';
import { useGoogleAnalytics } from '~/hooks/analytics/use-google-analytics';
import { usePinterestAnalytics } from '~/hooks/analytics/use-pinterest-analytics';
import { useFacebookAnalytics } from '~/hooks/analytics/use-facebook-analytics';
import {useIsDev} from '~/hooks/use-is-dev';
import { useAnalyticsEnv } from '~/hooks/use-analytics-env';
import { useEffect, useMemo } from 'react';
import { useNonce } from '@shopify/hydrogen';

export function CustomAnalytics() {
  const { debugTracking } = useAnalyticsEnv();
  const isDev = useIsDev();

  // Memoize the condition to prevent unnecessary re-renders
  const shouldRender = useMemo(() => {
    return !isDev || debugTracking;
  }, [isDev, debugTracking]);

  if (!shouldRender) {
    return null;
  }
  
  return <ProductionAnalytics />;
}

function ProductionAnalytics() {
  const analyticsEnv = useAnalyticsEnv();
  const nonce = useNonce();
  const { googleAnalyticsId, facebookPixelId, pinterestPixelId, klaviyoPixelId } = analyticsEnv;
  
  useGoogleAnalytics({id: googleAnalyticsId});
  useFacebookAnalytics({id: facebookPixelId});
  usePinterestAnalytics({id: pinterestPixelId});
  // useKlaviyoAnalytics({id: klaviyoPixelId});
  return (
    <>
      {/* <KlaviyoPixel id={klaviyoPixelId} nonce={nonce} /> */}
    </>
  );
}