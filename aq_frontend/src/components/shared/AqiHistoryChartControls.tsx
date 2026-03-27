import BaseButton from "../templates/BaseButton";

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
  const applyDisabled =
    historyLoading || !canApply || draftNumber === historyDays;

  function resetDraft() {
    setDaysDraft(String(historyDays));
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-5">
        <div className="text-base font-semibold text-brand-900">History</div>

        {showPresets && (
          <div className="flex items-center gap-4">
            {ranges.map((range) => {
              const active = range.days === historyDays;

              return (
                <button
                  key={range.days}
                  type="button"
                  onClick={() => setHistoryDays(range.days)}
                  disabled={historyLoading}
                  className={[
                    "text-sm transition-colors disabled:opacity-60",
                    active
                      ? "font-semibold text-brand-900"
                      : "text-brand-500 hover:text-brand-900",
                  ].join(" ")}
                >
                  {range.label}
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
              else resetDraft();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (canApply) applyDraft();
                else resetDraft();
              }

              if (e.key === "Escape") {
                resetDraft();
              }
            }}
            className="w-24 rounded-2xl border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
          />

          <BaseButton
            type="button"
            disabled={applyDisabled}
            onClick={applyDraft}
            className="px-3 py-2 text-sm"
          >
            Apply
          </BaseButton>
        </div>
      )}
    </div>
  );
}