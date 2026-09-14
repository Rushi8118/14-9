import * as THREE from 'three'

/** Radius of the globe in scene units. Every other size in the scene is relative to it. */
export const GLOBE_RADIUS = 1.6

export const COLORS = {
  deep: '#050d2a',
  mid: '#0d2366',
  royal: '#2f5bff',
  violet: '#7a5cff',
  cyan: '#46dcf7',
  gold: '#f0c064',
} as const

export type Destination = {
  id: string
  name: string
  lat: number
  lng: number
  accent?: 'gold' | 'cyan'
}

/** Origin (gold) plus the destinations our clients most often relocate to. */
export const DESTINATIONS: Destination[] = [
  { id: 'in', name: 'Surat, India', lat: 21.17, lng: 72.83, accent: 'gold' },
  { id: 'ca', name: 'Toronto, Canada', lat: 43.65, lng: -79.38 },
  { id: 'uk', name: 'London, United Kingdom', lat: 51.51, lng: -0.13 },
  { id: 'de', name: 'Berlin, Germany', lat: 52.52, lng: 13.4 },
  { id: 'au', name: 'Sydney, Australia', lat: -33.87, lng: 151.21 },
  { id: 'ae', name: 'Dubai, UAE', lat: 25.2, lng: 55.27 },
  { id: 'jp', name: 'Tokyo, Japan', lat: 35.68, lng: 139.69 },
  { id: 'us', name: 'New York, United States', lat: 40.71, lng: -74.01 },
  { id: 'nz', name: 'Auckland, New Zealand', lat: -36.85, lng: 174.76 },
]

/** Journeys drawn as animated arcs: [from, to] destination ids. */
export const ROUTES: ReadonlyArray<readonly [string, string]> = [
  ['in', 'ca'],
  ['in', 'uk'],
  ['in', 'de'],
  ['in', 'au'],
  ['in', 'ae'],
  ['in', 'jp'],
  ['in', 'us'],
  ['in', 'nz'],
]

/** Converts latitude/longitude in degrees to a point on (or above) the sphere. */
export function latLngToVector3(lat: number, lng: number, radius = GLOBE_RADIUS, target = new THREE.Vector3()) {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lng + 180)
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

/**
 * Stylised continent outlines as [longitude, latitude] rings. They are deliberately
 * approximate — an abstract map drawn for this page, not geographic data — so the
 * "world map" costs nothing to download and needs no texture.
 */
const LANDMASSES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  // North America
  [[-168, 65], [-140, 70], [-95, 72], [-75, 62], [-55, 50], [-66, 44], [-80, 25], [-97, 18], [-83, 9], [-105, 20], [-117, 32], [-125, 48], [-135, 58], [-160, 58]],
  // Greenland
  [[-55, 60], [-20, 70], [-25, 82], [-60, 80], [-72, 76]],
  // South America
  [[-80, 10], [-60, 11], [-35, -5], [-40, -22], [-55, -35], [-68, -55], [-75, -45], [-72, -18], [-81, -5]],
  // Europe
  [[-10, 36], [3, 43], [-5, 48], [-2, 59], [10, 64], [28, 71], [40, 67], [45, 45], [28, 41], [20, 38], [12, 44], [5, 43]],
  // Great Britain & Ireland
  [[-10, 51.5], [-6, 50], [2, 51], [-2, 58.5], [-7, 57.5], [-10, 54]],
  // Africa
  [[-17, 21], [-6, 36], [11, 37], [33, 31], [43, 12], [51, 11], [40, -3], [40, -16], [33, -27], [20, -35], [12, -18], [9, 4], [-8, 4], [-17, 14]],
  // Madagascar
  [[43, -12], [50, -15], [48, -25], [44, -24]],
  // Arabian Peninsula
  [[36, 30], [44, 13], [52, 15], [59, 22], [56, 26], [48, 30]],
  // Asia
  [[45, 45], [40, 67], [70, 73], [110, 77], [140, 72], [180, 68], [160, 58], [142, 46], [122, 40], [121, 22], [108, 10], [100, 2], [98, 16], [80, 8], [72, 20], [57, 25], [48, 30], [36, 36]],
  // Japan
  [[130, 31], [141, 34], [146, 44], [140, 45], [135, 35]],
  // Maritime Southeast Asia
  [[95, 5], [120, -2], [141, -3], [140, -9], [115, -9], [105, -7]],
  // Australia
  [[114, -22], [122, -34], [140, -38], [150, -37], [153, -26], [143, -11], [131, -12], [122, -17]],
  // New Zealand
  [[166, -46], [175, -41], [178, -37], [172, -34]],
]

function insideRing(lng: number, lat: number, ring: ReadonlyArray<readonly [number, number]>) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** True when a latitude/longitude falls on one of the stylised landmasses. */
export function isLand(lat: number, lng: number) {
  if (lat < -70) return true // Antarctica as a soft band of dots
  return LANDMASSES.some((ring) => insideRing(lng, lat, ring))
}
