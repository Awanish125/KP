/**
 * Thin singleton bridge so PinnedHero can drive WebGL uniforms on HeroSection
 * without coupling the two components.
 */
export const heroUniformBridge: {
  setZoom:    ((v: number) => void) | null;
  setOffsetX: ((v: number) => void) | null;
} = {
  setZoom:    null,
  setOffsetX: null,
};
