import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "leaflet/dist/leaflet.css";

import Bubble from "../components/templates/Bubble";
import CityResultPanel from "../components/shared/CityResultPanel";
import FavoriteButton from "../components/shared/FavoriteButton";
import CitySearchBox from "../components/shared/CitySearchBox";
import HistoryPanel, { type HistoryDays } from "../components/shared/HistoryPanel";
import MapLayersPanel from "../components/map/MapLayersPanel";
import { useAirHistory } from "../hooks/useAirHistory";
import { useLeafletMap } from "../hooks/useLeafletMap";
import type { GeoResult } from "../lib/services/api";
import {
  buildMapUrl,
  getLocationSelectionFromParams,
} from "../lib/locationSelection";
import { getOverlayUrl, type OverlayMode } from "../lib/mapOverlay";

const MT_KEY = import.meta.env.VITE_MAPTILER_KEY;

export default function MapPage() {
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
    <div className="relative w-full" style={{ height: "calc(100vh - 143px)" }}>
      <section className="absolute inset-0 w-full overflow-hidden">
        <div ref={mapDivRef} className="absolute inset-0 z-0" />

        {/* Left panel */}
        <div className="absolute left-4 top-4 z-10 w-85 max-w-[calc(100vw-2rem)]">
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
                  Search a city
                </h1>
              </div>

              <div className="mt-3">
                <CitySearchBox onSelect={handleSelectCity} />
              </div>

              {selection && (
                <>
                  <div className="mt-3 flex justify-end">
                    <FavoriteButton
                      name={selection.name}
                      country={selection.country}
                      lat={selection.lat}
                      lon={selection.lon}
                      className="text-rose-400 hover:text-rose-600"
                    />
                  </div>
                  <CityResultPanel
                    variant="map"
                    name={selection.name}
                    lat={selection.lat}
                    lon={selection.lon}
                    panel={history.model.latestPanel}
                    loading={history.loading}
                    error={history.error}
                  />
                </>
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

        {/* Right panel */}
        <MapLayersPanel overlay={overlay} setOverlay={setOverlay} />
      </section>
    </div>
  );
}