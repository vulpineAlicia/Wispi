import { useCallback } from "react";
import { getAirCurrent, type AirData } from "../lib/services";
import { useLatLonRequest } from "./useLatLonRequest";

export function useCurrentAir(lat: number | null, lon: number | null) {
  const request = useCallback(
    (lat: number, lon: number, signal: AbortSignal) =>
      getAirCurrent(lat, lon, signal),
    []
  );

  return useLatLonRequest<AirData>(lat, lon, request);
}