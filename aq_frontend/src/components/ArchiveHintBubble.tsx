import { useEffect, useState } from "react";
import Bubble from "./Bubble";

const ARCHIVE_HINTS = [
  "Search for a city to explore its air quality history.",
  "Choose how many days to display and inspect changes over time.",
  "Click a point on the chart to view AQI and pollutants for that day.",
  "Use Archive to compare recent air quality patterns day by day.",
];

export default function ArchiveHintBubble() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const [direction, setDirection] = useState<"left" | "right">("right");

  function showNext() {
    if (phase !== "idle") return;
    setDirection("right");
    setPhase("leaving");
  }

  function showPrev() {
    if (phase !== "idle") return;
    setDirection("left");
    setPhase("leaving");
  }

  useEffect(() => {
    if (phase !== "leaving") return;

    const leaveTimer = window.setTimeout(() => {
      setIndex((prev) =>
        direction === "right"
          ? (prev + 1) % ARCHIVE_HINTS.length
          : (prev - 1 + ARCHIVE_HINTS.length) % ARCHIVE_HINTS.length
      );
      setPhase("entering");
    }, 180);

    return () => window.clearTimeout(leaveTimer);
  }, [phase, direction]);

  useEffect(() => {
    if (phase !== "entering") return;

    const enterTimer = window.setTimeout(() => {
      setPhase("idle");
    }, 180);

    return () => window.clearTimeout(enterTimer);
  }, [phase]);

  function getTextClassName() {
    if (phase === "idle") {
      return "translate-x-0 opacity-100";
    }

    if (phase === "leaving") {
      return direction === "right"
        ? "-translate-x-3 opacity-0"
        : "translate-x-3 opacity-0";
    }

    return direction === "right"
      ? "translate-x-3 opacity-0"
      : "-translate-x-3 opacity-0";
  }

  return (
    <Bubble
      tone="brand"
      className="flex min-h-[60px] w-full items-center gap-3 px-5 py-2 text-sm leading-6 text-brand-700"
    >
      <button
        type="button"
        onClick={showPrev}
        aria-label="Previous hint"
        className="shrink-0 text-lg font-medium text-brand-700 transition hover:text-brand-900 disabled:cursor-default disabled:opacity-60"
        disabled={phase !== "idle"}
      >
        {"◂"}
      </button>

      <div className="min-w-0 flex-1 overflow-hidden text-center">
        <p className={`transition-all duration-200 ${getTextClassName()}`}>
          {ARCHIVE_HINTS[index]}
        </p>
      </div>

      <button
        type="button"
        onClick={showNext}
        aria-label="Next hint"
        className="shrink-0 text-lg font-medium text-brand-700 transition hover:text-brand-900 disabled:cursor-default disabled:opacity-60"
        disabled={phase !== "idle"}
      >
        {"▸"}
      </button>
    </Bubble>
  );
}