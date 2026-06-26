'use client';

import { useEffect, useState } from "react";

function getBrowserHeight() {
  if (typeof window === "undefined") {
    return 0;
  }

  return Math.round(window.visualViewport?.height ?? window.innerHeight);
}

export function useBrowserHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      setHeight(getBrowserHeight());
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("resize", updateHeight);
    };
  }, []);

  return height;
}
