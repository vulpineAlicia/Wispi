import type { Dispatch, SetStateAction } from "react";

export type OverlayMode = "none" | "temp" | "precip";

const LAYER_LEGEND: Record<OverlayMode, { title: string; gradientClass: string } | null> = {
  none: null,
  temp: { title: "Temperature", gradientClass: "from-sky-500 via-lime-400 to-red-500" },
  precip: { title: "Precipitation", gradientClass: "from-cyan-200 via-sky-400 to-indigo-700" },
};

type Props = {
  overlay: OverlayMode;
  setOverlay: Dispatch<SetStateAction<OverlayMode>>;
  className?: string;
};

export default function MapLayersPanel({ overlay, setOverlay, className }: Props) {
  return (
    <aside
      className={
        className ??
        "absolute right-4 top-4 z-10 w-[220px] rounded-3xl bg-brand-50 border border-brand-200 p-4 text-brand-900 shadow-sm"
      }
    >
      <div className="px-1 text-sm font-medium">Layers</div>

      <div className="mt-3 flex flex-col gap-2.5">
        {(["none", "temp", "precip"] as OverlayMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setOverlay(m)}
            className={
              "rounded-2xl px-4 py-2.5 text-sm transition text-left " +
              (overlay === m ? "bg-brand-900 text-white" : "text-brand-900 bg-white border border-brand-200")
            }
          >
            {m === "none" ? "None" : m === "temp" ? "Temperature" : "Precipitation"}
          </button>
        ))}
      </div>

      {LAYER_LEGEND[overlay] && (
        <div className="mt-4 rounded-2xl bg-white border border-brand-200 px-4 py-4">
          <div className="text-xs font-medium text-brand-900">{LAYER_LEGEND[overlay]!.title} scale</div>
          <div className={`mt-3 h-2 w-full rounded-full bg-gradient-to-r ${LAYER_LEGEND[overlay]!.gradientClass}`} />
          <div className="mt-2 flex justify-between text-[11px] text-brand-700">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      )}
    </aside>
  );
}