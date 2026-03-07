import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import CitySearchBox from "../components/CitySearchBox";
import CityResultPanel from "../components/CityResultPanel";
import HistoryPanel, { type HistoryDays } from "../components/HistoryPanel";

import { useAirHistory } from "../hooks/useAirHistory";
import {
  buildPollutantsByDay,
  toDailyAqiSeries,
  type ChartPoint,
} from "../lib/historyChart";
import { getLocationSelectionFromParams, parseNumberOrNull } from "../lib/locationSelection";
import type { AirData, GeoResult } from "../lib/api";

import archiveBooks from "../assets/archive-books.svg";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

function clampDays(value: number, min: number, max: number, fallback: number) {
  const n = Math.floor(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
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

  const pickedAir: AirData | null = useMemo(() => {
    if (!pickedDay) return null;

    return {
      aqi_ow_1_5: pickedDay.aqi,
      pollutants: pickedDay.pollutants ?? {},
    };
  }, [pickedDay]);

  function handleSelectCity(place: GeoResult) {
    const next = new URLSearchParams();
    next.set("lat", String(place.lat));
    next.set("lon", String(place.lon));
    next.set("name", place.name);
    next.set("days", String(DEFAULT_DAYS));
    navigate({ search: next.toString() });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 text-brand-900">
      <section className="mt-6 rounded-3xl border border-brand-200 bg-brand-50 p-6 md:p-10">
        <div className="grid gap-8 md:grid-cols-[420px_1fr] md:items-start">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Archive
            </h1>

            <p className="mt-3 text-base text-brand-700 md:text-lg">
              Pick a city and set any history range up to {MAX_DAYS} days.
            </p>

            <div className="mt-4 w-full max-w-[420px]">
              <CitySearchBox onSelect={handleSelectCity} />
            </div>
          </div>

          <div className="hidden md:flex md:justify-end md:self-stretch">
            <img
              src={archiveBooks}
              alt=""
              draggable={false}
              className="h-auto w-full max-w-[640px] select-none opacity-90"
            />
          </div>
        </div>

        {selection && (
          <div className="mt-10 space-y-6">
            <div className="w-full max-w-[420px]">
              <CityResultPanel
                variant="map"
                name={selection.name}
                lat={selection.lat}
                lon={selection.lon}
                air={null}
                showAqi={false}
              />

              {pickedDay && (
                <div className="mt-4">
                  <div className="mb-2 px-2 text-xs font-medium text-brand-700">
                    Selected day:{" "}
                    <span className="text-brand-900">{pickedDay.date}</span>
                  </div>

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
                </div>
              )}
            </div>

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
        )}
      </section>
    </main>
  );
}