import { KlaviyoPixel } from '~/components/klaviyo/klaviyo-pixel';
import { useGoogleAnalytics } from '~/hooks/analytics/use-google-analytics';
import { usePinterestAnalytics } from '~/hooks/analytics/use-pinterest-analytics';
import { useFacebookAnalytics } from '~/hooks/analytics/use-facebook-analytics';
import {useIsDev} from '~/hooks/use-is-dev';

export function CustomAnalytics() {
  const isDev = useIsDev();

  if (isDev) {
    return null;
  }
  return (
    <ProductionAnalytics />
  );
}

function ProductionAnalytics() {
  useGoogleAnalytics({id: process.env.GOOGLE_ANALYTICS_ID || ''});
  useFacebookAnalytics({id: process.env.FACEBOOK_PIXEL_ID || ''});
  usePinterestAnalytics({id: process.env.PINTEREST_PIXEL_ID || ''});

  return (
    <>
      <KlaviyoPixel id={process.env.KLAVIYO_PIXEL_ID || ''} />
    </>
  );
}