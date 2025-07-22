import { useState, useEffect } from 'react';
import { useAnalyticsEnv } from '~/hooks/use-analytics-env';

export function AnalyticsDebugPanel() {
  const { debugTracking } = useAnalyticsEnv();
  const [isVisible, setIsVisible] = useState(false);
  const [events, setEvents] = useState<Array<{
    timestamp: string;
    pixel: string;
    action: string;
    data?: any;
  }>>([]);

  useEffect(() => {
    // Listen for custom analytics debug events
    const handleDebugEvent = (event: CustomEvent) => {
      setEvents(prev => [
        ...prev.slice(-19), // Keep last 20 events
        {
          timestamp: new Date().toLocaleTimeString(),
          pixel: event.detail.pixel,
          action: event.detail.action,
          data: event.detail.data,
        }
      ]);
    };

    window.addEventListener('analytics-debug' as any, handleDebugEvent);
    return () => window.removeEventListener('analytics-debug' as any, handleDebugEvent);
  }, []);

  const toggleDebug = () => {
    const currentState = localStorage.getItem('debug_analytics') === 'true';
    localStorage.setItem('debug_analytics', (!currentState).toString());
    window.location.reload();
  };

  const clearEvents = () => {
    setEvents([]);
  };

  // Only show in development or when debug is enabled
  if (process.env.NODE_ENV === 'production' && !debugTracking) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: debugTracking ? '#22c55e' : '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        title="Toggle Analytics Debug Panel"
      >
        📊
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '400px',
            maxHeight: '500px',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #333',
            borderRadius: '8px',
            zIndex: 9998,
            fontFamily: 'monospace',
            fontSize: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #333',
              backgroundColor: '#2a2a2a',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong>Analytics Debug</strong>
            <div>
              <button
                onClick={toggleDebug}
                style={{
                  backgroundColor: debugTracking ? '#ef4444' : '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  marginRight: '8px',
                  cursor: 'pointer',
                }}
              >
                {debugTracking ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={clearEvents}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  marginRight: '8px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Events List */}
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '8px',
            }}
          >
            {events.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                No events captured yet
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '8px',
                    padding: '8px',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '4px',
                    borderLeft: '3px solid #3b82f6',
                  }}
                >
                  <div style={{ color: '#60a5fa', marginBottom: '4px' }}>
                    {event.timestamp} - {event.pixel}
                  </div>
                  <div style={{ color: '#fbbf24', marginBottom: '4px' }}>
                    {event.action}
                  </div>
                  {event.data && (
                    <details style={{ marginTop: '4px' }}>
                      <summary style={{ cursor: 'pointer', color: '#a78bfa' }}>
                        Data
                      </summary>
                      <pre
                        style={{
                          marginTop: '4px',
                          padding: '8px',
                          backgroundColor: '#1a1a1a',
                          borderRadius: '4px',
                          overflow: 'auto',
                          fontSize: '10px',
                          color: '#e5e7eb',
                        }}
                      >
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
} 