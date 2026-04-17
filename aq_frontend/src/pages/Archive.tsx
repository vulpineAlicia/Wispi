import { useTranslation } from "react-i18next";

import archiveBooks from "../assets/archive-books.svg";
import ArchiveHintBubble from "../components/archive/ArchiveHintBubble";
import Bubble from "../components/templates/Bubble";
import CityResultPanel from "../components/shared/CityResultPanel";
import FavoriteButton from "../components/shared/FavoriteButton";
import CitySearchBox from "../components/shared/CitySearchBox";
import HistoryPanel from "../components/shared/HistoryPanel";
import { useAirHistory } from "../hooks/useAirHistory";
import { useArchiveParams } from "../hooks/useArchiveParams";
import type { GeoResult } from "../lib/services/api";

export default function ArchivePage() {
  const { t } = useTranslation();

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
      <div className="mt-6 p-0 md:rounded-3xl md:border md:border-brand-200 md:bg-brand-50 md:p-10 md:shadow-sm">
        <section className="flex flex-col gap-8 lg:flex-row">
          {/* Left column */}
          <div className="flex min-w-0 flex-col justify-between gap-5 lg:flex-3">
            <div className="space-y-5">
              <div className="max-w-prose">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {t('archive.title')}
                </h1>

                <p className="mt-3 text-base leading-7 text-brand-700 md:text-lg">
                  {t('archive.subtitle')}
                  <br />
                  {t('archive.subtitleLine2')}
                </p>
              </div>

              <div className="w-full sm:max-w-sm">
                <CitySearchBox onSelect={handleSelectCity} />
              </div>
            </div>

            {selection && (
              <Bubble
                tone="white"
                className="flex w-full h-16 items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold text-brand-900">
                    {selection.name}
                    {selection.country ? `, ${selection.country}` : ""}
                  </span>
                  <span className="text-xs tabular-nums text-brand-500">
                    {selection.lat.toFixed(3)}, {selection.lon.toFixed(3)}
                  </span>
                </div>
                <FavoriteButton
                  name={selection.name}
                  country={selection.country}
                  lat={selection.lat}
                  lon={selection.lon}
                  className="shrink-0 text-rose-400 hover:text-rose-600"
                />
              </Bubble>
            )}
          </div>

          {/* Right column */}
          <div className="flex min-w-0 flex-col justify-between gap-5 lg:flex-5">
            <div className="mx-auto mt-7 w-full max-w-2xl lg:mx-0 lg:ml-auto">
              <img
                src={archiveBooks}
                alt=""
                draggable={false}
                className="block h-auto w-full select-none"
              />
            </div>

            {selection && <ArchiveHintBubble />}
          </div>
        </section>

        {selection && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
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

            <aside className="order-1 flex flex-col gap-2 xl:order-2">
              <Bubble
                tone="white"
                className="h-16 mb-3 flex items-center justify-center px-4 py-3 text-center text-sm font-medium text-brand-800"
              >
                {t('archive.selectedDay', { date: history.model.selectedDay?.date ?? "—" })}
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
      </div>
    </main>
  );
}
