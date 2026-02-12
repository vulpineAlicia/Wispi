import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import L, { Map as LeafletMap, Marker as LeafletMarker, TileLayer } from "leaflet";

import "leaflet/dist/leaflet.css";

import { getAirCurrent, type AirData } from "../lib/api";
import { fixLeafletIcons } from "../lib/leafletIcons";

import { aqiAdvice } from "../lib/aqi";
import AqiPill from "../components/AqiPill";
import CitySearchBox from "../components/CitySearchBox";

type OverlayMode = "none" | "temp" | "precip";

const LAYER_LEGEND: Record<OverlayMode, { title: string; gradientClass: string } | null> = {
  none: null,
  temp: {
    title: "Temperature",
    gradientClass: "from-sky-500 via-lime-400 to-red-500",
  },
  precip: {
    title: "Precipitation",
    gradientClass: "from-cyan-200 via-sky-400 to-indigo-700",
  },
};

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

  const rawName = params.get("name");
  const name = rawName ? decodeURIComponent(rawName) : "";

  const hasSelection = lat != null && lon != null;

  const OW_KEY = import.meta.env.VITE_OPENWEATHER_KEY;
  const MT_KEY = import.meta.env.VITE_MAPTILER_KEY;

  const [overlay, setOverlay] = useState<OverlayMode>("none");

  // Air data state
  const [air, setAir] = useState<AirData | null>(null);
  const [airLoading, setAirLoading] = useState(false);
  const [airError, setAirError] = useState<string | null>(null);

  // Leaflet
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const overlayRef = useRef<TileLayer | null>(null);

  const airReqIdRef = useRef(0);

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

  useEffect(() => {
    if (lat == null || lon == null) {
      setAir(null);
      setAirError(null);
      setAirLoading(false);
      return;
    }

    const latN = lat;
    const lonN = lon;

    const reqId = ++airReqIdRef.current;
    let alive = true;

    async function loadAir() {
      setAirLoading(true);
      setAirError(null);

      try {
        const data = await getAirCurrent(latN, lonN);
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
    }

    loadAir();
    return () => {
      alive = false;
    };
  }, [lat, lon]);

  // Map init
  useEffect(() => {
    const el = mapDivRef.current;
    if (!el) return;
    if (mapRef.current) return;

    fixLeafletIcons();

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 3,
    });

    map.attributionControl.setPrefix(false);

    L.tileLayer(
      `https://api.maptiler.com/maps/base-v4/{z}/{x}/{y}.png?key=${MT_KEY}`,
      { tileSize: 512, zoomOffset: -1, attribution: "© OpenStreetMap contributors © MapTiler" }
    ).addTo(map);

    mapRef.current = map;

    // Restrict (vertical)
    const LAT_LIMIT = 85;
    const HUGE_LNG = 1e9;

    const bounds = L.latLngBounds(L.latLng(-LAT_LIMIT, -HUGE_LNG), L.latLng(LAT_LIMIT, HUGE_LNG));
    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 1.0;

    if (lat != null && lon != null) map.setView([lat, lon], 10);
    else map.setView([20, 0], 2);

    const invalidate = () => map.invalidateSize();

    map.whenReady(invalidate);
    requestAnimationFrame(invalidate);
    setTimeout(invalidate, 0);
    setTimeout(invalidate, 150);
    setTimeout(invalidate, 400);

    const ro = new ResizeObserver(invalidate);
    ro.observe(el);
    window.addEventListener("resize", invalidate);

    return () => {
      window.removeEventListener("resize", invalidate);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lat == null || lon == null) return;

    if (!markerRef.current) markerRef.current = L.marker([lat, lon]).addTo(map);
    else markerRef.current.setLatLng([lat, lon]);

    map.flyTo([lat, lon], 10, { duration: 0.6 });
  }, [lat, lon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }

    if (!overlayUrl) return;

    const layer = L.tileLayer(overlayUrl, { opacity: 0.75 });
    layer.addTo(map);
    overlayRef.current = layer;

    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [overlayUrl]);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 143px)" }}>
      <section className="absolute inset-0 w-full overflow-hidden">
        <div ref={mapDivRef} className="absolute inset-0 z-0" />

        {/* Left panel */}
        <aside className="absolute left-4 top-4 z-10 w-[340px] max-w-[calc(100vw-2rem)] rounded-3xl bg-brand-50 border border-brand-200 p-4 text-brand-900 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold leading-tight">Search a city</h1>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3">
            <CitySearchBox
              onSelect={(place) => {
                navigate(
                  `/map?lat=${place.lat}&lon=${place.lon}&name=${encodeURIComponent(place.name)}`
                );
              }}
            />
          </div>

          {hasSelection && (
            <div className="mt-4 rounded-2xl bg-white border border-brand-200 px-4 py-2">
              <div className="text-base font-semibold text-brand-900">{name}</div>
              <div className="mt-1 text-xs text-brand-700">
                {lat!.toFixed(4)}, {lon!.toFixed(4)}
              </div>
            </div>
          )}

          {/* AQI */}
          {hasSelection && (
            <div className="mt-4 rounded-2xl bg-white border border-brand-200 md:p-4">
              {airLoading ? (
                <div className="mt-1 text-sm text-brand-700">Loading…</div>
              ) : airError ? (
                <div className="mt-1 text-sm text-red-700">{airError}</div>
              ) : air ? (
                <div className="text-sm text-brand-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base text-brand-700">AQI (OpenWeather):</span>
                    <AqiPill aqi={air.aqi_ow_1_5} />
                  </div>

                  <p className="mt-2 text-sm text-brand-700">{aqiAdvice(air.aqi_ow_1_5)}</p>

                  <div className="text-sm text-brand-700 py-2">Pollutants (µg/m³):</div>
                  <div className="grid grid-cols-2 gap-x-20 gap-y-2 py-1">
                    {Object.entries(air.pollutants).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-brand-700">{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-sm text-brand-700">No data.</div>
              )}
            </div>
          )}

          {hasSelection && (
            <div className="mt-3 rounded-2xl bg-white border border-brand-200 text-sm text-brand-700 md:p-4">
              History: later
            </div>
          )}
        </aside>

        {/* Right panel */}
        <aside className="absolute right-4 top-4 z-10 w-[220px] rounded-3xl bg-brand-50 border border-brand-200 p-3 text-brand-900 shadow-sm">
          <div className="text-sm font-medium">Layers</div>
          <div className="mt-2 flex flex-col gap-2">
            {(["none", "temp", "precip"] as OverlayMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setOverlay(m)}
                className={
                  "rounded-2xl px-3 py-2 text-sm transition text-left " +
                  (overlay === m
                    ? "bg-brand-900 text-white"
                    : "text-brand-900 bg-white border border-brand-200")
                }
              >
                {m === "none" ? "None" : m === "temp" ? "Temperature" : "Precipitation"}
              </button>
            ))}
          </div>

          {/* Scale pill */}
          {LAYER_LEGEND[overlay] && (
            <div className="mt-3 rounded-2xl bg-white border border-brand-200 px-4 py-2">
              <div className="text-xs font-medium text-brand-900">{LAYER_LEGEND[overlay]!.title} scale</div>
              <div
                className={`mt-2 h-2 w-full rounded-full bg-gradient-to-r ${LAYER_LEGEND[overlay]!.gradientClass}`}
              />
              <div className="mt-2 flex justify-between text-[11px] text-brand-700">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
