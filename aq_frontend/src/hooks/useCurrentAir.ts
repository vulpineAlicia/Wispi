import { useCallback, useEffect, useMemo } from "react";
import { getAirCurrent, type AirData } from "../lib/api";
import { useLatestRequest } from "./useLatestRequest";

export function useCurrentAir(lat: number | null, lon: number | null) {
  const req = useLatestRequest<AirData>();

  const canFetch = useMemo(() => lat != null && lon != null, [lat, lon]);

  const refresh = useCallback(() => {
    if (!canFetch) {
      req.reset();
      return;
    }
    req.run(() => getAirCurrent(lat as number, lon as number));
  }, [canFetch, lat, lon, req]);

  useEffect(() => {
    refresh();
  }, [lat, lon]);

  return {
    data: req.data,
    loading: req.loading,
    error: req.error,
    refresh,
    reset: req.reset,
  };
}