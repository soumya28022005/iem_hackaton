"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { type IncidentStatus } from "@/lib/types";

const STAGES: { key: IncidentStatus; label: string }[] = [
  { key: "received",        label: "Received" },
  { key: "sanitizing",      label: "Sanitizing PII" },
  { key: "querying_memory", label: "Querying Memory" },
  { key: "analyzing",       label: "Analyzing Root Cause" },
  { key: "generating_fix",  label: "Generating Fix" },
  { key: "safety_check",    label: "Safety Check" },
  { key: "creating_pr",     label: "Creating Draft PR" },
  { key: "pr_created",      label: "PR Ready" },
];

// Index of each status in the pipeline (non-pipeline statuses mapped to nearest)
const STATUS_INDEX: Partial<Record<IncidentStatus, number>> = {
  received:        0,
  sanitizing:      1,
  fetching_code:   1,
  querying_memory: 2,
  analyzing:       3,
  generating_fix:  4,
  safety_check:    5,
  creating_pr:     6,
  pr_created:      7,
  resolved:        7,
};

export function PipelineProgress({ status }: { status: IncidentStatus }) {
  const isBlocked  = status === "fix_blocked";
  const isFailed   = status === "failed";
  const isDismissed = status === "dismissed";

  const currentIdx = STATUS_INDEX[status] ?? 0;
  const isTerminal = status === "pr_created" || status === "resolved";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">AI Pipeline</h2>
        {(isBlocked || isFailed) && (
          <span className="text-[11px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
            {isBlocked ? "Blocked" : "Failed"}
          </span>
        )}
        {isDismissed && (
          <span className="text-[11px] font-mono text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded">
            Dismissed
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {STAGES.map((stage, idx) => {
          const isDone    = idx < currentIdx || isTerminal;
          const isActive  = idx === currentIdx && !isTerminal && !isBlocked && !isFailed && !isDismissed;
          const isPending = idx > currentIdx && !isTerminal;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              {/* Icon */}
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-autofix-primary animate-spin" />
                ) : (isBlocked || isFailed) && idx === currentIdx ? (
                  <Circle className="w-4 h-4 text-red-400" />
                ) : (
                  <Circle className="w-4 h-4 text-border-default" />
                )}
              </div>

              {/* Connector line + label */}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-xs font-mono ${
                    isDone
                      ? "text-status-success"
                      : isActive
                      ? "text-autofix-primary font-semibold"
                      : (isBlocked || isFailed) && idx === currentIdx
                      ? "text-red-400"
                      : "text-text-muted"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Active pulse dot */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-autofix-primary animate-pulse shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isBlocked || isFailed
              ? "bg-red-500"
              : isDismissed
              ? "bg-slate-500"
              : "bg-gradient-to-r from-autofix-primary to-status-success"
          }`}
          style={{
            width: isBlocked || isFailed || isDismissed
              ? `${Math.round((currentIdx / (STAGES.length - 1)) * 100)}%`
              : `${Math.round((currentIdx / (STAGES.length - 1)) * 100)}%`,
          }}
        />
      </div>
      <p className="text-[11px] text-text-muted font-mono mt-1.5 text-right">
        {isTerminal
          ? "Complete"
          : isBlocked || isFailed || isDismissed
          ? "Pipeline stopped"
          : `Step ${currentIdx + 1} of ${STAGES.length}`}
      </p>
    </div>
  );
}