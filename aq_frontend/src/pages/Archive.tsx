import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Bubble from "../components/Bubble";
import CityResultPanel from "../components/CityResultPanel";
import CitySearchBox from "../components/CitySearchBox";
import HistoryPanel, { type HistoryDays } from "../components/HistoryPanel";

import archiveBooks from "../assets/archive-books.svg";
import { useAirHistory } from "../hooks/useAirHistory";
import type { AirData, GeoResult } from "../lib/api";
import {
  buildPollutantsByDay,
  toDailyAqiSeries,
  type ChartPoint,
} from "../lib/historyChart";
import {
  getLocationSelectionFromParams,
  parseNumberOrNull,
} from "../lib/locationSelection";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

const ARCHIVE_HINTS = [
  "Search for a city to explore its air quality history.",
  "Choose how many days to display and inspect changes over time.",
  "Click a point on the chart to view AQI and pollutants for that day.",
  "Use Archive to compare recent air quality patterns day by day.",
];

function clampDays(value: number, min: number, max: number, fallback: number) {
  const n = Math.floor(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function ArchiveHintBubble() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const [direction, setDirection] = useState<"left" | "right">("right");

  function showNext() {
    if (phase !== "idle") return;
    setDirection("right");
    setPhase("leaving");
  }

  function showPrev() {
    if (phase !== "idle") return;
    setDirection("left");
    setPhase("leaving");
  }

  useEffect(() => {
    if (phase !== "leaving") return;

    const leaveTimer = window.setTimeout(() => {
      setIndex((prev) =>
        direction === "right"
          ? (prev + 1) % ARCHIVE_HINTS.length
          : (prev - 1 + ARCHIVE_HINTS.length) % ARCHIVE_HINTS.length
      );
      setPhase("entering");
    }, 180);

    return () => window.clearTimeout(leaveTimer);
  }, [phase, direction]);

  useEffect(() => {
    if (phase !== "entering") return;

    const enterTimer = window.setTimeout(() => {
      setPhase("idle");
    }, 180);

    return () => window.clearTimeout(enterTimer);
  }, [phase]);

  function getTextClassName() {
    if (phase === "idle") {
      return "translate-x-0 opacity-100";
    }

    if (phase === "leaving") {
      return direction === "right"
        ? "-translate-x-3 opacity-0"
        : "translate-x-3 opacity-0";
    }

    return direction === "right"
      ? "translate-x-3 opacity-0"
      : "-translate-x-3 opacity-0";
  }

  return (
    <Bubble
      tone="brand"
      className="flex min-h-[60px] w-full items-center gap-3 px-5 py-2 text-sm leading-6 text-brand-700"
    >
      <button
        type="button"
        onClick={showPrev}
        aria-label="Previous hint"
        className="shrink-0 text-lg font-medium text-brand-700 transition hover:text-brand-900 disabled:cursor-default disabled:opacity-60"
        disabled={phase !== "idle"}
      >
        {"◂"}
      </button>

      <div className="min-w-0 flex-1 overflow-hidden text-center">
        <p className={`transition-all duration-200 ${getTextClassName()}`}>
          {ARCHIVE_HINTS[index]}
        </p>
      </div>

      <button
        type="button"
        onClick={showNext}
        aria-label="Next hint"
        className="shrink-0 text-lg font-medium text-brand-700 transition hover:text-brand-900 disabled:cursor-default disabled:opacity-60"
        disabled={phase !== "idle"}
      >
        {"▸"}
      </button>
    </Bubble>
  );
}

export default function ArchivePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const selection = getLocationSelectionFromParams(params, "Selected location");

  const rawDays = parseNumberOrNull(params.get("days"));
  const historyDays = clampDays(
    rawDays ?? DEFAULT_DAYS,
    1,
    MAX_DAYS,
    DEFAULT_DAYS
  ) as HistoryDays;

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, replace = true) => {
      const next = new URLSearchParams(params);
      updater(next);
      navigate({ search: next.toString() }, { replace });
    },
    [params, navigate]
  );

  useEffect(() => {
    if (!selection) return;

    const parsed = parseNumberOrNull(params.get("days"));
    const clamped = clampDays(parsed ?? DEFAULT_DAYS, 1, MAX_DAYS, DEFAULT_DAYS);

    if (params.get("days") == null || parsed == null || clamped !== parsed) {
      updateSearchParams((p) => p.set("days", String(clamped)));
    }
  }, [selection, params, updateSearchParams]);

  const history = useAirHistory(
    selection?.lat ?? null,
    selection?.lon ?? null,
    historyDays
  );

  const baseSeries: ChartPoint[] = useMemo(() => {
    if (!history.data) return [];
    return toDailyAqiSeries(history.data.items);
  }, [history.data]);

  const pollutantsByDay = useMemo(
    () => buildPollutantsByDay(history.data?.items ?? []),
    [history.data]
  );

  const chartData: ChartPoint[] = useMemo(() => {
    if (!baseSeries.length) return [];
    return baseSeries.map((point) => ({
      ...point,
      pollutants: pollutantsByDay.get(point.date),
    }));
  }, [baseSeries, pollutantsByDay]);

  const [pickedDay, setPickedDay] = useState<ChartPoint | null>(null);

  useEffect(() => {
    setPickedDay(null);
  }, [selection?.lat, selection?.lon, historyDays]);

  const setHistoryDays = useCallback(
    (nextDays: HistoryDays) => {
      const value = clampDays(Number(nextDays), 1, MAX_DAYS, DEFAULT_DAYS);
      updateSearchParams((p) => p.set("days", String(value)));
    },
    [updateSearchParams]
  );

  const defaultDay = useMemo(() => {
    if (!chartData.length) return null;

    const today = todayIso();
    const todayPoint = chartData.find((point) => point.date === today);
    return todayPoint ?? chartData[chartData.length - 1];
  }, [chartData]);

  const activeDay = pickedDay ?? defaultDay;

  const pickedAir: AirData | null = useMemo(() => {
    if (!activeDay || !selection) return null;

    return {
      location: {
        lat: selection.lat,
        lon: selection.lon,
      },
      timestamp_unix: Math.floor(
        new Date(`${activeDay.date}T00:00:00Z`).getTime() / 1000
      ),
      aqi_ow_1_5: activeDay.aqi,
      pollutants: activeDay.pollutants ?? {},
      source: "openweather",
    };
  }, [activeDay, selection]);

  const selectedDate = activeDay?.date ?? todayIso();

  function handleSelectCity(place: GeoResult) {
  const next = new URLSearchParams();
  next.set("lat", String(place.lat));
  next.set("lon", String(place.lon));
  next.set("name", place.name);

  if (place.country) {
    next.set("country", place.country);
  }

  next.set("days", String(DEFAULT_DAYS));
  navigate({ search: next.toString() });
}

  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 text-brand-900">
      <Bubble tone="brand" className="mt-6 p-6 md:p-10">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-start">
          <div className="min-w-0">
            <div className="space-y-5">
              <div className="max-w-prose">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Archive
                </h1>

                <p className="mt-3 text-base leading-7 text-brand-700 md:text-lg">
                  Explore air quality history for your city
                  <br />
                  and inspect day by day changes.
                </p>
              </div>

              <div className="w-full sm:max-w-sm">
                <CitySearchBox onSelect={handleSelectCity} />
              </div>

              {selection && (
              <Bubble
                tone="white"
                className="flex min-h-[64px] w-full items-center justify-center px-5 py-3 text-center sm:max-w-sm"
              >
                <span className="text-base font-semibold text-brand-900">
                  {selection.name}
                  {selection.country ? `, ${selection.country}` : ""}
                </span>

                <span className="mx-3 text-brand-300">/</span>

                <span className="text-xs text-brand-500 tabular-nums">
                  {selection.lat.toFixed(3)}, {selection.lon.toFixed(3)}
                </span>
              </Bubble>
            )}
            </div>
          </div>

          <div className="min-w-0 lg:self-start">
            <div className="mx-auto w-full max-w-[42rem] lg:mx-0 lg:ml-auto">
              <img
                src={archiveBooks}
                alt=""
                draggable={false}
                className="mt-7 block h-auto w-full select-none"
              />

              {selection && (
                <div className="mt-3.5 px-1">
                  <ArchiveHintBubble />
                </div>
              )}
            </div>
          </div>
        </section>

        {selection && (
          <section className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="min-w-0 order-2 xl:order-1">
              <HistoryPanel
                hasSelection={selection != null}
                historyDays={historyDays}
                setHistoryDays={setHistoryDays}
                historyLoading={history.loading}
                historyError={history.error}
                chartData={chartData}
                lat={selection.lat}
                lon={selection.lon}
                name={selection.name}
                showPresets={false}
                allowCustomDays
                maxDays={MAX_DAYS}
                showArchiveLink={false}
                onPickDay={setPickedDay}
                lineWidth={3}
                hitRadius={14}
              />
            </div>

            <aside className="order-1 flex flex-col gap-1 xl:order-2">
              <Bubble
                tone="white"
                className="flex min-h-[60px] items-center justify-center px-4 py-3 text-center text-sm font-medium text-brand-800"
              >
                Selected day: {selectedDate}
              </Bubble>

              {pickedAir ? (
                <CityResultPanel
                  variant="map"
                  name={selection.name}
                  lat={selection.lat}
                  lon={selection.lon}
                  air={pickedAir}
                  airLoading={false}
                  airError={null}
                  showLocation={false}
                  showAqi
                />
              ) : (
                <Bubble
                  tone="white"
                  className="flex min-h-[220px] items-center justify-center p-4 text-center text-sm text-brand-700"
                >
                  No air quality data available for the selected range.
                </Bubble>
              )}
            </aside>
          </section>
        )}
      </Bubble>
    </main>
  );
}