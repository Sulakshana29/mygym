/**
 * Formats a Date object or current time to local YYYY-MM-DD string
 * preventing UTC day-shift bugs for local workouts.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the local ISO timestamp string.
 */
export function getLocalTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}
