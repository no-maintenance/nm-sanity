import { KlaviyoPixel } from '~/components/klaviyo/klaviyo-pixel';
import { useGoogleAnalytics } from '~/hooks/analytics/use-google-analytics';
import { usePinterestAnalytics } from '~/hooks/analytics/use-pinterest-analytics';
import { useFacebookAnalytics } from '~/hooks/analytics/use-facebook-analytics';
import {useIsDev} from '~/hooks/use-is-dev';
import { useAnalyticsEnv } from '~/hooks/use-analytics-env';
import { useEffect } from 'react';

export function CustomAnalytics() {
  const { debugTracking } = useAnalyticsEnv();
  const isDev = useIsDev();

  if (isDev && !debugTracking) {
    return null;
  }
  return (
    <ProductionAnalytics />
  );
}

function ProductionAnalytics() {
  const { googleAnalyticsId, facebookPixelId, pinterestPixelId, klaviyoPixelId } = useAnalyticsEnv();
  
  useGoogleAnalytics({id: googleAnalyticsId});
  useFacebookAnalytics({id: facebookPixelId});
  usePinterestAnalytics({id: pinterestPixelId});
  return (
    <>
      <KlaviyoPixel id={klaviyoPixelId} />
    </>
  );
}