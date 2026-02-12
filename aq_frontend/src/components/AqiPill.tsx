import { aqiMeta } from "../lib/aqi";

export default function AqiPill({ aqi }: { aqi: number }) {
  const meta = aqiMeta(aqi);

  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1.5 font-semibold ring-1 ${meta.badge}`}>
      {aqi} — {meta.label}
    </span>
  );
}
