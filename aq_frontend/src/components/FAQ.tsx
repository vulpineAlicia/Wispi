import React, { useId, useLayoutEffect, useRef, useState } from "react";

type FAQProps = {
  q: string;
  a: React.ReactNode;
};

export default function FAQ({ q, a }: FAQProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  const innerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!innerRef.current) return;
    if (!open) return;

    const el = innerRef.current;
    const measure = () => setHeight(el.scrollHeight);

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, a]);

  return (
    <div className="rounded-3xl bg-white/90 border border-brand-200 p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full cursor-pointer text-left text-lg font-semibold text-brand-900"
      >
        <span className="flex items-center justify-between gap-3">
          <span>{q}</span>
          <span
            className={[
              "text-3xl font-semibold leading-none text-brand-700",
              "transition-transform duration-200 ease-in-out",
              open ? "rotate-180" : "",
            ].join(" ")}
          >
            ▾
          </span>
        </span>
      </button>
      <div
        id={contentId}
        style={{ height: open ? `${height}px` : "0px" }}
        className="overflow-hidden transition-[height] duration-250 ease-out"
      >
        <div ref={innerRef} className="pt-3 text-base text-brand-700">
          {a}
        </div>
      </div>
    </div>
  );
}
