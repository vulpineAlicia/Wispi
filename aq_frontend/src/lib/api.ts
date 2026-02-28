import { ApiError } from "./apiError";

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

// helpers

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function safeReadJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getHeaderRequestId(res: Response): string | undefined {
  return res.headers.get("x-request-id") ?? res.headers.get("X-Request-Id") ?? undefined;
}

// cache

type CacheEntry = { at: number; value: unknown };

const inFlight = new Map<string, Promise<unknown>>();
const cache = new Map<string, CacheEntry>();

function buildKey(path: string, init?: RequestInit): string {
  const method = (init?.method ?? "GET").toUpperCase();
  return `${method} ${API_BASE}${path}`;
}

function getCached<T>(key: string, ttlMs: number): T | null {
  if (ttlMs <= 0) return null;
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) {
    cache.delete(key);
    return null;
  }
  return hit.value as T;
}

function setCached(key: string, value: unknown) {
  cache.set(key, { at: Date.now(), value });
}

// JSON helper

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      ...init,
    });
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0, "NETWORK_ERROR");
  }

  const headerRid = getHeaderRequestId(res);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    let requestId: string | undefined = headerRid;

    const body = await safeReadJson(res);
    if (isRecord(body)) {
      if (typeof body.message === "string") message = body.message;
      if (typeof body.code === "string") code = body.code;
      if (typeof body.request_id === "string") requestId = body.request_id;
    }

    code ??= `HTTP_${res.status}`;
    throw new ApiError(message, res.status, code, requestId);
  }

  return (await res.json()) as T;
}


// if a same request is already running -> reuse it

async function getJsonDedupe<T>(
  path: string,
  init?: RequestInit,
  opts?: { ttlMs?: number }
): Promise<T> {
  const key = buildKey(path, init);
  const ttlMs = opts?.ttlMs ?? 0;

  const cached = getCached<T>(key, ttlMs);
  if (cached !== null) return cached;

  const running = inFlight.get(key);
  if (running) return (await running) as T;

  const p = (async () => {
    const data = await getJson<T>(path, init);
    if (ttlMs > 0) setCached(key, data);
    return data;
  })();

  inFlight.set(key, p as Promise<unknown>);

  try {
    return await p;
  } finally {
    inFlight.delete(key);
  }
}

// api calls

/* Server status pill */
export async function checkHealth(): Promise<boolean> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2500);

  try {
    const data = await getJsonDedupe<{ status?: string }>(
      "/health",
      { signal: controller.signal },
      { ttlMs: 1500 }
    );
    return data.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/* City lookup */
export async function geocodeCity(q: string): Promise<GeoResult[]> {
  const data = await getJsonDedupe<{ results?: GeoResult[] }>(
    `/geocode?q=${encodeURIComponent(q)}`,
    undefined,
    { ttlMs: 0 }
  );
  return data.results ?? [];
}

/* Air quality */
export async function getAirCurrent(lat: number, lon: number): Promise<AirData> {
  return await getJsonDedupe<AirData>(`/air/current?lat=${lat}&lon=${lon}`, undefined, {
    ttlMs: 1500,
  });
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

  return await getJsonDedupe<AirHistoryResponse>(`/air/history?${qs.toString()}`, undefined, {
    ttlMs: 5000,
  });
}

// error mapping

export function getUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      // client
      case "INVALID_QUERY":
      case "HTTP_400":
      case "HTTP_422":
        return "Please enter a valid city name.";

      case "NO_AIR_DATA":
        return "No air quality data for this location.";

      case "NO_HISTORY_DATA":
        return "No history data for this location.";

      // upstream
      case "RATE_LIMIT":
      case "HTTP_429":
        return "Too many requests right now. Please try again in a minute.";

      case "UPSTREAM_TIMEOUT":
        return "The provider is taking too long to respond. Try again.";

      case "UPSTREAM_NETWORK":
      case "NETWORK_ERROR":
        return "Network error. Please check your connection and try again.";

      case "UPSTREAM_5XX":
      case "UPSTREAM_UNAVAILABLE":
        return "The data provider is temporarily unavailable. Please try again later.";

      default:
        if (error.status === 0) return "Network error. Please check your connection.";
        if (error.status === 404) return "Not found.";
        if (error.status === 429) return "Too many requests. Try again soon.";
        if (error.status >= 500) return "Server error. Please try again later.";
        return error.message || "Something went wrong.";
    }
  }

  if (error instanceof TypeError) {
    return "Network error. Please check your connection.";
  }

  if (error instanceof Error) {
    return error.message || "Something went wrong.";
  }

  return "Unexpected error occurred.";
}