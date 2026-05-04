import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import "leaflet/dist/leaflet.css";

import Bubble from "../components/templates/Bubble";
import CityResultPanel from "../components/shared/CityResultPanel";
import CitySearchBox from "../components/shared/CitySearchBox";
import HistoryPanel, { type HistoryDays } from "../components/shared/HistoryPanel";
import MapLayersPanel from "../components/map/MapLayersPanel";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAirHistory } from "../hooks/useAirHistory";
import { useLeafletMap } from "../hooks/useLeafletMap";
import type { GeoResult } from "../api/api";
import {
  buildMapUrl,
  getLocationSelectionFromParams,
} from "../lib/locationSelection";
import { getOverlayUrl, type OverlayMode } from "../lib/mapOverlay";

const MT_KEY = import.meta.env.VITE_MAPTILER_KEY;

export default function MapPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const selection = getLocationSelectionFromParams(params);
  const hasSelection = selection != null;

  const [overlay, setOverlay] = useState<OverlayMode>("none");
  const [historyDays, setHistoryDays] = useState<HistoryDays>(7);

  const overlayUrl = getOverlayUrl(overlay);

  const { mapDivRef } = useLeafletMap({
    mtKey: MT_KEY,
    lat: selection?.lat ?? null,
    lon: selection?.lon ?? null,
    overlayUrl,
  });

  const history = useAirHistory(
    selection?.lat ?? null,
    selection?.lon ?? null,
    historyDays
  );

  function handleSelectCity(place: GeoResult) {
    window.scrollTo(0, 0);
    navigate(
      buildMapUrl({
        lat: place.lat,
        lon: place.lon,
        name: place.name,
        country: place.country,
      })
    );
  }

  return (
    <div className="flex flex-col md:relative md:h-[calc(100vh-143px)] md:w-full md:overflow-hidden">
      {/* Map — 65vh on mobile, fills container on desktop */}
      <div className="relative h-[75vh] md:absolute md:inset-0 md:h-auto">
        <div ref={mapDivRef} className="absolute inset-0 z-0" />
        <MapLayersPanel overlay={overlay} setOverlay={setOverlay} hasSelection={hasSelection} />

        {/* Mobile: search overlaid on map, top-left */}
        <div className="absolute left-4 right-4 top-4 z-10 md:hidden">
          <CitySearchBox onSelect={handleSelectCity} />
        </div>

        {/* Mobile: scroll down to results — only when city selected */}
        {hasSelection && (
          <button
            type="button"
            onClick={() => document.getElementById('mobile-results')?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-3xl border border-brand-200 bg-white px-4 py-2 text-sm text-brand-900 shadow-sm md:hidden"
          >
            <ChevronDown size={15} />
            Info
          </button>
        )}
      </div>

      {/* Mobile: results + history below map */}
      <div id="mobile-results" className={`scroll-mt-20 text-brand-900 md:hidden ${hasSelection ? "px-4 py-5" : ""}`}>
        {selection && (
          <CityResultPanel
            variant="map"
            name={selection.name}
            country={selection.country}
            lat={selection.lat}
            lon={selection.lon}
            panel={history.model.latestPanel}
            loading={history.loading}
            error={history.error}
          />
        )}
        {hasSelection && (
          <div className="mt-4">
            <HistoryPanel
              hasSelection={hasSelection}
              historyDays={historyDays}
              setHistoryDays={setHistoryDays}
              historyLoading={history.loading}
              historyError={history.error}
              chartData={history.model.chartData}
              lat={selection?.lat}
              lon={selection?.lon}
              name={selection?.name}
            />
          </div>
        )}
        {hasSelection && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 rounded-3xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-700 shadow-sm"
            >
              <ChevronUp size={15} />
              Back to map
            </button>
          </div>
        )}
      </div>

      {/* Desktop search panel — absolute overlay with bubble */}
      <div className="absolute left-4 top-4 z-10 hidden w-85 max-w-[calc(100vw-2rem)] md:block">
        <aside className="relative">
          <Bubble
            tone="brand"
            className="
              max-h-[calc(100vh-170px)]
              overflow-y-auto
              p-5
              text-brand-900
              no-scrollbar
            "
          >
            <div className="px-1">
              <h1 className="px-1 text-lg font-semibold leading-tight">
                {t('map.searchCity')}
              </h1>
            </div>

            <div className="mt-3">
              <CitySearchBox onSelect={handleSelectCity} />
            </div>

            {selection && (
              <CityResultPanel
                variant="map"
                name={selection.name}
                country={selection.country}
                lat={selection.lat}
                lon={selection.lon}
                panel={history.model.latestPanel}
                loading={history.loading}
                error={history.error}
              />
            )}

            <div className="mt-4">
              <HistoryPanel
                hasSelection={hasSelection}
                historyDays={historyDays}
                setHistoryDays={setHistoryDays}
                historyLoading={history.loading}
                historyError={history.error}
                chartData={history.model.chartData}
                lat={selection?.lat}
                lon={selection?.lon}
                name={selection?.name}
              />
            </div>
          </Bubble>

          {/* scroll fade */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-6 rounded-t-3xl bg-linear-to-b from-brand-50 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-3xl bg-linear-to-t from-brand-50 to-transparent" />
        </aside>
      </div>
    </div>
  );
}
