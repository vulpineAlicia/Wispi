import { useMemo } from "react";

import {
  buildPollutantsByDay,
  toDailyAqiSeries,
  type ChartPoint,
} from "../lib/historyChart";
import type { AirHistoryResponse } from "../lib/api";

export function useArchiveChart(
  historyData: AirHistoryResponse | null
): ChartPoint[] {
  const baseSeries = useMemo(() => {
    if (!historyData) return [];
    return toDailyAqiSeries(historyData.items);
  }, [historyData]);

  const pollutantsByDay = useMemo(
    () => buildPollutantsByDay(historyData?.items ?? []),
    [historyData]
  );

  return useMemo(() => {
    if (!baseSeries.length) return [];

    return baseSeries.map((point) => ({
      ...point,
      pollutants: pollutantsByDay.get(point.date),
    }));
  }, [baseSeries, pollutantsByDay]);
}