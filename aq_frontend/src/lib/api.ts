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

/* JSON helper */
async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...init,
  });

  if (!res.ok) {
    throw new Error("Request failed");
  }

  return (await res.json()) as T;
}

/* Server status pill */
export async function checkHealth(): Promise<boolean> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2500);

  try {
    const data = await getJson<{ status?: string }>("/health", {
      signal: controller.signal,
    });
    return data.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/* City lookup */
export async function geocodeCity(q: string): Promise<GeoResult[]> {
  const data = await getJson<{ results?: GeoResult[] }>(
    `/geocode?q=${encodeURIComponent(q)}`
  );
  return data.results ?? [];
}

/* Air quality */
export async function getAirCurrent(lat: number, lon: number): Promise<AirData> {
  return await getJson<AirData>(`/air/current?lat=${lat}&lon=${lon}`);
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

  return await getJson<AirHistoryResponse>(`/air/history?${qs.toString()}`);
}