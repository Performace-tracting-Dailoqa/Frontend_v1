/**
 * Locale-free date formatting.
 *
 * These deliberately avoid `toLocaleDateString` / `Intl`. Both resolve against
 * the *runtime's* locale and time zone, so the same render produces different
 * text in Node and in the browser. In a server component that is a hydration
 * mismatch, and in these pages it would silently disagree with the chart.
 *
 * The API sends dates as `YYYY-MM-DD` strings, so the text is sliced rather than
 * parsed: a `Date` would also drag the value through a local time zone and can
 * shift the day across midnight.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-09-22` -> `22 Sep`. Returns the input unchanged if it is not a plain date. */
export function shortDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const month = MONTHS[Number(parts[1]) - 1];
  return month ? `${Number(parts[2])} ${month}` : iso;
}
