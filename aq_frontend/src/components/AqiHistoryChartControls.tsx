type HistoryRange = {
  label: string;
  days: number;
};

type Props = {
  historyDays: number;
  setHistoryDays: (days: number) => void;
  historyLoading: boolean;

  showPresets?: boolean;
  allowCustomDays?: boolean;

  ranges: readonly HistoryRange[];

  daysDraft: string;
  setDaysDraft: (value: string) => void;

  canApply: boolean;
  draftNumber: number;
  applyDraft: () => void;
};

export default function AqiHistoryChartControls({
  historyDays,
  setHistoryDays,
  historyLoading,
  showPresets = true,
  allowCustomDays = false,
  ranges,
  daysDraft,
  setDaysDraft,
  canApply,
  draftNumber,
  applyDraft,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-5">
        <div className="text-base font-semibold text-brand-900">History</div>

        {showPresets && (
          <div className="flex items-center gap-4">
            {ranges.map((r) => {
              const active = r.days === historyDays;

              return (
                <button
                  key={r.days}
                  type="button"
                  onClick={() => setHistoryDays(r.days)}
                  disabled={historyLoading}
                  className={[
                    "text-sm transition-colors disabled:opacity-60",
                    active
                      ? "font-semibold text-brand-900"
                      : "text-brand-500 hover:text-brand-900",
                  ].join(" ")}
                >
                  {r.days}d
                </button>
              );
            })}
          </div>
        )}
      </div>

      {allowCustomDays && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-500">Days</span>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={daysDraft}
            disabled={historyLoading}
            onChange={(e) => {
              setDaysDraft(e.target.value.replace(/[^\d]/g, ""));
            }}
            onBlur={() => {
              if (canApply) applyDraft();
              else setDaysDraft(String(historyDays));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (canApply) applyDraft();
                else setDaysDraft(String(historyDays));
              }
              if (e.key === "Escape") {
                setDaysDraft(String(historyDays));
              }
            }}
            className="w-24 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
          />

          <button
            type="button"
            disabled={historyLoading || !canApply || draftNumber === historyDays}
            onClick={applyDraft}
            className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 transition hover:bg-brand-100 disabled:opacity-60"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}