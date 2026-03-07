import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "leaflet/dist/leaflet.css";

import CitySearchBox from "../components/CitySearchBox";
import CityResultPanel from "../components/CityResultPanel";
import HistoryPanel, { type HistoryDays } from "../components/HistoryPanel";
import MapLayersPanel from "../components/MapLayersPanel";

import type { GeoResult } from "../lib/api";
import { toDailyAqiSeries } from "../lib/historyChart";
import { getOverlayUrl, type OverlayMode } from "../lib/mapOverlay";
import { mapUrl } from "../lib/mapUrl";

import { useLeafletMap } from "../hooks/useLeafletMap";
import { useCurrentAir } from "../hooks/useCurrentAir";
import { useAirHistory } from "../hooks/useAirHistory";

const MT_KEY = import.meta.env.VITE_MAPTILER_KEY;

function toNumberOrNull(v: string | null) {
  if (v == null) return null;
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default function MapPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const lat = toNumberOrNull(params.get("lat"));
  const lon = toNumberOrNull(params.get("lon"));
  const name = params.get("name") ?? "";

  const selection =
    lat != null && lon != null
      ? {
          lat,
          lon,
          name,
        }
      : null;

  const [overlay, setOverlay] = useState<OverlayMode>("none");
  const [historyDays, setHistoryDays] = useState<HistoryDays>(7);

  const overlayUrl = getOverlayUrl(overlay);

  const { mapDivRef } = useLeafletMap({
    mtKey: MT_KEY,
    lat: selection?.lat ?? null,
    lon: selection?.lon ?? null,
    overlayUrl,
  });

  const current = useCurrentAir(selection?.lat ?? null, selection?.lon ?? null);
  const history = useAirHistory(
    selection?.lat ?? null,
    selection?.lon ?? null,
    historyDays
  );

  const chartData = useMemo(
    () => toDailyAqiSeries(history.data?.items ?? []),
    [history.data]
  );

  function handleSelectCity(place: GeoResult) {
    navigate(mapUrl(place.lat, place.lon, place.name));
  }

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 143px)" }}>
      <section className="absolute inset-0 w-full overflow-hidden">
        <div ref={mapDivRef} className="absolute inset-0 z-0" />

        <div className="absolute left-4 top-4 z-10 w-[340px] max-w-[calc(100vw-2rem)]">
          <aside
            className="
              relative rounded-3xl border border-brand-200 bg-brand-50
              p-5 text-brand-900 shadow-sm
              max-h-[calc(100vh-170px)] overflow-y-auto no-scrollbar
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
              <CityResultPanel
                variant="map"
                name={selection.name}
                lat={selection.lat}
                lon={selection.lon}
                air={current.data}
                airLoading={current.loading}
                airError={current.error}
              />
            )}

            <HistoryPanel
              hasSelection={selection != null}
              historyDays={historyDays}
              setHistoryDays={setHistoryDays}
              historyLoading={history.loading}
              historyError={history.error}
              chartData={chartData}
              lat={selection?.lat}
              lon={selection?.lon}
              name={selection?.name}
            />
          </aside>

          <div className="pointer-events-none absolute left-0 right-0 top-0 h-6 rounded-t-3xl bg-gradient-to-b from-brand-50 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-3xl bg-gradient-to-t from-brand-50 to-transparent" />
        </div>

        <MapLayersPanel overlay={overlay} setOverlay={setOverlay} />
      </section>
    </div>
  );
}