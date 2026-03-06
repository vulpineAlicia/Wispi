import { useCallback, useEffect } from "react";
import { getAirHistory, type AirHistoryResponse } from "../lib/api";
import { useLatestRequest } from "./useLatestRequest";

export function useAirHistory(
  lat: number | null,
  lon: number | null,
  days: number
) {
  const { data, loading, error, execute, clear } =
    useLatestRequest<AirHistoryResponse>();

  const refresh = useCallback(() => {
    if (lat == null || lon == null) {
      clear();
      return;
    }

    void execute(() => getAirHistory(lat, lon, days));
  }, [lat, lon, days, execute, clear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, clear };
}