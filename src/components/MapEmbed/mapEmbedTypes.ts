export interface MapSite {
  name: string;
  city: string;
  lat: number;
  lng: number;
  type: string;
  count: number;
  image: string;
}

export interface MapEmbedConfig {
  /** Geographic bounds the SVG projects (Maharashtra + padding). */
  bounds: { north: number; south: number; west: number; east: number };
  /** SVG viewBox size. */
  width: number;
  height: number;
  /** Pin color per site type — CSS color values (tokens). */
  typeColors: Record<string, string>;
}

export interface MapEmbedProps extends Partial<MapEmbedConfig> {
  sites: MapSite[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}
