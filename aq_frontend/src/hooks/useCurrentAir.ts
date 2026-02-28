import { useCallback, useEffect, useMemo } from "react";
import { getAirCurrent, type AirData } from "../lib/api";
import { useLatestRequest } from "./useLatestRequest";

export function useCurrentAir(lat: number | null, lon: number | null) {
  const { data, loading, error, run, reset } = useLatestRequest<AirData>();

  const canFetch = useMemo(() => lat != null && lon != null, [lat, lon]);

  const refresh = useCallback(() => {
    if (!canFetch) {
      reset();
      return;
    }
    run(() => getAirCurrent(lat as number, lon as number));
  }, [canFetch, lat, lon, run, reset]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, reset };
}