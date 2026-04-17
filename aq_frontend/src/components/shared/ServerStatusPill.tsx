import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { checkHealth } from "../../lib/services/api";

export type Status = "online" | "degraded" | "offline";

const dot: Record<Status, string> = {
  online: "bg-emerald-400",
  degraded: "bg-amber-400",
  offline: "bg-rose-400"
};

export default function ServerStatus() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("degraded");
  const failures = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        const ok = await checkHealth();
        if (cancelled) return;

        if (ok) {
          failures.current = 0;
          setStatus("online");
        } else {
          failures.current += 1;
          setStatus(failures.current >= 3 ? "offline" : "degraded");
        }
      } finally {
        inFlight.current = false;
      }
    }

    poll();
    const id = setInterval(poll, 10_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur">
      <span
        className={`h-2 w-2 rounded-full ${dot[status]} shadow-[0_0_0_3px_rgba(255,255,255,0.12)]`}
      />
      <span className="text-brand-50">{t(`server.${status}`)}</span>
    </div>
  );
}
