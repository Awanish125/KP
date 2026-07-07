export interface GlobeSite {
  name: string;
  city: string;
  lat: number;
  lng: number;
  type: string;
  count?: number;
  image?: string;
  /** Optional badge, e.g. "HQ". */
  tag?: string;
}

export interface DottedGlobeConfig {
  /** Sphere radius in world units. */
  radius: number;
  /** Land dot size. */
  dotSize: number;
  /** Marker sphere radius. */
  markerSize: number;
  /** Idle wobble amplitude (radians) around the selected pin. */
  autoRotate: number;
  /** Camera parallax/drag sensitivity. */
  dragSensitivity: number;
  /** Camera distance. */
  cameraZ: number;
}

export interface DottedGlobeProps {
  /** Pins. Add/change entries in src/data/locations.json — no code needed. */
  sites: GlobeSite[];
  /** Controlled selection (-1 or undefined = none). */
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  className?: string;
  height?: string;
  /** Overrides for the scene config. */
  config?: Partial<DottedGlobeConfig>;
}

export interface DottedGlobeSceneProps {
  sites: GlobeSite[];
  selectedIndex: number;
  onSelect?: (index: number) => void;
  config: DottedGlobeConfig;
  onReady: () => void;
}
