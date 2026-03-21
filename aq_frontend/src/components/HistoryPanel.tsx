import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getUserMessage } from "../lib/services/apiMessages";
import type { HistoryChartPoint } from "../lib/historyModel";
import AqiHistoryChartControls from "./AqiHistoryChartControls";
import Bubble from "./Bubble";

const AqiHistoryChart = lazy(() => import("./AqiHistoryChart"));

const HISTORY_RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

export type HistoryDays = number;

type PickDayHandler = (date: string) => void;

function clampDays(value: number, maxDays: number) {
  const n = Math.floor(value);
  if (!Number.isFinite(n)) return 7;
  if (n < 1) return 1;
  if (n > maxDays) return maxDays;
  return n;
}

function isValidIntInRange(raw: string, maxDays: number) {
  const n = Number(raw);
  return Number.isFinite(n) && Math.floor(n) === n && n >= 1 && n <= maxDays;
}

function buildArchiveUrl(args: {
  lat: number;
  lon: number;
  name: string;
  days: number;
}) {
  const params = new URLSearchParams({
    lat: String(args.lat),
    lon: String(args.lon),
    name: args.name,
    days: String(args.days),
  });
  return `/archive?${params.toString()}`;
}

type Props = {
  hasSelection: boolean;
  historyDays: HistoryDays;
  setHistoryDays: (days: HistoryDays) => void;
  historyLoading: boolean;
  historyError: unknown | null;
  chartData: HistoryChartPoint[];
  showPresets?: boolean;
  allowCustomDays?: boolean;
  maxDays?: number;
  showArchiveLink?: boolean;
  onPickDay?: PickDayHandler;
  lineWidth?: number;
  hitRadius?: number;
  lat?: number;
  lon?: number;
  name?: string;
};

export default function HistoryPanel({
  hasSelection,
  historyDays,
  setHistoryDays,
  historyLoading,
  historyError,
  chartData,
  showPresets = true,
  allowCustomDays = false,
  maxDays = 365,
  showArchiveLink = true,
  onPickDay,
  lineWidth = 2,
  hitRadius = 10,
  lat,
  lon,
  name,
}: Props) {
  const [daysDraft, setDaysDraft] = useState(() => String(historyDays));

  useEffect(() => {
    setDaysDraft(String(historyDays));
  }, [historyDays]);

  if (!hasSelection) return null;

  const canApply = isValidIntInRange(daysDraft, maxDays);
  const draftNumber = Number(daysDraft);

  function applyDraft() {
    const nextDays = clampDays(Number(daysDraft), maxDays);
    setHistoryDays(nextDays);
  }

  const canShowArchiveLink =
    showArchiveLink && lat != null && lon != null && name != null;

  return (
    <Bubble className="px-5 py-5 text-sm text-brand-700">
      <AqiHistoryChartControls
        historyDays={historyDays}
        setHistoryDays={setHistoryDays}
        historyLoading={historyLoading}
        showPresets={showPresets}
        allowCustomDays={allowCustomDays}
        ranges={HISTORY_RANGES}
        daysDraft={daysDraft}
        setDaysDraft={setDaysDraft}
        canApply={canApply}
        draftNumber={draftNumber}
        applyDraft={applyDraft}
      />

      <div className="mt-4">
        {historyLoading ? (
          <div className="text-sm text-brand-700">Loading history…</div>
        ) : historyError ? (
          <Bubble tone="error" className="px-3 py-2 text-sm">
            {getUserMessage(historyError)}
          </Bubble>
        ) : (
          <Suspense
            fallback={<div className="text-sm text-brand-700">Loading chart…</div>}
          >
            <AqiHistoryChart
              data={chartData}
              onPickDay={onPickDay}
              lineWidth={lineWidth}
              hitRadius={hitRadius}
            />
          </Suspense>
        )}
      </div>

      {canShowArchiveLink && (
        <div className="mt-1 flex justify-end pb-1">
          <Link
            to={buildArchiveUrl({
              lat,
              lon,
              name,
              days: historyDays,
            })}
            className="text-sm text-brand-500 hover:text-brand-700"
          >
            Open archive →
          </Link>
        </div>
      )}
    </Bubble>
  );
}