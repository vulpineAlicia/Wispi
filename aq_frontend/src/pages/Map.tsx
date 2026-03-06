import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "leaflet/dist/leaflet.css";

import CitySearchBox from "../components/CitySearchBox";
import CityResultPanel from "../components/CityResultPanel";
import HistoryPanel, { type HistoryDays } from "../components/HistoryPanel";
import MapLayersPanel, { type OverlayMode } from "../components/MapLayersPanel";

import { toDailyAqiSeries } from "../lib/historyChart";
import { mapUrl } from "../lib/mapUrl";

import { useLeafletMap } from "../hooks/useLeafletMap";
import { useCurrentAir } from "../hooks/useCurrentAir";
import { useAirHistory } from "../hooks/useAirHistory";

const MT_KEY = import.meta.env.VITE_MAPTILER_KEY;
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

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

  const hasSelection = lat != null && lon != null;

  const [overlay, setOverlay] = useState<OverlayMode>("none");
  const [historyDays, setHistoryDays] = useState<HistoryDays>(7);

  const overlayUrl = useMemo(() => {
    if (overlay === "temp") {
      return `${API_BASE}/tiles/ow/temp_new/{z}/{x}/{y}.png`;
    }
    if (overlay === "precip") {
      return `${API_BASE}/tiles/ow/precipitation_new/{z}/{x}/{y}.png`;
    }
    return null;
  }, [overlay, API_BASE]);

  // Leaflet
  const { mapDivRef } = useLeafletMap({ mtKey: MT_KEY, lat, lon, overlayUrl });

  const current = useCurrentAir(lat, lon);
  const history = useAirHistory(lat, lon, historyDays);

  const chartData = useMemo(
    () => (history.data ? toDailyAqiSeries(history.data.items) : []),
    [history.data]
  );

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 143px)" }}>
      <section className="absolute inset-0 w-full overflow-hidden">
        <div ref={mapDivRef} className="absolute inset-0 z-0" />

        {/* Left panel */}
        <div className="absolute left-4 top-4 z-10 w-[340px] max-w-[calc(100vw-2rem)]">
          <aside
            className="
              relative rounded-3xl bg-brand-50 border border-brand-200
              p-5 text-brand-900 shadow-sm
              max-h-[calc(100vh-170px)] overflow-y-auto no-scrollbar
            "
          >
            <div className="px-1">
              <h1 className="text-lg font-semibold leading-tight px-1">Search a city</h1>
            </div>

            <div className="mt-3">
              <CitySearchBox
                onSelect={(place) => {
                  navigate(mapUrl(place.lat, place.lon, place.name));
                }}
              />
            </div>

            {hasSelection && (
              <CityResultPanel
                variant="map"
                name={name}
                lat={lat!}
                lon={lon!}
                air={current.data}
                airLoading={current.loading}
                airError={current.error}
              />
            )}

            <HistoryPanel
              hasSelection={hasSelection}
              historyDays={historyDays}
              setHistoryDays={setHistoryDays}
              historyLoading={history.loading}
              historyError={history.error}
              chartData={chartData}
              lat={lat!}
              lon={lon!}
              name={name}
            />
          </aside>

          <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 rounded-t-3xl bg-gradient-to-b from-brand-50 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-3xl bg-gradient-to-t from-brand-50 to-transparent" />
        </div>

        {/* Right panel */}
        <MapLayersPanel overlay={overlay} setOverlay={setOverlay} />
      </section>
    </div>
  );
}