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

const HISTORY_RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

export type HistoryDays = (typeof HISTORY_RANGES)[number]["days"];

type ChartPoint = {
  date: string;
  aqi: number;
};

function AqiHistoryChart({ data }: { data: ChartPoint[] }) {
  if (!data.length) {
    return <div className="text-sm text-brand-700">No history data.</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" tick={false} tickLine={false} axisLine={false} />

          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} width={28} />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="aqi"
            dot={false}
            stroke="#185D8B"
            strokeWidth={2}
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
  historyError: string | null;

  chartData: ChartPoint[];

  lat: number;
  lon: number;
  name: string;
};

export default function HistoryPanel({
  hasSelection,
  historyDays,
  setHistoryDays,
  historyLoading,
  historyError,
  chartData,
  lat,
  lon,
  name,
}: Props) {
  if (!hasSelection) return null;

  return (
    <div className="mt-4 rounded-3xl bg-white border border-brand-200 px-5 py-5 text-sm text-brand-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="text-base font-semibold text-brand-900">History</div>

          <div className="flex items-center gap-4">
            {HISTORY_RANGES.map((r) => {
              const active = r.days === historyDays;
              const short = `${r.days}d`;

              return (
                <button
                  key={r.days}
                  type="button"
                  onClick={() => setHistoryDays(r.days)}
                  className={[
                    "text-sm transition-colors",
                    active ? "text-brand-900 font-semibold" : "text-brand-500 hover:text-brand-900",
                  ].join(" ")}
                >
                  {short}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {historyLoading ? (
          <div className="text-sm text-brand-700">Loading history…</div>
        ) : historyError ? (
          <div className="text-sm text-red-700">{historyError}</div>
        ) : (
          <AqiHistoryChart data={chartData} />
        )}
      </div>

      <div className="mt-1 flex justify-end pb-1">
        <Link
          to={`/archive?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}&days=${historyDays}`}
          className="text-sm text-brand-500 hover:text-brand-700"
        >
          Open archive →
        </Link>
      </div>
    </div>
  );
}