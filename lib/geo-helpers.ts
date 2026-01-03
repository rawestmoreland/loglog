import axios from 'axios';

export async function getReverseGeoDataFromCoords({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<{ city: string; country: string; timezone: string } | null> {
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

    const city = response.data.features?.[0]?.properties?.name ?? 'Unknown';
    const country =
      response.data.features?.[0]?.properties?.country ?? 'Unknown';
    return { city, country, timezone: zoneName };
  } catch (error) {
    // More detailed error logging
    console.error('Failed to fetch city from coords:', error);
    return null;
  }
}

export function shiftCoords(coords: { lat: number; lon: number }): {
  latShift: number;
  lonShift: number;
} {
  // Randomly shift coordinates within 2km for privacy
  const randomAngle = Math.random() * 2 * Math.PI; // Random angle in radians
  const randomDistance = Math.random() * 2000; // Random distance up to 2km in meters

  // Convert distance to approximate lat/lon shifts (rough approximation)
  // 111,111 meters = 1 degree of latitude
  // cos(lat) * 111,111 = meters per degree longitude at given latitude
  const latShift = (randomDistance * Math.cos(randomAngle)) / 111111;
  const lonShift =
    (randomDistance * Math.sin(randomAngle)) /
    (111111 * Math.cos(((coords?.lat ?? 0) * Math.PI) / 180));

  return { latShift, lonShift };
}
