import { useMemo } from "react";

import Bubble from "../components/Bubble";
import CityResultPanel from "../components/CityResultPanel";
import CitySearchBox from "../components/CitySearchBox";
import HistoryPanel from "../components/HistoryPanel";
import ArchiveHintBubble from "../components/ArchiveHintBubble";

import archiveBooks from "../assets/archive-books.svg";
import { useAirHistory } from "../hooks/useAirHistory";
import { useArchiveChart } from "../hooks/useArchiveChart";
import { useArchiveParams } from "../hooks/useArchiveParams";
import { useArchiveSelection } from "../hooks/useArchiveSelection";
import type { AirData, GeoResult } from "../lib/api";

export default function ArchivePage() {
  const { selection, historyDays, setHistoryDays, navigate, DEFAULT_DAYS, MAX_DAYS } =
    useArchiveParams();

  const history = useAirHistory(
    selection?.lat ?? null,
    selection?.lon ?? null,
    historyDays
  );

  const chartData = useArchiveChart(history.data ?? null);
  const { activeDay, selectedDate, pickDay } = useArchiveSelection(chartData);

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
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 text-brand-900">
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

                  <span className="text-xs tabular-nums text-brand-500">
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
            <div className="order-2 min-w-0 xl:order-1">
              <HistoryPanel
                hasSelection={true}
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
                onPickDay={pickDay}
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