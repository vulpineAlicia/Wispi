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

// returns true if two lat/lon pairs refer to the same location
export function coordsMatch(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): boolean {
  return Math.abs(lat1 - lat2) < 0.001 && Math.abs(lon1 - lon2) < 0.001;
}

export function buildMapUrl(selection: {
  lat: number;
  lon: number;
  name?: string;
  country?: string;
}) {
  const params = new URLSearchParams({
    lat: String(selection.lat),
    lon: String(selection.lon),
  });

  if (selection.name) {
    params.set("name", selection.name);
  }

  if (selection.country) {
    params.set("country", selection.country);
  }

  return `/map?${params.toString()}`;
}