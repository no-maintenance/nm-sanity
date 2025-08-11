import { useEffect } from 'react';

/**
 * Custom hook that triggers a callback when the escape key is pressed
 * @param callback - Function to call when escape key is pressed
 * @param enabled - Whether the hook should be active (default: true)
 */
export function useEscapeKey(callback: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback, enabled]);
}