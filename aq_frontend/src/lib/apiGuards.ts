import type {
  AirData,
  AirHistoryItem,
  AirHistoryResponse,
  GeoResult,
} from "./apiTypes";

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function isNumberRecord(v: unknown): v is Record<string, number> {
  if (!isRecord(v)) return false;
  return Object.values(v).every(isFiniteNumber);
}

export function isLocation(v: unknown): v is { lat: number; lon: number } {
  return isRecord(v) && isFiniteNumber(v.lat) && isFiniteNumber(v.lon);
}

export function isGeoResult(v: unknown): v is GeoResult {
  return (
    isRecord(v) &&
    typeof v.name === "string" &&
    typeof v.country === "string" &&
    isFiniteNumber(v.lat) &&
    isFiniteNumber(v.lon) &&
    (v.state === undefined || v.state === null || typeof v.state === "string")
  );
}

export function isAirData(v: unknown): v is AirData {
  return (
    isRecord(v) &&
    isLocation(v.location) &&
    isFiniteNumber(v.timestamp_unix) &&
    isFiniteNumber(v.aqi_ow_1_5) &&
    isNumberRecord(v.pollutants) &&
    typeof v.source === "string"
  );
}

export function isAirHistoryItem(v: unknown): v is AirHistoryItem {
  return (
    isRecord(v) &&
    isFiniteNumber(v.timestamp_unix) &&
    isFiniteNumber(v.aqi_ow_1_5) &&
    isNumberRecord(v.pollutants)
  );
}

export function isAirHistoryResponse(v: unknown): v is AirHistoryResponse {
  return (
    isRecord(v) &&
    isLocation(v.location) &&
    isFiniteNumber(v.start_unix) &&
    isFiniteNumber(v.end_unix) &&
    Array.isArray(v.items) &&
    v.items.every(isAirHistoryItem) &&
    typeof v.source === "string"
  );
}