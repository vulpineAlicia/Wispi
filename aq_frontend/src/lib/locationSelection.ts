export type LocationSelection = {
  lat: number;
  lon: number;
  name: string;
  country?: string;
};

export function parseNumberOrNull(value: string | null): number | null {
  if (value == null) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function getLocationSelectionFromParams(
  params: URLSearchParams,
  fallbackName = ""
): LocationSelection | null {
  const lat = parseNumberOrNull(params.get("lat"));
  const lon = parseNumberOrNull(params.get("lon"));
  const rawName = (params.get("name") ?? "").trim();
  const rawCountry = (params.get("country") ?? "").trim();

  if (lat == null || lon == null) return null;

  return {
    lat,
    lon,
    name: rawName || fallbackName,
    country: rawCountry || undefined,
  };
}