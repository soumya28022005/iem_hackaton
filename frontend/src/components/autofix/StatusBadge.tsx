import { type IncidentStatus } from "@/lib/types";

const CONFIG: Record<IncidentStatus, { label: string; classes: string; dot?: string }> = {
  received:       { label: "Received",        classes: "bg-slate-500/20  text-slate-400  border-slate-500/30",  dot: "bg-slate-400" },
  sanitizing:     { label: "Sanitizing",      classes: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400 animate-pulse" },
  fetching_code:  { label: "Fetching Code",   classes: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400 animate-pulse" },
  querying_memory:{ label: "Querying Memory", classes: "bg-cyan-500/20   text-cyan-400   border-cyan-500/30",   dot: "bg-cyan-400 animate-pulse" },
  analyzing:      { label: "Analyzing",       classes: "bg-purple-500/20 text-purple-400 border-purple-500/30", dot: "bg-purple-400 animate-pulse" },
  generating_fix: { label: "Generating Fix",  classes: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", dot: "bg-indigo-400 animate-pulse" },
  safety_check:   { label: "Safety Check",    classes: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-400 animate-pulse" },
  creating_pr:    { label: "Creating PR",     classes: "bg-blue-500/20   text-blue-400   border-blue-500/30",   dot: "bg-blue-400 animate-pulse" },
  pr_created:     { label: "PR Created",      classes: "bg-green-500/20  text-green-400  border-green-500/30",  dot: "bg-green-400" },
  fix_blocked:    { label: "Fix Blocked",     classes: "bg-red-500/20    text-red-400    border-red-500/30",    dot: "bg-red-400" },
  failed:         { label: "Failed",          classes: "bg-red-500/20    text-red-400    border-red-500/30",    dot: "bg-red-400" },
  resolved:       { label: "Resolved",        classes: "bg-green-500/20  text-green-400  border-green-500/30",  dot: "bg-green-400" },
  dismissed:      { label: "Dismissed",       classes: "bg-slate-500/20  text-slate-400  border-slate-500/30",  dot: "bg-slate-400" },
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const cfg = CONFIG[status] ?? CONFIG.received;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium font-mono ${cfg.classes}`}
    >
      {cfg.dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}