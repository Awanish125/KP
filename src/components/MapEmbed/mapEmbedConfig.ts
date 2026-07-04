import type { MapEmbedConfig } from "./mapEmbedTypes";

export const MAP_EMBED_DEFAULTS: MapEmbedConfig = {
  bounds: { north: 22.2, south: 15.5, west: 72.5, east: 81.0 },
  width: 840,
  height: 700,
  typeColors: {
    Billboard: "var(--kp-orange)",
    "Digital LED": "var(--kp-blue)",
    Transit: "var(--kp-purple)",
  },
};

/**
 * Simplified Maharashtra boundary as [lat, lng] pairs, clockwise from the
 * northwest coast. Projected with the same function as the site pins, so
 * pins always land in the right spot relative to the outline.
 */
export const MAHARASHTRA_BOUNDARY: [number, number][] = [
  [20.13, 72.75], // NW coast near Talasari
  [20.75, 73.0],  // Gujarat border inland
  [21.3, 73.6],   // Nandurbar west
  [21.75, 74.2],  // north tip, Nandurbar
  [21.4, 74.9],   // Tapti valley dip
  [21.35, 75.6],  // Jalgaon north
  [21.75, 76.2],  // Burhanpur notch (MP border)
  [21.55, 77.0],  // Melghat
  [21.75, 77.6],  // north Amravati
  [21.55, 78.3],  // north of Nagpur
  [21.95, 78.9],  // Nagpur north border
  [21.7, 79.6],   // Bhandara
  [21.65, 80.4],  // NE corner, Gondia
  [21.35, 80.65], // east border
  [20.85, 80.55],
  [20.2, 80.3],   // Gadchiroli east
  [19.9, 80.85],  // easternmost bulge
  [19.0, 80.35],
  [18.7, 80.0],   // southern Gadchiroli
  [19.35, 79.5],  // Chandrapur south
  [19.55, 78.9],
  [19.0, 78.3],   // Telangana border dip
  [18.8, 77.85],  // Nanded east
  [18.4, 77.6],
  [17.85, 77.15], // Latur / Bidar border
  [17.6, 76.6],
  [17.35, 76.0],  // Solapur south
  [16.95, 75.65],
  [16.4, 74.9],   // Kolhapur SE
  [15.75, 74.2],  // near Goa border
  [15.63, 73.85], // southern coastal tip
  [16.05, 73.45], // Konkan coast northward
  [16.55, 73.35],
  [17.3, 73.25],
  [18.0, 73.05],
  [18.65, 72.9],
  [18.95, 72.8],  // Mumbai
  [19.25, 72.78],
  [19.7, 72.7],   // Vasai / Palghar coast
];
