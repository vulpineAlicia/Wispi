import { useEffect, useRef } from "react";
import L, {
  Map as LeafletMap,
  Marker as LeafletMarker,
  TileLayer,
} from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

type Args = {
  mtKey: string | undefined;
  lat: number | null;
  lon: number | null;
  overlayUrl: string | null;
};

type LeafletIconDefaultPrototype = typeof L.Icon.Default.prototype & {
  _iconFixApplied?: boolean;
  _getIconUrl?: unknown;
};

function fixLeafletIconsOnce() {
  const proto = L.Icon.Default.prototype as LeafletIconDefaultPrototype;

  if (proto._iconFixApplied) return;
  proto._iconFixApplied = true;

  delete proto._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  });
}

function createBaseLayer(mtKey: string) {
  return L.tileLayer(
    `https://api.maptiler.com/maps/base-v4/{z}/{x}/{y}.png?key=${mtKey}`,
    {
      tileSize: 512,
      zoomOffset: -1,
      attribution: "© OpenStreetMap contributors © MapTiler",
    },
  );
}

export function useLeafletMap({ mtKey, lat, lon, overlayUrl }: Args) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const overlayRef = useRef<TileLayer | null>(null);

  useEffect(() => {
    const el = mapDivRef.current;
    if (!el || mapRef.current) return;

    fixLeafletIconsOnce();

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 3,
    });

    map.attributionControl.setPrefix(false);

    if (mtKey) {
      createBaseLayer(mtKey).addTo(map);
    }

    const LAT_LIMIT = 85;
    const HUGE_LNG = 1e9;
    const bounds = L.latLngBounds(
      L.latLng(-LAT_LIMIT, -HUGE_LNG),
      L.latLng(LAT_LIMIT, HUGE_LNG),
    );

    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 1.0;
    map.setView([20, 0], 2, { animate: false });

    mapRef.current = map;

    const invalidate = () => {
      map.invalidateSize({ animate: false });
    };

    requestAnimationFrame(invalidate);

    const ro = new ResizeObserver(() => {
      invalidate();
    });
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
  }, [mtKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lon == null) return;

    const next = L.latLng(lat, lon);

    if (!markerRef.current) {
      markerRef.current = L.marker(next).addTo(map);
      map.setView(next, 10, { animate: false });
      return;
    }

    const prev = markerRef.current.getLatLng();
    const same = prev.lat === next.lat && prev.lng === next.lng;
    if (same) return;

    markerRef.current.setLatLng(next);

    const distMeters = map.getCenter().distanceTo(next);
    if (distMeters < 150) return;

    map.flyTo(next, 10, { duration: 0.6 });
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

  return { mapDivRef };
}