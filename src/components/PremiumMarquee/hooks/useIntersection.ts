import { RefObject, useState, useEffect } from 'react';

// Watches a ref with IntersectionObserver and returns whether it is visible.
// Hooks that are expensive to run every frame (useCenterHighlight, useEntranceAnimation)
// use this so they pause when the marquee is scrolled off-screen.
export function useIntersection(
  ref: RefObject<Element | null>,
  options: IntersectionObserverInit = {},
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05, ...options },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}
