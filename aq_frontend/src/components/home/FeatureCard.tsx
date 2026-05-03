type Props = {
  title: string;
  desc: string;
};

export default function FeatureCard({ title, desc }: Props) {
  return (
    <div
      className="
        group relative overflow-hidden rounded-3xl
        bg-brand-50/80 p-6 md:p-7
        ring-1 ring-brand-300/50
        shadow-[0_20px_50px_-20px_rgba(15,58,87,0.35)]
        transition-all duration-300
        hover:shadow-[0_30px_80px_-25px_rgba(15,58,87,0.65)]
      "
    >
      {/* Inner light */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
        <div className="absolute -inset-2 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.85),rgba(255,255,255,0.55)_25%,transparent_65%)] blur-md" />
      </div>

      <div className="absolute inset-0 transition group-hover:bg-white/10" />

      {/* Border highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20 transition group-hover:ring-white/40" />

      <div className="relative">
        <div className="text-base font-semibold text-brand-900 md:text-lg">
          {title}
        </div>
        <p className="mt-3 text-sm text-brand-700 md:text-base">
          {desc}
        </p>
      </div>
    </div>
  );
}