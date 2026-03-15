import { useMemo, useState } from "react";
import type { ChartPoint } from "../lib/historyChart";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function useArchiveSelection(chartData: ChartPoint[]) {
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  const defaultDay = useMemo(() => {
    if (!chartData.length) return null;

    const today = todayIso();
    const todayPoint = chartData.find((point) => point.date === today);

    return todayPoint ?? chartData[chartData.length - 1];
  }, [chartData]);

  const activeDay = useMemo(() => {
    if (!chartData.length) return null;
    if (!pickedDay) return defaultDay;

    return chartData.find((point) => point.date === pickedDay) ?? defaultDay;
  }, [chartData, pickedDay, defaultDay]);

  function pickDay(point: ChartPoint) {
    setPickedDay(point.date);
  }

  return {
    activeDay,
    selectedDate: activeDay?.date ?? todayIso(),
    pickDay,
  };
}