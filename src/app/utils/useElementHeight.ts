'use client';

import type { RefObject } from "react";
import { useLayoutEffect, useState } from "react";

export function useElementHeight<T extends HTMLElement>(
  ref: RefObject<T | null>
) {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setHeight(Math.round(element.getBoundingClientRect().height));
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return height;
}
