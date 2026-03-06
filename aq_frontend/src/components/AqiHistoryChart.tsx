import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import type { ChartPoint } from "../lib/historyChart";

type PickDayHandler = (point: ChartPoint) => void;

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: unknown;
};

type Props = {
  data: ChartPoint[];
  onPickDay?: PickDayHandler;
  lineWidth?: number;
  hitRadius?: number;
};

export default function AqiHistoryChart({
  data,
  onPickDay,
  lineWidth = 2,
  hitRadius = 10,
}: Props) {
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