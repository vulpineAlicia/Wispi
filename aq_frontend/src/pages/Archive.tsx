import archiveBooks from "../assets/archive-books.svg";
import ArchiveHintBubble from "../components/archive/ArchiveHintBubble";
import Bubble from "../components/templates/Bubble";
import CityResultPanel from "../components/shared/CityResultPanel";
import CitySearchBox from "../components/shared/CitySearchBox";
import HistoryPanel from "../components/shared/HistoryPanel";
import { useAirHistory } from "../hooks/useAirHistory";
import { useArchiveParams } from "../hooks/useArchiveParams";
import type { GeoResult } from "../lib/services/api";

export default function ArchivePage() {
  const {
    selection,
    historyDays,
    setHistoryDays,
    navigate,
    DEFAULT_DAYS,
    MAX_DAYS,
    selectedDate,
  } = useArchiveParams();

  const history = useAirHistory(
    selection?.lat ?? null,
    selection?.lon ?? null,
    historyDays,
    selectedDate
  );

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
            </div>
          </div>

          {selection && (
            <>
              <div className="min-w-0">
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
              </div>

              <div className="min-w-0 lg:self-start">
                <div className="mx-auto w-full max-w-[42rem] lg:mx-0 lg:ml-auto px-1">
                  <ArchiveHintBubble />
                </div>
              </div>
            </>
          )}
        </section>

        {selection && (
          <section className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="order-2 min-w-0 xl:order-1">
              <HistoryPanel
                hasSelection
                historyDays={historyDays}
                setHistoryDays={setHistoryDays}
                historyLoading={history.loading}
                historyError={history.error}
                chartData={history.model.chartData}
                lat={selection.lat}
                lon={selection.lon}
                name={selection.name}
                showPresets={false}
                allowCustomDays
                maxDays={MAX_DAYS}
                showArchiveLink={false}
                onPickDay={(date) => {
                  const next = new URLSearchParams();
                  next.set("lat", String(selection.lat));
                  next.set("lon", String(selection.lon));
                  next.set("name", selection.name);

                  if (selection.country) {
                    next.set("country", selection.country);
                  }

                  next.set("days", String(historyDays));
                  next.set("date", date);

                  navigate({ search: next.toString() });
                }}
                lineWidth={3}
                hitRadius={14}
              />
            </div>

            <aside className="order-1 flex flex-col gap-1 xl:order-2">
              <Bubble
                tone="white"
                className="flex min-h-[60px] items-center justify-center px-4 py-3 text-center text-sm font-medium text-brand-800"
              >
                Selected day: {history.model.selectedDay?.date ?? "—"}
              </Bubble>

              <CityResultPanel
                variant="map"
                name={selection.name}
                lat={selection.lat}
                lon={selection.lon}
                panel={history.model.selectedPanel}
                loading={false}
                error={null}
                showLocation={false}
                showAqi
              />
            </aside>
          </section>
        )}
      </Bubble>
    </main>
  );
}