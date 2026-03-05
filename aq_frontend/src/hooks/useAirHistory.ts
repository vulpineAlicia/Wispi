import { useCallback, useEffect } from "react";
import { getAirHistory, type AirHistoryResponse } from "../lib/api";
import { useLatestRequest } from "./useLatestRequest";

export function useAirHistory(
  lat: number | null,
  lon: number | null,
  days: number
) {
  const { data, loading, error, run, reset } =
    useLatestRequest<AirHistoryResponse>();

  const refresh = useCallback(() => {
    if (lat == null || lon == null) {
      reset();
      return;
    }

    run(() => getAirHistory(lat, lon, days));
  }, [lat, lon, days, run, reset]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, reset };
}