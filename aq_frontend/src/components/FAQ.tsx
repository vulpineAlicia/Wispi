import React from "react";

type FAQProps = {
  q: string;
  a: React.ReactNode;
};

export default function FAQ({ q, a }: FAQProps) {
  return (
    <details className="group rounded-2xl bg-white p-4 ring-1 ring-brand-200">
      <summary className="cursor-pointer list-none text-base font-semibold text-brand-900">
        <span className="flex items-center justify-between gap-3">
          <span>{q}</span>

          {/* dropdown symbol */}
          <span className="text-2xl font-semibold leading-none text-brand-700 transition group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>

      <div className="mt-3 text-base text-brand-700">{a}</div>
    </details>
  );
}