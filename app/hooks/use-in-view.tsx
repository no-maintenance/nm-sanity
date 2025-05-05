import { useEffect, useRef, useState } from 'react';

/**
 * useInView - React hook to detect if an element is in the viewport using Intersection Observer.
 * @param options IntersectionObserver options
 * @returns [ref, inView] - ref to attach to the element, and a boolean if it's in view
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  options?: IntersectionObserverInit
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new window.IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      options
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, inView];
} 