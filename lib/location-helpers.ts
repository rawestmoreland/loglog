/**
 * Validates if the provided location coordinates are valid (not 0,0).
 * Returns false if coordinates are 0,0 which indicates location is unavailable.
 */
export function isValidLocation(location: {
  lat: number;
  lon: number;
}): boolean {
  return location.lat !== 0 || location.lon !== 0;
}
