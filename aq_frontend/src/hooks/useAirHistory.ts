import { useCallback, useMemo } from "react";

import { getAirHistory, type AirHistoryResponse } from "../lib/services/api";
import { buildHistoryModel } from "../lib/historyModel";
import { useLatLonRequest } from "./useLatLonRequest";

export function useAirHistory(
  lat: number | null,
  lon: number | null,
  days: number,
  selectedDate?: string | null
) {
  const request = useCallback(
    (lat: number, lon: number, signal: AbortSignal) =>
      getAirHistory(lat, lon, days, undefined, signal),
    [days]
  );

  const result = useLatLonRequest<AirHistoryResponse>(lat, lon, request);

  const model = useMemo(
    () =>
      buildHistoryModel({
        items: result.data?.items,
        selectedDate,
      }),
    [result.data, selectedDate]
  );

  return {
    ...result,
    model,
  };
}