export function aqiMeta(aqi: number) {
  switch (aqi) {
    case 1:
      return { label: "Good", badge: "bg-emerald-100 text-emerald-900 ring-emerald-200" };
    case 2:
      return { label: "Fair", badge: "bg-lime-100 text-lime-900 ring-lime-200" };
    case 3:
      return { label: "Moderate", badge: "bg-amber-100 text-amber-900 ring-amber-200" };
    case 4:
      return { label: "Poor", badge: "bg-rose-100 text-rose-900 ring-rose-200" };
    case 5:
      return { label: "Very Poor", badge: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200" };
    default:
      return { label: "Unknown", badge: "bg-slate-100 text-slate-900 ring-slate-200" };
  }
}

export default function AqiPill({ aqi }: { aqi: number }) {
  const meta = aqiMeta(aqi);

  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1.5 font-semibold ring-1 ${meta.badge}`}>
      {aqi} — {meta.label}
    </span>
  );
}
