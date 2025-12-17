/**
 * Validates an airport code (IATA format).
 * Must be exactly 3 uppercase letters (e.g., "LAX", "JFK", "SFO").
 */
export function validateAirportCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

/**
 * Validates a flight number.
 * Common pattern: 2-3 letters followed by 1-4 digits (e.g., "AA123", "BA4567").
 */
export function validateFlightNumber(number: string): boolean {
  return /^[A-Z]{2,3}\d{1,4}$/.test(number);
}

/**
 * Formats a flight route string.
 * Returns a formatted route like "LAX → JFK" or "Unknown route" if data is missing.
 */
export function formatFlightRoute(
  departure?: string,
  arrival?: string
): string {
  if (!departure || !arrival) return 'Unknown route';
  return `${departure} → ${arrival}`;
}
