import { useCallback, useEffect } from "react";
import { useLatestRequest } from "./useLatestRequest";

type LatLonRequestFn<T> = (
  lat: number,
  lon: number,
  signal: AbortSignal
) => Promise<T>;

export function useLatLonRequest<T>(
  lat: number | null,
  lon: number | null,
  request: LatLonRequestFn<T>
) {
  const { data, loading, error, execute, clear } = useLatestRequest<T>();

  const refresh = useCallback(() => {
    if (lat == null || lon == null) {
      clear();
      return;
    }

    void execute((signal) => request(lat, lon, signal));
  }, [lat, lon, request, execute, clear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    clear,
  };
}