import { useState } from "react";
import { Layers } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { OVERLAY_OPTIONS, type OverlayMode } from "../../lib/mapOverlay";
import Bubble from "../templates/Bubble";

type Props = {
  overlay: OverlayMode;
  setOverlay: Dispatch<SetStateAction<OverlayMode>>;
  hasSelection?: boolean;
  className?: string;
};

const MODES: OverlayMode[] = ["none", "temp", "precip"];

export default function MapLayersPanel({ overlay, setOverlay, hasSelection, className }: Props) {
  const { t } = useTranslation();
  const legend = OVERLAY_OPTIONS[overlay];
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: trigger button — top-right on map, only when city selected */}
      {hasSelection && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-4 top-24 z-10 inline-flex items-center gap-1.5 rounded-3xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-700 shadow-sm md:hidden"
        >
          <Layers size={15} />
          {t('map.layers')}
        </button>
      )}

      {/* Mobile: backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile: bottom sheet */}
      <div
        className={
          "fixed bottom-0 left-0 right-0 z-30 rounded-t-2xl bg-white transition-transform duration-300 md:hidden " +
          (open ? "translate-y-0" : "translate-y-full pointer-events-none")
        }
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pt-4 text-sm font-medium text-brand-900">
          {t('map.layers')}
        </div>

        <div className="flex gap-2 px-5 py-4">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setOverlay(mode); setOpen(false); }}
              className={
                "flex-1 rounded-full px-3 py-2 text-sm transition " +
                (overlay === mode
                  ? "bg-brand-900 text-white"
                  : "border border-brand-200 bg-white text-brand-700")
              }
            >
              {mode === "none" ? t('map.none') : t(OVERLAY_OPTIONS[mode]!.label)}
            </button>
          ))}
        </div>

        {legend && (
          <div className="mx-5 mb-8 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4">
            <div className="text-xs font-medium text-brand-900">
              {t('map.scale', { title: t(legend.title) })}
            </div>
            <div className={`mt-3 h-2 w-full rounded-full bg-linear-to-r ${legend.gradientClass}`} />
            <div className="mt-2 flex justify-between text-[11px] text-brand-700">
              <span>{t('map.low')}</span>
              <span>{t('map.high')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: original floating panel — hidden on mobile */}
      <aside className={className ?? "hidden md:block absolute right-4 top-4 z-10 w-55"}>
        <Bubble tone="brand" className="p-4">
          <div className="px-1 text-sm font-medium">{t('map.layers')}</div>

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
                {mode === "none" ? t('map.none') : t(OVERLAY_OPTIONS[mode]!.label)}
              </button>
            ))}
          </div>

          {legend && (
            <Bubble className="mt-4 rounded-2xl px-4 py-4">
              <div className="text-xs font-medium text-brand-900">
                {t('map.scale', { title: t(legend.title) })}
              </div>
              <div className={`mt-3 h-2 w-full rounded-full bg-linear-to-r ${legend.gradientClass}`} />
              <div className="mt-2 flex justify-between text-[11px] text-brand-700">
                <span>{t('map.low')}</span>
                <span>{t('map.high')}</span>
              </div>
            </Bubble>
          )}
        </Bubble>
      </aside>
    </>
  );
}
