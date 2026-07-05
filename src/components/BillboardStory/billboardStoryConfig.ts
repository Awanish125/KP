import storyData from "@/data/billboardStory.json";
import type { BillboardStoryConfig, StoryStep } from "./billboardStoryTypes";

export const BILLBOARD_STORY_DEFAULTS: BillboardStoryConfig = {
  label: storyData.label,
  heading: storyData.heading,
  // 0.5vh per step keeps the pin tight — long pins read as a frozen page.
  vhPerStep: 0.5,
  flipDuration: 1.15,
};

export const BILLBOARD_STORY_STEPS: StoryStep[] = storyData.steps;
