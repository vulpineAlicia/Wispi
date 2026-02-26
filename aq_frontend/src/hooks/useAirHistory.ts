import { useCallback, useEffect, useMemo } from "react";
import { getAirHistory, type AirHistoryResponse } from "../lib/api";
import { useLatestRequest } from "./useLatestRequest";

export function useAirHistory(
  lat: number | null,
  lon: number | null,
  days: number
) {
  const req = useLatestRequest<AirHistoryResponse>();

  const canFetch = useMemo(() => lat != null && lon != null, [lat, lon]);

  const refresh = useCallback(() => {
    if (!canFetch) {
      req.reset();
      return;
    }

    req.run(() =>
      getAirHistory(lat as number, lon as number, days)
    );
  }, [canFetch, lat, lon, days, req]);

  useEffect(() => {
    refresh();
  }, [lat, lon, days]);

  return {
    data: req.data,
    loading: req.loading,
    error: req.error,
    refresh,
    reset: req.reset,
  };
}