import type { ReactNode } from "react";

type Tone = "white" | "brand" | "error";

type Props = {
  children: ReactNode;
  className?: string;
  tone?: Tone;
};

export default function Bubble({
  children,
  className = "",
  tone = "white",
}: Props) {
  const toneClass =
    tone === "brand"
      ? "border border-brand-200 bg-brand-50 shadow-sm"
      : tone === "error"
        ? "border border-rose-300 bg-rose-50 text-rose-900 shadow-sm"
        : "border border-brand-200 bg-white shadow-sm";

  return (
    <div className={`rounded-3xl ${toneClass} ${className}`.trim()}>
      {children}
    </div>
  );
}