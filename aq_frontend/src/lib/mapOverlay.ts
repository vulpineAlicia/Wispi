export type OverlayMode = "none" | "temp" | "precip";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export const OVERLAY_OPTIONS: Record<
  OverlayMode,
  | null
  | {
      label: string;
      title: string;
      gradientClass: string;
      tileUrl: string;
    }
> = {
  none: null,
  temp: {
    label: "map.temperature",
    title: "map.temperature",
    gradientClass: "from-sky-500 via-lime-400 to-red-500",
    tileUrl: `${API_BASE}/tiles/ow/temp_new/{z}/{x}/{y}.png`,
  },
  precip: {
    label: "map.precipitation",
    title: "map.precipitation",
    gradientClass: "from-cyan-200 via-sky-400 to-indigo-700",
    tileUrl: `${API_BASE}/tiles/ow/precipitation_new/{z}/{x}/{y}.png`,
  },
};

export function getOverlayUrl(mode: OverlayMode): string | null {
  return OVERLAY_OPTIONS[mode]?.tileUrl ?? null;
}