import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Bubble from "../templates/Bubble";

export default function ArchiveHintBubble() {
  const { t } = useTranslation();
  const hints = t('archive.hints', { returnObjects: true }) as string[];

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
          ? (prev + 1) % hints.length
          : (prev - 1 + hints.length) % hints.length
      );
      setPhase("entering");
    }, 180);

    return () => window.clearTimeout(leaveTimer);
  }, [phase, direction, hints.length]);

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
      className="flex min-h-16 w-full items-center gap-3 px-5 py-2 text-sm leading-6 text-brand-700"
    >
      <button
        type="button"
        onClick={showPrev}
        aria-label={t('archive.prevHint')}
        className="shrink-0 text-lg font-medium text-brand-700 transition hover:text-brand-900 disabled:cursor-default disabled:opacity-60"
        disabled={phase !== "idle"}
      >
        {"◂"}
      </button>

      <div className="min-w-0 flex-1 overflow-hidden text-center">
        <p className={`transition-all duration-200 ${getTextClassName()}`}>
          {hints[index]}
        </p>
      </div>

      <button
        type="button"
        onClick={showNext}
        aria-label={t('archive.nextHint')}
        className="shrink-0 text-lg font-medium text-brand-700 transition hover:text-brand-900 disabled:cursor-default disabled:opacity-60"
        disabled={phase !== "idle"}
      >
        {"▸"}
      </button>
    </Bubble>
  );
}
