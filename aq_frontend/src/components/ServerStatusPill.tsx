type Status = "online" | "degraded" | "offline";

const dot: Record<Status, string> = {
  online: "bg-emerald-400",
  degraded: "bg-amber-400",
  offline: "bg-rose-400",
};

const label: Record<Status, string> = {
  online: "Server: Online",
  degraded: "Server: Degraded",
  offline: "Server: Offline",
};

export default function ServerStatusPill({ status }: { status: Status }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${dot[status]} shadow-[0_0_0_3px_rgba(255,255,255,0.12)]`} />
      <span className="text-brand-50">{label[status]}</span>
    </div>
  );
}