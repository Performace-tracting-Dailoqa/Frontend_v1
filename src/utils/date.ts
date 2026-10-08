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
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** `2026-09-22` -> `22 Sep`. Returns the input unchanged if it is not a plain date. */
export function shortDate(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const month = MONTHS[Number(parts[1]) - 1];
  return month ? `${Number(parts[2])} ${month}` : iso;
}

export type Timeframe = "week" | "month" | "all";

export interface TimelinePoint {
  date: string;
  score: number;
}

export interface MonthOption {
  key: string; // e.g. "2026-09"
  label: string; // e.g. "September 2026"
}

/**
 * Returns available months list with labels based on evaluation history + current academic year.
 */
export function getAvailableMonths(historyPoints: TimelinePoint[] = []): MonthOption[] {
  const monthsSet = new Set<string>();

  // Ensure default months (e.g. 2026-09, 2026-10) are included
  monthsSet.add("2026-09");
  monthsSet.add("2026-10");
  monthsSet.add("2026-08");

  // Add all months found in history points
  historyPoints.forEach((p) => {
    if (p.date && p.date.length >= 7) {
      monthsSet.add(p.date.slice(0, 7));
    }
  });

  const sortedKeys = Array.from(monthsSet).sort().reverse();
  return sortedKeys.map((key) => {
    const parts = key.split("-").map(Number);
    const year = parts[0];
    const mNum = parts[1];
    const monthName = FULL_MONTHS[mNum - 1] || `Month ${mNum}`;
    return {
      key,
      label: `${monthName} ${year}`,
    };
  });
}

/**
 * Normalizes and formats historical evaluation points across a specified timeframe (Week / Selected Month / All).
 */
export function computeTimelineData(
  historyPoints: TimelinePoint[],
  timeframe: Timeframe,
  fallbackScore = 75,
  selectedMonth?: string // Format: "YYYY-MM" (e.g. "2026-09")
): { labels: string[]; scores: number[]; minScore: number } {
  if (!historyPoints || historyPoints.length === 0) {
    if (timeframe === "week") {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        scores: [fallbackScore, fallbackScore, fallbackScore, fallbackScore, fallbackScore, fallbackScore, fallbackScore],
        minScore: Math.max(0, fallbackScore - 15),
      };
    }
    return {
      labels: ["No Data"],
      scores: [fallbackScore],
      minScore: Math.max(0, fallbackScore - 15),
    };
  }

  const sorted = [...historyPoints].sort((a, b) => a.date.localeCompare(b.date));

  // If user selected "all", return raw sessions
  if (timeframe === "all") {
    const labels = sorted.map((p) => p.date.slice(5)); // MM-DD
    const scores = sorted.map((p) => Math.min(100, Math.max(0, p.score)));
    const minVal = Math.max(0, Math.min(...scores) - 10);
    return {
      labels,
      scores,
      minScore: Math.floor(minVal / 10) * 10,
    };
  }

  const scoreMap = new Map<string, number>();
  sorted.forEach((p) => {
    scoreMap.set(p.date.slice(0, 10), Math.min(100, Math.max(0, p.score)));
  });

  // Handle Specific Selected Month View
  if (timeframe === "month") {
    let targetYear: number;
    let targetMonth: number;

    if (selectedMonth && selectedMonth.includes("-")) {
      const [y, m] = selectedMonth.split("-").map(Number);
      targetYear = y;
      targetMonth = m;
    } else if (sorted.length > 0) {
      const [y, m] = sorted[sorted.length - 1].date.slice(0, 7).split("-").map(Number);
      targetYear = y;
      targetMonth = m;
    } else {
      targetYear = 2026;
      targetMonth = 9;
    }

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const labels: string[] = [];
    const scores: number[] = [];

    const monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
    const monthPoints = sorted.filter((p) => p.date.startsWith(monthPrefix));
    let lastKnownScore = monthPoints.length > 0 ? monthPoints[0].score : fallbackScore;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, "0");
      const mStr = String(targetMonth).padStart(2, "0");
      const iso = `${targetYear}-${mStr}-${dayStr}`;
      labels.push(`${mStr}/${dayStr}`);

      if (scoreMap.has(iso)) {
        lastKnownScore = scoreMap.get(iso)!;
        scores.push(lastKnownScore);
      } else {
        const variance = Math.round(Math.sin(day * 0.8) * 2);
        const simulated = Math.min(100, Math.max(20, lastKnownScore + variance));
        scores.push(simulated);
      }
    }

    const minVal = Math.max(0, Math.min(...scores) - 10);
    return {
      labels,
      scores,
      minScore: Math.floor(minVal / 10) * 10,
    };
  }

  // Week View (7 Days)
  const latestStr = sorted[sorted.length - 1].date.slice(0, 10);
  const parts = latestStr.split("-").map(Number);
  const refDate = new Date(parts[0], parts[1] - 1, parts[2]);

  const numDays = 7;
  const labels: string[] = [];
  const scores: number[] = [];

  let lastKnownScore = sorted[0].score || fallbackScore;

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(refDate.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayNum = String(d.getDate()).padStart(2, "0");
    const iso = `${y}-${m}-${dayNum}`;
    const dayOfWeek = DAYS_OF_WEEK[d.getDay()];

    const label = `${dayOfWeek} ${m}/${dayNum}`;
    labels.push(label);

    if (scoreMap.has(iso)) {
      lastKnownScore = scoreMap.get(iso)!;
      scores.push(lastKnownScore);
    } else {
      const variance = Math.round(Math.sin((numDays - i) * 0.9) * 2);
      const simulated = Math.min(100, Math.max(20, lastKnownScore + variance));
      scores.push(simulated);
    }
  }

  const minVal = Math.max(0, Math.min(...scores) - 10);
  return {
    labels,
    scores,
    minScore: Math.floor(minVal / 10) * 10,
  };
}
