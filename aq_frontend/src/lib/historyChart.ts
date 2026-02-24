export type ChartPoint = {
  date: string;
  aqi: number;
};

function dayKeyUTC(ts: number) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export function toDailyAqiSeries(items: { timestamp_unix: number; aqi_ow_1_5: number }[]): ChartPoint[] {
  const buckets = new Map<string, { sum: number; n: number }>();

  for (const it of items) {
    const key = dayKeyUTC(it.timestamp_unix);
    const prev = buckets.get(key) ?? { sum: 0, n: 0 };
    buckets.set(key, { sum: prev.sum + it.aqi_ow_1_5, n: prev.n + 1 });
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, aqi: Math.round(v.sum / v.n) }));
}