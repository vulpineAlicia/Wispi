import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "leaflet/dist/leaflet.css";

import { getAirCurrent, getAirHistory, type AirData, type AirHistoryResponse } from "../lib/api";

import CitySearchBox from "../components/CitySearchBox";
import CityResultPanel from "../components/CityResultPanel";
import HistoryPanel, { type HistoryDays } from "../components/HistoryPanel";
import MapLayersPanel, { type OverlayMode } from "../components/MapLayersPanel";

import { toDailyAqiSeries } from "../lib/historyChart";
import { useLeafletMap } from "../hooks/useLeafletMap";

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

  const OW_KEY = import.meta.env.VITE_OPENWEATHER_KEY;
  const MT_KEY = import.meta.env.VITE_MAPTILER_KEY;

  const [overlay, setOverlay] = useState<OverlayMode>("none");

  const [air, setAir] = useState<AirData | null>(null);
  const [airLoading, setAirLoading] = useState(false);
  const [airError, setAirError] = useState<string | null>(null);

  const [historyDays, setHistoryDays] = useState<HistoryDays>(7);
  const [history, setHistory] = useState<AirHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const airReqIdRef = useRef(0);
  const historyReqIdRef = useRef(0);

  const overlayUrl = useMemo(() => {
    if (!OW_KEY) return null;
    if (overlay === "temp") {
      return `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OW_KEY}`;
    }
    if (overlay === "precip") {
      return `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OW_KEY}`;
    }
    return null;
  }, [overlay, OW_KEY]);

  // Leaflet
  const { mapDivRef } = useLeafletMap({ mtKey: MT_KEY, lat, lon, overlayUrl });

  // Air fetch
  useEffect(() => {
    if (lat == null || lon == null) {
      setAir(null);
      setAirError(null);
      setAirLoading(false);
      return;
    }

    const reqId = ++airReqIdRef.current;
    let alive = true;

    (async () => {
      setAirLoading(true);
      setAirError(null);

      try {
        const data = await getAirCurrent(lat, lon);
        if (!alive) return;
        if (reqId === airReqIdRef.current) setAir(data);
      } catch {
        if (!alive) return;
        if (reqId === airReqIdRef.current) {
          setAir(null);
          setAirError("Air data fetch failed");
        }
      } finally {
        if (!alive) return;
        if (reqId === airReqIdRef.current) setAirLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [lat, lon]);

  useEffect(() => {
    if (lat == null || lon == null) {
      setHistory(null);
      setHistoryError(null);
      setHistoryLoading(false);
      return;
    }

    const reqId = ++historyReqIdRef.current;
    let alive = true;

    (async () => {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const data = await getAirHistory(lat, lon, historyDays);
        if (!alive) return;
        if (reqId === historyReqIdRef.current) setHistory(data);
      } catch {
        if (!alive) return;
        if (reqId === historyReqIdRef.current) {
          setHistory(null);
          setHistoryError("History fetch failed");
        }
      } finally {
        if (!alive) return;
        if (reqId === historyReqIdRef.current) setHistoryLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [lat, lon, historyDays]);

  const chartData = useMemo(() => (history ? toDailyAqiSeries(history.items) : []), [history]);

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
                  navigate(`/map?lat=${place.lat}&lon=${place.lon}&name=${encodeURIComponent(place.name)}`);
                }}
              />
            </div>

            {hasSelection && (
              <CityResultPanel
                variant="map"
                name={name}
                lat={lat!}
                lon={lon!}
                air={air}
                airLoading={airLoading}
                airError={airError}
              />
            )}

            <HistoryPanel
              hasSelection={hasSelection}
              historyDays={historyDays}
              setHistoryDays={setHistoryDays}
              historyLoading={historyLoading}
              historyError={historyError}
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