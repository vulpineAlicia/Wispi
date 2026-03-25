import type { AirHistoryItem } from "./services/api";
import { isFiniteNumber } from "./services/apiGuards";

export type PollutantsMap = Record<string, number>;

export type HistoryPanelData = {
  aqi: number | null;
  pollutants: PollutantsMap;
};

export type HistoryDay = {
  date: string;
  aqi: number | null;
  pollutants: PollutantsMap;
};

export type HistoryChartPoint = {
  date: string;
  aqi: number | null;
  pollutants?: PollutantsMap;
};

export type HistoryModel = {
  days: HistoryDay[];
  chartData: HistoryChartPoint[];
  latestDay: HistoryDay | null;
  selectedDay: HistoryDay | null;
  latestPanel: HistoryPanelData | null;
  selectedPanel: HistoryPanelData | null;
};

type BuildHistoryModelArgs = {
  items: AirHistoryItem[] | null | undefined;
  selectedDate?: string | null;
};

const SEC_TO_MS = 1000;

function toUtcDay(tsSec: number): string {
  return new Date(tsSec * SEC_TO_MS).toISOString().slice(0, 10);
}

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}


function normalizePollutants(value: unknown): PollutantsMap {
  if (!value || typeof value !== "object") {
    return {};
  }

  const result: PollutantsMap = {};

  for (const [key, raw] of Object.entries(value)) {
    if (isFiniteNumber(raw)) {
      result[key] = raw;
    }
  }

  return result;
}

function toPanelData(day: HistoryDay | null): HistoryPanelData | null {
  if (!day) return null;

  return {
    aqi: day.aqi,
    pollutants: day.pollutants,
  };
}

function pickWinningRecord(
  items: readonly AirHistoryItem[]
): AirHistoryItem | null {
  let winner: AirHistoryItem | null = null;

  for (const item of items) {
    if (
      !item ||
      !isFiniteNumber(item.timestamp_unix) ||
      !isFiniteNumber(item.aqi_ow_1_5)
    ) {
      continue;
    }

    if (winner == null) {
      winner = item;
      continue;
    }

    if (item.aqi_ow_1_5 > winner.aqi_ow_1_5) {
      winner = item;
      continue;
    }

    if (
      item.aqi_ow_1_5 === winner.aqi_ow_1_5 &&
      item.timestamp_unix > winner.timestamp_unix
    ) {
      winner = item;
    }
  }

  return winner;
}

function buildDailyDays(items: readonly AirHistoryItem[]): HistoryDay[] {
  const buckets = new Map<string, AirHistoryItem[]>();

  for (const item of items) {
    if (!item || !isFiniteNumber(item.timestamp_unix)) {
      continue;
    }

    const day = toUtcDay(item.timestamp_unix);
    const bucket = buckets.get(day);

    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(day, [item]);
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, dayItems]) => {
      const winner = pickWinningRecord(dayItems);
      if (!winner) return [];

      return [
        {
          date,
          aqi: winner.aqi_ow_1_5,
          pollutants: normalizePollutants(winner.pollutants),
        },
      ];
    });
}

export function buildHistoryModel({
  items,
  selectedDate = null,
}: BuildHistoryModelArgs): HistoryModel {
  const safeItems = items ?? [];
  const days = buildDailyDays(safeItems);

  const chartData: HistoryChartPoint[] = days.map((day) => ({
    date: day.date,
    aqi: day.aqi,
    pollutants: day.pollutants,
  }));

  const latestDay = days.at(-1) ?? null;

  const selectedDay = (() => {
    if (!days.length) return null;

    if (selectedDate != null) {
      return days.find((day) => day.date === selectedDate) ?? null;
    }

    const today = todayIsoUtc();
    return days.find((day) => day.date === today) ?? latestDay;
  })();

  return {
    days,
    chartData,
    latestDay,
    selectedDay,
    latestPanel: toPanelData(latestDay),
    selectedPanel: toPanelData(selectedDay),
  };
}