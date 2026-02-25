import { useEffect, useRef } from "react";
import L, { Map as LeafletMap, Marker as LeafletMarker, TileLayer } from "leaflet";

import { fixLeafletIcons } from "../lib/leafletIcons";

type Args = {
  mtKey: string | undefined;
  lat: number | null;
  lon: number | null;
  overlayUrl: string | null;
};

export function useLeafletMap({ mtKey, lat, lon, overlayUrl }: Args) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const overlayRef = useRef<TileLayer | null>(null);

  // Map init
  useEffect(() => {
    const el = mapDivRef.current;
    if (!el) return;
    if (mapRef.current) return;

    fixLeafletIcons();

    const map = L.map(el, { zoomControl: false, attributionControl: true, minZoom: 3 });
    map.attributionControl.setPrefix(false);

    L.tileLayer(`https://api.maptiler.com/maps/base-v4/{z}/{x}/{y}.png?key=${mtKey ?? ""}`, {
      tileSize: 512,
      zoomOffset: -1,
      attribution: "© OpenStreetMap contributors © MapTiler",
    }).addTo(map);

    mapRef.current = map;

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

  // flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lat == null || lon == null) return;

    if (!markerRef.current) markerRef.current = L.marker([lat, lon]).addTo(map);
    else markerRef.current.setLatLng([lat, lon]);

    map.flyTo([lat, lon], 10, { duration: 0.6 });
  }, [lat, lon]);

  // Overlay layer
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

  return { mapDivRef };
}