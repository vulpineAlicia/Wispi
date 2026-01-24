const features = [
  { title: "City AQI lookup", desc: "Search any city and get clear, readable air quality metrics." },
  { title: "Health guidance", desc: "Quick recommendations based on pollution level and risk groups." },
  { title: "History & trends", desc: "See changes over time and spot spikes in air pollution." },
  { title: "Alerts", desc: "Get notified when your city crosses a chosen threshold." },
];

export default function Features() {
  return (
    <section id="features" className="mt-12 mb-16 scroll-mt-40">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-brand-900 md:text-2xl">Features</h2>
        <p className="text-sm text-brand-700 md:text-base">
          Everything you need to track air quality and plan your day.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative overflow-hidden rounded-3xl bg-brand-50/70 p-6 ring-1 ring-brand-300/50 shadow-[0_20px_50px_-20px_rgba(15,58,87,0.35)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_32px_80px_-32px_rgba(15,58,87,0.65)]"
            >
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20" />
            <div className="relative">
              <div className="text-base font-semibold text-brand-900 md:text-lg">
                {f.title}
              </div>
              <p className="mt-2 text-sm text-brand-700 md:text-base">
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
