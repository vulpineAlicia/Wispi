import { useLocation, useNavigate } from "react-router-dom";
import ServerStatus from "./ServerStatus";
import logo from "../assets/logo.svg";


export default function Header() {

  const navigate = useNavigate();
  const location = useLocation();

  function goHomeTop() {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/#top");
    }
  }

  return (
    <header className="border-b border-white/10 bg-brand-900 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Left side */}
        <button
          type="button"
          onClick={goHomeTop}
          className="flex items-center gap-4 text-left"
        >
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
        </button>


        {/* Right side */}
        <ServerStatus />
      </div>
    </header>
  );
}
