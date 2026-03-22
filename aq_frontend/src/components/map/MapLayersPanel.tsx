import type { Dispatch, SetStateAction } from "react";
import { OVERLAY_OPTIONS, type OverlayMode } from "../../lib/mapOverlay";
import Bubble from "../templates/Bubble";

type Props = {
  overlay: OverlayMode;
  setOverlay: Dispatch<SetStateAction<OverlayMode>>;
  className?: string;
};

const MODES: OverlayMode[] = ["none", "temp", "precip"];

export default function MapLayersPanel({
  overlay,
  setOverlay,
  className,
}: Props) {
  const legend = OVERLAY_OPTIONS[overlay];

  return (
    <aside className={className ?? "absolute right-4 top-4 z-10 w-[220px]"}>
      <Bubble tone="brand" className="p-4">
        <div className="px-1 text-sm font-medium">Layers</div>

        <div className="mt-3 flex flex-col gap-2.5">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setOverlay(mode)}
              className={
                "rounded-2xl px-4 py-2.5 text-left text-sm transition " +
                (overlay === mode
                  ? "bg-brand-900 text-white"
                  : "border border-brand-200 bg-white text-brand-900")
              }
            >
              {mode === "none" ? "None" : OVERLAY_OPTIONS[mode]!.label}
            </button>
          ))}
        </div>

        {legend && (
          <Bubble className="mt-4 rounded-2xl px-4 py-4">
            <div className="text-xs font-medium text-brand-900">
              {legend.title} scale
            </div>
            <div
              className={`mt-3 h-2 w-full rounded-full bg-gradient-to-r ${legend.gradientClass}`}
            />
            <div className="mt-2 flex justify-between text-[11px] text-brand-700">
              <span>Low</span>
              <span>High</span>
            </div>
          </Bubble>
        )}
      </Bubble>
    </aside>
  );
}