import ServerStatusPill from "./ServerStatusPill";
import ServerStatus from "./ServerStatus";
import logo from "../assets/logo.svg";


export default function Header() {
  return (
    <header className="border-b border-white/10 bg-brand-900 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <img
            src={logo}
            alt="Air Quality Monitor logo"
            className="h-12 w-12 shrink-0 -mr-3"
          />
          {/* Title */}
          <div className="leading-tight">
            <div className="text-lg font-semibold text-brand-50">
              Wispi
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
