import type { RefObject } from "react";

export type HeroVideoSource = {
  light: string;
  dark: string;
};

export type HeroSectionRefs = {
  sectionRef: RefObject<HTMLElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  raysRef: RefObject<HTMLDivElement | null>;
  particlesRef: RefObject<HTMLDivElement | null>;
  glowRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  headlineRef: RefObject<HTMLHeadingElement | null>;
  subtitleRef: RefObject<HTMLParagraphElement | null>;
  buttonsRef: RefObject<HTMLDivElement | null>;
  scrollIndicatorRef: RefObject<HTMLDivElement | null>;
  nextSectionRef: RefObject<HTMLElement | null>;
};

export type HeroContentProps = Pick<
  HeroSectionRefs,
  "contentRef" | "headlineRef" | "subtitleRef" | "buttonsRef"
>;

export type HeroLayerProps = Pick<
  HeroSectionRefs,
  "frameRef" | "videoRef"
> & {
  src: string;
};

export type HeroOverlayProps = Pick<
  HeroSectionRefs,
  "overlayRef" | "raysRef" | "particlesRef" | "glowRef"
>;

export type HeroIndicatorProps = Pick<HeroSectionRefs, "scrollIndicatorRef">;

export type HeroNextSectionProps = Pick<HeroSectionRefs, "nextSectionRef">;

export type HeroAnimationRefs = Pick<
  HeroSectionRefs,
  | "sectionRef"
  | "viewportRef"
  | "frameRef"
  | "videoRef"
  | "overlayRef"
  | "raysRef"
  | "particlesRef"
  | "glowRef"
  | "contentRef"
  | "headlineRef"
  | "subtitleRef"
  | "buttonsRef"
  | "scrollIndicatorRef"
  | "nextSectionRef"
>;
