import homeData from "@/data/home.json";
import type { VideoShowcaseConfig } from "./videoShowcaseTypes";

export const VIDEO_SHOWCASE_DEFAULTS: VideoShowcaseConfig = {
  label: homeData.showreel?.label ?? "Showreel",
  heading: homeData.showreel?.heading ?? "The network at night.",
  cta: homeData.showreel?.cta ?? "Watch the film",
  src: homeData.showreel?.src ?? "/homepage/herosection/hero-light.mp4",
};
