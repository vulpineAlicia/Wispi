import { getJson, invalidResponse } from "./apiClient";
import {
  isAirData,
  isAirHistoryResponse,
  isGeoResult,
  isRecord,
} from "./apiGuards";
import type {
  AirData,
  AirHistoryResponse,
  GeoResult,
} from "./apiTypes";

export type {
  GeoResult,
  AirData,
  AirHistoryItem,
  AirHistoryResponse,
} from "./apiTypes";

export async function checkHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const data = await getJson<{ status?: unknown }>("/health", {
      signal: controller.signal,
    });

    return isRecord(data) && data.status === "ok";
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeCity(
  q: string,
  signal?: AbortSignal
): Promise<GeoResult[]> {
  const data = await getJson<unknown>(
    `/geocode?q=${encodeURIComponent(q)}`,
    { signal }
  );

  if (!isRecord(data) || !Array.isArray(data.results)) {
    throw invalidResponse("Server returned an invalid geocoding response.");
  }

  if (!data.results.every(isGeoResult)) {
    throw invalidResponse("Server returned an invalid geocoding response.");
  }

  return data.results;
}

export async function getAirCurrent(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<AirData> {
  const data = await getJson<unknown>(`/air/current?lat=${lat}&lon=${lon}`, {
    signal,
  });

  if (!isAirData(data)) {
    throw invalidResponse("Server returned an invalid air quality response.");
  }

  return data;
}

export async function getAirHistory(
  lat: number,
  lon: number,
  days: number,
  end_unix?: number,
  signal?: AbortSignal
): Promise<AirHistoryResponse> {
  const qs = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    days: String(days),
  });

  if (end_unix != null) {
    qs.set("end_unix", String(end_unix));
  }

  const data = await getJson<unknown>(`/air/history?${qs.toString()}`, {
    signal,
  });

  if (!isAirHistoryResponse(data)) {
    throw invalidResponse("Server returned an invalid history response.");
  }

  return data;
}