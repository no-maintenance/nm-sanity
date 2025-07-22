import { useAnalyticsEnv } from './use-analytics-env';

export function useAnalyticsDebug() {
  const { debugTracking } = useAnalyticsEnv();
  
  const debug = (pixelName: string, action: string, data?: any) => {
    if (debugTracking) {
      console.group(`🔍 Analytics Debug: ${pixelName}`);
      console.log(`Action: ${action}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      if (data) {
        console.log('Data:', data);
      }
      console.trace('Call stack');
      console.groupEnd();

      // Emit custom event for debug panel
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('analytics-debug', {
          detail: {
            pixel: pixelName,
            action,
            data,
            timestamp: new Date().toISOString(),
          }
        }));
      }
    }
  };

  const debugInit = (pixelName: string, id: string) => {
    debug(pixelName, 'INIT', { id, enabled: !!id });
  };

  const debugEvent = (pixelName: string, eventName: string, data?: any) => {
    debug(pixelName, `EVENT: ${eventName}`, data);
  };

  return {
    debug,
    debugInit,
    debugEvent,
    isDebugEnabled: debugTracking,
  };
} 