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

const SEC_TO_MS = 1000;

function dayKeyUTC(tsSec: number): string {
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

    const key = dayKeyUTC(item.timestamp_unix);

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