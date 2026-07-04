export interface ContactGlobeConfig {
  /** Number of points on the sphere. */
  pointCount: number;
  /** Sphere radius in world units. */
  radius: number;
  /** Marker location (head office region). */
  marker: { lat: number; lng: number };
  /** Max camera parallax offset in world units. */
  parallax: number;
  /** Camera lerp per tick toward the parallax target. */
  lerp: number;
  /** Rotation wobble amplitude (radians) around the marker-facing angle. */
  wobble: number;
}

export interface ContactGlobeProps {
  className?: string;
  /** Height of the canvas area. */
  height?: string;
}

export interface GlobeSceneProps {
  config: ContactGlobeConfig;
  /** Fired after the first frame has rendered. */
  onReady: () => void;
}
