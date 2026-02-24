export type GeoResult = {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
};

export type AirData = {
  aqi_ow_1_5: number;
  pollutants: Record<string, number>;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

/* Server status pill */
export async function checkHealth(): Promise<boolean> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${API_BASE}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { status?: string };
    return data.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/* City lookup */
export async function geocodeCity(q: string): Promise<GeoResult[]> {
  const res = await fetch(`${API_BASE}/geocode?q=${encodeURIComponent(q)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Geocode failed");

  const data = (await res.json()) as { results?: GeoResult[] };
  return data.results ?? [];
}

/* Air quality */
export async function getAirCurrent(lat: number, lon: number): Promise<AirData> {
  const res = await fetch(`${API_BASE}/air/current?lat=${lat}&lon=${lon}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Air fetch failed");

  return (await res.json()) as AirData;
}

/* Air quality history (last N days) */
export type AirHistoryItem = {
  timestamp_unix: number;
  aqi_ow_1_5: number;
  pollutants: Record<string, number>;
};

export type AirHistoryResponse = {
  location: { lat: number; lon: number };
  start_unix: number;
  end_unix: number;
  items: AirHistoryItem[];
  source: string;
};

export async function getAirHistory(
  lat: number,
  lon: number,
  days: number,
  end_unix?: number
): Promise<AirHistoryResponse> {
  const qs = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    days: String(days),
  });

  if (end_unix != null) qs.set("end_unix", String(end_unix));

  const res = await fetch(`${API_BASE}/air/history?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("History fetch failed");

  return (await res.json()) as AirHistoryResponse;
}