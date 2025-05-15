import axios from 'axios';

export async function getCityFromCoords({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  try {
    // Ensure we're using https
    const url = `${process.env.EXPO_PUBLIC_MAPBOX_API_URL}/reverse?longitude=${longitude}&latitude=${latitude}&types=place&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch city from coords: ${response.status} ${response.statusText}`
      );
    }

    const data = response.data.features?.[0]?.properties?.name ?? 'Unknown';
    return data;
  } catch (error) {
    // More detailed error logging
    console.error('Failed to fetch city from coords:', error);
    return null;
  }
}
