export type Pollutants = Record<string, number>;

export type ChartPoint = {
  date: string;
  aqi: number;
  pollutants?: Pollutants; // for Archive
};

type HistoryItemLike = {
  timestamp_unix: number;
  aqi_ow_1_5: number;
};

type HistoryItemWithPollutants = {
  timestamp_unix: number;
  pollutants?: Pollutants;
};

const SEC_TO_MS = 1000;

export function toDayKeyUTC(tsSec: number): string {
  return new Date(tsSec * SEC_TO_MS).toISOString().slice(0, 10);
}

export function toDailyAqiSeries(items: readonly HistoryItemLike[]): ChartPoint[] {
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const item of items) {
    if (
      !item ||
      typeof item.timestamp_unix !== "number" ||
      typeof item.aqi_ow_1_5 !== "number"
    ) {
      continue;
    }

    const key = toDayKeyUTC(item.timestamp_unix);

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { sum: 0, count: 0 };
      buckets.set(key, bucket);
    }

    bucket.sum += item.aqi_ow_1_5;
    bucket.count += 1;
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({
      date,
      aqi: Math.round(bucket.sum / bucket.count),
    }));
}

export function buildPollutantsByDay(
  items: readonly HistoryItemWithPollutants[]
): Map<string, Pollutants> {
  const result = new Map<string, Pollutants>();

  for (const item of items) {
    const ts = item.timestamp_unix;
    if (typeof ts !== "number") continue;

    const pollutants = item.pollutants;
    if (!pollutants || typeof pollutants !== "object") continue;

    result.set(toDayKeyUTC(ts), pollutants);
  }

  return result;
}