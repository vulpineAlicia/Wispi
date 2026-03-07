import { useCallback } from "react";
import { getAirHistory, type AirHistoryResponse } from "../lib/api";
import { useLatLonRequest } from "./useLatLonRequest";

export function useAirHistory(
  lat: number | null,
  lon: number | null,
  days: number
) {
  const request = useCallback(
    (lat: number, lon: number, signal: AbortSignal) =>
      getAirHistory(lat, lon, days, undefined, signal),
    [days]
  );

  return useLatLonRequest<AirHistoryResponse>(lat, lon, request);
}