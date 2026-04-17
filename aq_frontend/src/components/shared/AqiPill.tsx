import { useTranslation } from "react-i18next";

function aqiBadge(aqi: number) {
  switch (aqi) {
    case 1: return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case 2: return "bg-lime-100 text-lime-900 ring-lime-200";
    case 3: return "bg-amber-100 text-amber-900 ring-amber-200";
    case 4: return "bg-rose-100 text-rose-900 ring-rose-200";
    case 5: return "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200";
    default: return "bg-slate-100 text-slate-900 ring-slate-200";
  }
}

export default function AqiPill({ aqi }: { aqi: number }) {
  const { t } = useTranslation();

  const labelKey = [1, 2, 3, 4, 5].includes(aqi)
    ? (`aqi.${["good", "fair", "moderate", "poor", "veryPoor"][aqi - 1]}` as const)
    : "aqi.unknown";

  return (
    <span className={`inline-flex items-center rounded-full px-4 py-1.5 font-semibold ring-1 ${aqiBadge(aqi)}`}>
      {aqi} — {t(labelKey)}
    </span>
  );
}
