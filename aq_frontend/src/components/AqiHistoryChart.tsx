import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type ChartPoint = {
  date: string;
  aqi: number;
};

export default function AqiHistoryChart({ data }: { data: ChartPoint[] }) {
  if (!data.length)
    return <div className="text-sm text-brand-700">No history data.</div>;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="date"
            tick={false}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            width={28}
          />

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