import { useCallback, useEffect } from "react";
import { getAirCurrent, type AirData } from "../lib/api";
import { useLatestRequest } from "./useLatestRequest";

export function useCurrentAir(lat: number | null, lon: number | null) {
  const { data, loading, error, execute, clear } = useLatestRequest<AirData>();

  const refresh = useCallback(() => {
    if (lat == null || lon == null) {
      clear();
      return;
    }

    void execute((signal) => getAirCurrent(lat, lon, signal));
  }, [lat, lon, execute, clear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, clear };
}