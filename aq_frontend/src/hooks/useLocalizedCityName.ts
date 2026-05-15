import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { reverseGeocode } from "../api/api";

const cache = new Map<string, string>();

function cacheKey(lat: number, lon: number, lang: string): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)},${lang}`;
}

/**
 * Returns the city name localized to the current UI language for a known
 * coordinate, falling back to `fallback` until the lookup resolves (or
 * permanently if the lookup fails).
 */
export function useLocalizedCityName(
  lat: number | null | undefined,
  lon: number | null | undefined,
  fallback: string
): string {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const key = lat != null && lon != null ? cacheKey(lat, lon, lang) : null;

  const [resolved, setResolved] = useState<{ key: string; name: string } | null>(null);

  useEffect(() => {
    if (key == null || lat == null || lon == null) return;
    if (cache.has(key)) return;

    const controller = new AbortController();
    reverseGeocode(lat, lon, lang, controller.signal)
      .then((res) => {
        if (res.name) {
          cache.set(key, res.name);
          setResolved({ key, name: res.name });
        }
      })
      .catch(() => {
        // Keep fallback on failure.
      });

    return () => controller.abort();
  }, [key, lat, lon, lang]);

  if (key != null) {
    const cached = cache.get(key);
    if (cached) return cached;
    if (resolved?.key === key) return resolved.name;
  }
  return fallback;
}
