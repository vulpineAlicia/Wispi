export function aqiAdvice(aqi: number) {
  switch (aqi) {
    case 1:
      return "Air quality is excellent — enjoy outdoor activities.";
    case 2:
      return "Air quality is fair — outdoor activities are generally OK.";
    case 3:
      return "Air quality is moderate — consider reducing long outdoor exertion if you’re sensitive.";
    case 4:
      return "Air quality is poor — limit outdoor activity, especially strenuous exercise.";
    case 5:
      return "Air quality is very poor — stay indoors when possible and avoid outdoor exercise.";
    default:
      return "Air quality info is unavailable right now.";
  }
}

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