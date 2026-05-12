const styles: Record<string, string> = {
  queued: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  processing: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  completed: "border-teal-400/35 bg-teal-500/10 text-teal-200",
  succeeded: "border-teal-400/35 bg-teal-500/10 text-teal-200",
  failed: "border-rose-400/35 bg-rose-500/10 text-rose-200",
  cancelled: "border-slate-400/30 bg-slate-600/15 text-slate-200",
};

type Props = {
  status: string;
};

export function TaskStatusPill({ status }: Props) {
  const key = status.toLowerCase();
  const cls = styles[key] ?? "border-white/15 bg-white/5 text-slate-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {status}
    </span>
  );
}
