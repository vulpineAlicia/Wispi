import { useLocation, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.svg";
import { scrollTopSmooth } from "../../lib/siteNav";
import ServerStatusPill from "./ServerStatusPill";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  function goHomeTop() {
    if (location.pathname === "/" && !location.hash) {
      scrollTopSmooth();
      return;
    }

    navigate("/");
  }

  return (
    <header className="border-b border-white/10 bg-brand-900 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={goHomeTop}
          className="flex items-center gap-4 text-left"
        >
          <img
            src={logo}
            alt="Air Quality Monitor logo"
            className="h-12 w-12 shrink-0 -mr-3"
          />

          <div className="leading-tight">
            <div className="text-lg font-semibold text-brand-50">Wispi</div>
            <div className="text-sm text-brand-200">
              Track air quality worldwide
            </div>
          </div>
        </button>

        <ServerStatusPill />
      </div>
    </header>
  );
}