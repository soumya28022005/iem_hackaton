import { type Severity } from "@/lib/types";

const CONFIG: Record<Severity, { label: string; classes: string }> = {
  critical: { label: "Critical", classes: "bg-red-500/20 text-red-400 border-red-500/30" },
  high:     { label: "High",     classes: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  medium:   { label: "Medium",   classes: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low:      { label: "Low",      classes: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = CONFIG[severity] ?? CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold font-mono uppercase tracking-wider ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}