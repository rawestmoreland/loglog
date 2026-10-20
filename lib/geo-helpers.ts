import axios from 'axios';

export async function getReverseGeoDataFromCoords({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<{ city: string; country: string; region: string | null; timezone: string } | null> {
  try {
    // Ensure we're using https
    const url = `${process.env.EXPO_PUBLIC_MAPBOX_API_URL}/reverse?longitude=${longitude}&latitude=${latitude}&types=place&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

    const { data: { zoneName = 'Unknown' } = { zoneName: 'Unknown' } } =
      await axios.get(
        `${process.env.EXPO_PUBLIC_TIMEZONEDB_URL}/v2.1/get-time-zone?key=${process.env.EXPO_PUBLIC_TIMEZONEDB_KEY}&by=position&lat=${latitude}&lng=${longitude}&format=json`
      );

    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch city from coords: ${response.status} ${response.statusText}`
      );
    }

    const props = response.data.features?.[0]?.properties;
    const city = props?.name ?? 'Unknown';
    const country = props?.context?.country?.name ?? props?.country ?? 'Unknown';
    const region = props?.context?.region?.name ?? null;
    return { city, country, region, timezone: zoneName };
  } catch (error) {
    // More detailed error logging
    console.error('Failed to fetch city from coords:', error);
    return null;
  }
}

export type Bounds = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

/**
 * Snap a viewport to a power-of-two degree grid, rounding outwards. The result
 * always contains the viewport, is at most ~2x its size, and only changes when
 * an edge crosses a grid line, so small pans keep hitting the same query key.
 */
export function snapBounds(bounds: Bounds): Bounds {
  const span = Math.max(
    bounds.maxLon - bounds.minLon,
    bounds.maxLat - bounds.minLat,
    1e-4
  );
  const step = 2 ** Math.floor(Math.log2(span / 2));
  const clamp = (v: number, limit: number) =>
    Math.min(limit, Math.max(-limit, v));

  return {
    minLon: clamp(Math.floor(bounds.minLon / step) * step, 180),
    minLat: clamp(Math.floor(bounds.minLat / step) * step, 90),
    maxLon: clamp(Math.ceil(bounds.maxLon / step) * step, 180),
    maxLat: clamp(Math.ceil(bounds.maxLat / step) * step, 90),
  };
}

export function boundsEqual(a: Bounds | null, b: Bounds | null): boolean {
  return (
    a === b ||
    (!!a &&
      !!b &&
      a.minLon === b.minLon &&
      a.minLat === b.minLat &&
      a.maxLon === b.maxLon &&
      a.maxLat === b.maxLat)
  );
}

/** PocketBase filter clause restricting `coords` (a geoPoint) to a bounding box. */
export function boundsFilter(bounds: Bounds): string {
  return `coords.lat >= ${bounds.minLat} && coords.lat <= ${bounds.maxLat} && coords.lon >= ${bounds.minLon} && coords.lon <= ${bounds.maxLon}`;
}

// mulberry32 seeded from an FNV-1a hash of the string
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random offset within 2km for privacy. Pass a seed (e.g. the sesh id) to get
 * the same offset every time, so pins don't move between fetches.
 */
export function shiftCoords(
  coords: { lat: number; lon: number },
  seed?: string
): {
  latShift: number;
  lonShift: number;
} {
  const random = seed ? seededRandom(seed) : Math.random;
  const randomAngle = random() * 2 * Math.PI; // Random angle in radians
  const randomDistance = random() * 2000; // Random distance up to 2km in meters

  // Convert distance to approximate lat/lon shifts (rough approximation)
  // 111,111 meters = 1 degree of latitude
  // cos(lat) * 111,111 = meters per degree longitude at given latitude
  const latShift = (randomDistance * Math.cos(randomAngle)) / 111111;
  const lonShift =
    (randomDistance * Math.sin(randomAngle)) /
    (111111 * Math.cos(((coords?.lat ?? 0) * Math.PI) / 180));

  return { latShift, lonShift };
}

/**
 * Returns the sesh with its coords shifted if its owner has `shift_logs` on.
 * Deterministic per sesh id; does not mutate the input.
 */
export function applyPrivacyShift<
  T extends {
    id?: string;
    coords?: { lat: number; lon: number };
    expand?: any;
  },
>(sesh: T): T {
  if (!sesh.coords || !sesh.expand?.poo_profile?.shift_logs) {
    return sesh;
  }
  const { latShift, lonShift } = shiftCoords(sesh.coords, sesh.id);
  return {
    ...sesh,
    coords: {
      ...sesh.coords,
      lat: sesh.coords.lat + latShift,
      lon: sesh.coords.lon + lonShift,
    },
  };
}
