import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function ensureGsapPlugins() {
  if (registered) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export function getHeroScrollDistance(viewportHeight: number) {
  return Math.max(viewportHeight * 2.25, 1800);
}

export function getViewportHeight() {
  return Math.round(window.visualViewport?.height ?? window.innerHeight);
}

export function getHeroScrollRange(
  section: HTMLElement,
  viewport?: HTMLElement | null
) {
  const viewportHeight = viewport?.offsetHeight ?? getViewportHeight();

  return Math.max(section.offsetHeight - viewportHeight, 1);
}

export { gsap, ScrollTrigger };
