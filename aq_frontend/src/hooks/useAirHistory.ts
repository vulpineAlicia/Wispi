import { useCallback, useEffect, useMemo } from "react";
import { getAirHistory, type AirHistoryResponse } from "../lib/api";
import { useLatestRequest } from "./useLatestRequest";

export function useAirHistory(lat: number | null, lon: number | null, days: number) {
  const { data, loading, error, run, reset } = useLatestRequest<AirHistoryResponse>();

  const canFetch = useMemo(() => lat != null && lon != null, [lat, lon]);

  const refresh = useCallback(() => {
    if (!canFetch) {
      reset();
      return;
    }
    run(() => getAirHistory(lat as number, lon as number, days));
  }, [canFetch, lat, lon, days, run, reset]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, reset };
}