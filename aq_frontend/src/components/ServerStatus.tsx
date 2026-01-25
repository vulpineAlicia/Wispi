import { useEffect, useRef, useState } from "react";
import ServerStatusPill from "./ServerStatusPill";
import type { Status } from "./ServerStatusPill";
import { checkHealth } from "../lib/api";

export default function ServerStatus() {
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

  return <ServerStatusPill status={status} />;
}
