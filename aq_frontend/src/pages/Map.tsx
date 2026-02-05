import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import L, { Map as LeafletMap, Marker as LeafletMarker, TileLayer } from "leaflet";

import "leaflet/dist/leaflet.css";

import { geocodeCity, getAirCurrent, type GeoResult, type AirData } from "../lib/api";
import { fixLeafletIcons } from "../lib/leafletIcons";

type OverlayMode = "none" | "temp" | "pollution" | "precip";

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
  pollution: {
    title: "Pollution",
    gradientClass: "from-emerald-400 via-yellow-400 to-red-600",
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
  const name = rawName ? decodeURIComponent(rawName) : "Search a city";

  const OW_KEY = import.meta.env.VITE_OPENWEATHER_KEY as string | undefined;

  const [overlay, setOverlay] = useState<OverlayMode>("none");

  // UI state
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Air data state
  const [air, setAir] = useState<AirData | null>(null);
  const [airLoading, setAirLoading] = useState(false);
  const [airError, setAirError] = useState<string | null>(null);

  // Leaflet
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const overlayRef = useRef<TileLayer | null>(null);

  const geoReqIdRef = useRef(0);
  const airReqIdRef = useRef(0);

  useEffect(() => {
    if (!q && name && name !== "Search a city") setQ(name);
  }, [name]);

  const overlayUrl = useMemo(() => {
    if (!OW_KEY) return null;
    if (overlay === "temp") {
      return `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OW_KEY}`;
    }
    if (overlay === "pollution") {
      return `https://tile.openweathermap.org/map/air_pollution/{z}/{x}/{y}.png?appid=${OW_KEY}`;
    }
    if (overlay === "precip") {
    return `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OW_KEY}`;
  }
    return null;
  }, [overlay, OW_KEY]);

  async function searchCity() {
    const query = q.trim();
    if (query.length < 2) return;

    const reqId = ++geoReqIdRef.current;
    setLoadingGeo(true);
    setGeoError(null);

    try {
      const res = await geocodeCity(query);
      if (reqId === geoReqIdRef.current) setResults(res);
    } catch {
      if (reqId === geoReqIdRef.current) {
        setGeoError("Search failed");
        setResults([]);
      }
    } finally {
      if (reqId === geoReqIdRef.current) setLoadingGeo(false);
    }
  }

  function pickCity(item: GeoResult) {
    navigate(`/map?lat=${item.lat}&lon=${item.lon}&name=${encodeURIComponent(item.name)}`);
    setResults([]);
  }

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

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

mapRef.current = map;

// Restrict (vertical)
const LAT_LIMIT = 85;
const HUGE_LNG = 1e9;

const bounds = L.latLngBounds(
  L.latLng(-LAT_LIMIT, -HUGE_LNG),
  L.latLng(LAT_LIMIT, HUGE_LNG)
);

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
        <aside className="absolute left-4 top-4 z-10 w-[340px] max-w-[calc(100vw-2rem)] rounded-3xl bg-white/70 p-4 text-brand-900 shadow-sm ring-1 ring-white/25 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold leading-tight">Map details</h1>
              <p className="mt-1 text-sm text-brand-700">{name}</p>
            </div>

            <div className="text-right text-xs text-brand-700">
              {lat != null && lon != null ? (
                <>
                  <div>lat {lat.toFixed(2)}</div>
                  <div>lon {lon.toFixed(2)}</div>
                </>
              ) : (
                <div className="text-brand-700">no coords</div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchCity()}
                placeholder="Search city…"
                className="h-10 flex-1 rounded-2xl bg-white/70 px-4 text-sm text-brand-900 ring-1 ring-white/30 outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={searchCity}
                className="h-10 rounded-2xl bg-brand-900 px-4 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                {loadingGeo ? "…" : "Search"}
              </button>
            </div>

            {geoError && <div className="mt-2 text-xs text-red-700">{geoError}</div>}

            {results.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-2xl bg-white/60 ring-1 ring-white/30">
                {results.map((r) => (
                  <button
                    key={`${r.lat},${r.lon}`}
                    type="button"
                    onClick={() => pickCity(r)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-brand-50"
                  >
                    <span>
                      {r.name}
                      <span className="ml-2 text-xs text-brand-700">
                        {r.state ? `${r.state}, ` : ""}
                        {r.country}
                      </span>
                    </span>
                    <span className="text-xs text-brand-700">
                      {r.lat.toFixed(2)}, {r.lon.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AQI */}
          <div className="mt-4 rounded-2xl bg-white/60 p-3 ring-1 ring-white/30">
            <div className="text-sm font-medium">AQI</div>

            {lat == null || lon == null ? (
              <div className="mt-1 text-sm text-brand-700">Pick a city to load AQI.</div>
            ) : airLoading ? (
              <div className="mt-1 text-sm text-brand-700">Loading…</div>
            ) : airError ? (
              <div className="mt-1 text-sm text-red-700">{airError}</div>
            ) : air ? (
              <div className="mt-2 space-y-2 text-sm text-brand-800">
                <div>
                  <b>OpenWeather AQI:</b> {air.aqi_ow_1_5}
                </div>

                <div className="text-xs text-brand-700">Pollutants (µg/m³)</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
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

          <div className="mt-3 rounded-2xl bg-white/60 p-3 text-sm text-brand-700 ring-1 ring-white/30">
            History: later
          </div>
        </aside>

        {/* Right panel */}
          <aside className="absolute right-4 top-4 z-10 w-[220px] rounded-3xl bg-white/70 p-3 text-brand-900 shadow-sm ring-1 ring-white/25 backdrop-blur">
            <div className="text-sm font-medium">Layers</div>
            <div className="mt-2 flex flex-col gap-2">
              {(["none", "temp", "precip", "pollution"] as OverlayMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setOverlay(m)}
                  className={
                    "rounded-2xl px-3 py-2 text-sm ring-1 transition text-left " +
                    (overlay === m
                    ? "bg-brand-900 text-white ring-brand-900"
                    : "bg-white/70 text-brand-900 ring-white/30 hover:bg-brand-50")
                  }>
                  {m === "none" ? "None"
                    : m === "temp" ? "Temperature"
                    : m === "precip"? "Precipitation"
                    : "Pollution"}
                </button>
              ))}
            </div>

          {/* Scale pill */}
            {LAYER_LEGEND[overlay] && (
              <div className="mt-3 rounded-2xl bg-white/70 p-3 ring-1 ring-white/30">
                <div className="text-xs font-medium text-brand-900">
                  {LAYER_LEGEND[overlay]!.title} scale
                </div>
                <div className={`mt-2 h-2 w-full rounded-full bg-gradient-to-r ${LAYER_LEGEND[overlay]!.gradientClass}`}/>
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
