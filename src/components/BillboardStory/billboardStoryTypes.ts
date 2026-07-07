export interface StoryStep {
  kicker: string;
  title: string;
  body: string;
  /** Image URL/path or .mp4/.webm video — videos auto-play muted. */
  media: string;
  stat?: { value: string; label: string };
}

export interface BillboardStoryConfig {
  label: string;
  heading: string;
  /** Scroll length per step, in viewport-heights. */
  vhPerStep: number;
  /** Board flip duration in seconds. */
  flipDuration: number;
}

export interface BillboardStoryProps extends Partial<BillboardStoryConfig> {
  steps: StoryStep[];
  className?: string;
  /** Skip sticky scroll + 3D billboard — renders as a clean step grid. */
  staticMode?: boolean;
}

export interface BillboardSceneProps {
  steps: StoryStep[];
  /** Controlled by the parent's scroll ticker. */
  stepIndex: number;
  flipDuration: number;
  onReady: () => void;
}

/** True when the media path is a video file. */
export function isVideoMedia(media: string): boolean {
  return /\.(mp4|webm|ogv)(\?|$)/i.test(media);
}
