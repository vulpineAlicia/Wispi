import ServerStatusPill from "./ServerStatusPill";
import ServerStatus from "./ServerStatus";

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-brand-900 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Logo placeholder */}
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-white/15 ring-1 ring-white/20" />

          {/* Title */}
          <div className="leading-tight">
            <div className="text-lg font-semibold text-brand-50">
              Air Quality Monitor
            </div>
            <div className="text-sm text-brand-200">
              Track air quality worldwide
            </div>
          </div>
        </div>

        {/* Right side */}
        <ServerStatus />
      </div>
    </header>
  );
}
