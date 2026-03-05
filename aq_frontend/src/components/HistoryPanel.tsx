import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { getUserMessage } from "../lib/api";
import type { ChartPoint } from "../lib/historyChart";

const HISTORY_RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

export type HistoryDays = number;

type PickDayHandler = (point: ChartPoint) => void;

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: unknown;
};

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

function AqiHistoryChart({
  data,
  onPickDay,
  lineWidth = 2,
  hitRadius = 10,
}: {
  data: ChartPoint[];
  onPickDay?: PickDayHandler;
  lineWidth?: number;
  hitRadius?: number;
}) {
  if (!data.length) {
    return <div className="text-sm text-brand-700">No history data.</div>;
  }

  const dot = onPickDay
    ? (p: DotProps) => {
        const payload = p.payload as ChartPoint | undefined;
        if (!payload || p.cx == null || p.cy == null) return null;

        return (
          <circle
            cx={p.cx}
            cy={p.cy}
            r={hitRadius}
            fill="transparent"
            stroke="transparent"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPickDay(payload);
            }}
          />
        );
      }
    : false;

  return (
    <div className={`h-64 w-full ${onPickDay ? "cursor-pointer" : ""}`}>
      <ResponsiveContainer width="100%" height="100%" className="outline-none">
        <LineChart
          data={data}
          margin={{ top: 10, right: 12, bottom: 10, left: 0 }}
          className="outline-none"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={false} tickLine={false} axisLine={false} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} width={28} />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="aqi"
            dot={dot}
            activeDot={false}
            stroke="#185D8B"
            strokeWidth={lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type Props = {
  hasSelection: boolean;

  historyDays: HistoryDays;
  setHistoryDays: (days: HistoryDays) => void;

  historyLoading: boolean;
  historyError: unknown | null;

  chartData: ChartPoint[];

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
  if (!hasSelection) return null;

  const [daysDraft, setDaysDraft] = useState(() => String(historyDays));

  useEffect(() => {
    setDaysDraft(String(historyDays));
  }, [historyDays]);

  const canApply = isValidIntInRange(daysDraft, maxDays);
  const draftNumber = Number(daysDraft);

  function applyDraft() {
    const n = clampDays(Number(daysDraft), maxDays);
    setHistoryDays(n);
  }

  const canShowArchiveLink =
    showArchiveLink && lat != null && lon != null && name != null;

  return (
    <div className="mt-4 rounded-3xl border border-brand-200 bg-white px-5 py-5 text-sm text-brand-700">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <div className="text-base font-semibold text-brand-900">History</div>

          {showPresets && (
            <div className="flex items-center gap-4">
              {HISTORY_RANGES.map((r) => {
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

      <div className="mt-4">
        {historyLoading ? (
          <div className="text-sm text-brand-700">Loading history…</div>
        ) : historyError ? (
          <div className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-900 ring-1 ring-rose-200">
            {getUserMessage(historyError)}
          </div>
        ) : (
          <AqiHistoryChart
            data={chartData}
            onPickDay={onPickDay}
            lineWidth={lineWidth}
            hitRadius={hitRadius}
          />
        )}
      </div>

      {canShowArchiveLink && (
        <div className="mt-1 flex justify-end pb-1">
          <Link
            to={buildArchiveUrl({
              lat: lat!,
              lon: lon!,
              name: name!,
              days: historyDays,
            })}
            className="text-sm text-brand-500 hover:text-brand-700"
          >
            Open archive →
          </Link>
        </div>
      )}
    </div>
  );
}