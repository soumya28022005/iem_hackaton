"use client";

/**
 * Updated Tasks page
 * File: frontend/src/app/memory/tasks/page.tsx  (or wherever your tasks route is)
 *
 * Changes vs original:
 *  1. Shows due date badge on each task
 *  2. Counts down "X days left" / "Overdue" in red
 *  3. Shows assignee_hint clearly
 *  4. Real data only — no demo data
 */

import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  ExternalLink,
  CheckSquare,
  Info,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { memoryApi, workspaceApi, Task } from "@/lib/api";

// ─── Config maps ─────────────────────────────────────────────────────────────

const priorityConfig = {
  high:   { icon: ArrowUpCircle,    color: "text-sev-high",   label: "High"   },
  medium: { icon: ArrowRightCircle, color: "text-sev-medium", label: "Medium" },
  low:    { icon: ArrowDownCircle,  color: "text-sev-low",    label: "Low"    },
};

const statusConfig = {
  detected:      { color: "bg-autofix-primary/10 text-autofix-primary border-autofix-border",       label: "Detected"      },
  confirmed:     { color: "bg-memory-primary/10 text-memory-primary border-memory-border",           label: "Confirmed"     },
  synced_to_jira:{ color: "bg-nexus-primary/10 text-nexus-primary border-nexus-border",             label: "Synced to Jira"},
  dismissed:     { color: "bg-status-neutral/10 text-status-neutral border-border-default",         label: "Dismissed"     },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function splitTaskText(task: Task): { label: string; reason: string | null } {
  const raw = (task.source_preview || task.title || "").trim();
  const newlineIdx = raw.indexOf("\n");
  if (newlineIdx === -1) return { label: raw, reason: null };
  return {
    label:  raw.substring(0, newlineIdx).trim(),
    reason: raw.substring(newlineIdx + 1).trim() || null,
  };
}

/**
 * Returns how many whole days remain until `due`.
 * Negative = overdue.
 */
function daysUntil(due: string | Date | null | undefined): number | null {
  if (!due) return null;
  const diff = new Date(due).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function DueBadge({ dueDate }: { dueDate?: string | null }) {
  const days = daysUntil(dueDate);
  if (days === null) return null;

  let label: string;
  let cls: string;

  if (days < 0) {
    label = `Overdue by ${Math.abs(days)}d`;
    cls = "bg-red-500/10 text-red-400 border-red-500/30";
  } else if (days === 0) {
    label = "Due today";
    cls = "bg-orange-500/10 text-orange-400 border-orange-500/30";
  } else if (days === 1) {
    label = "Due tomorrow";
    cls = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  } else if (days <= 3) {
    label = `${days}d left`;
    cls = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  } else {
    label = `${days}d left`;
    cls = "bg-memory-primary/10 text-memory-primary border-memory-border/40";
  }

  const Icon = days < 0 ? AlertCircle : Clock;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border",
        cls
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── TaskItem ─────────────────────────────────────────────────────────────────

function TaskItem({
  task,
  index,
  onComplete,
}: {
  task: Task & { due_date?: string | null };
  index: number;
  onComplete: (id: string) => void;
}) {
  const [showReason, setShowReason] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);

  const { label, reason } = splitTaskText(task);

  const priority =
    priorityConfig[task.priority as keyof typeof priorityConfig] ??
    priorityConfig.medium;
  const PriorityIcon = priority.icon;

  const status =
    statusConfig[task.status as keyof typeof statusConfig] ??
    statusConfig.detected;

  function handleCheck(checked: boolean) {
    if (!checked) return;
    setCompleting(true);
    setTimeout(() => onComplete(task.id), 350);
  }

  const progressTrackColor =
    progress === 100
      ? "bg-green-500"
      : progress >= 60
      ? "bg-memory-primary"
      : progress >= 30
      ? "bg-autofix-primary"
      : "bg-border-default";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: completing ? 0 : 1, x: 0, scale: completing ? 0.97 : 1 }}
      exit={{ opacity: 0, scale: 0.96, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="bg-bg-surface border border-border-faint rounded-xl p-5 hover:border-border-default transition-colors"
    >
      {/* ── Top row ── */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          aria-label={`Mark "${label}" as complete`}
          className="mt-0.5 w-5 h-5 shrink-0 rounded border-border-default cursor-pointer accent-memory-primary"
          onChange={(e) => handleCheck(e.target.checked)}
        />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-medium text-text-primary leading-snug flex-1">
              {label}
            </p>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Due date badge */}
              <DueBadge dueDate={task.due_date} />

              {/* "i" button */}
              {reason && (
                <button
                  onClick={() => setShowReason((s) => !s)}
                  title="Why is this task important?"
                  aria-pressed={showReason}
                  className={cn(
                    "w-5 h-5 flex items-center justify-center rounded-full transition-colors",
                    showReason
                      ? "bg-memory-primary/20 text-memory-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                  )}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Status badge */}
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium border",
                  status.color
                )}
              >
                {status.label}
              </span>
            </div>
          </div>

          {/* Expandable reason */}
          <AnimatePresence>
            {showReason && reason && (
              <motion.div
                key="reason"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="text-xs text-memory-primary bg-memory-primary/5 px-3 py-2.5 rounded-lg border border-memory-border/40 leading-relaxed">
                  <span className="font-semibold">Why it matters: </span>
                  {reason}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress slider */}
          <div className="mt-3.5 flex items-center gap-3 max-w-xs">
            <div className="relative flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all duration-200",
                  progressTrackColor
                )}
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                aria-label="Task completion percentage"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span
              className={cn(
                "text-xs font-mono tabular-nums w-9 text-right shrink-0 transition-colors",
                progress === 100 ? "text-green-500 font-semibold" : "text-text-secondary"
              )}
            >
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-3 ml-8 flex items-center justify-between text-2xs text-text-muted flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <PriorityIcon className={cn("w-3.5 h-3.5 shrink-0", priority.color)} />
          <span className="text-2xs font-medium text-text-muted/70">
            {priority.label} priority
          </span>

          {/* Assignee — highlighted */}
          {task.assignee_hint && (
            <span className="flex items-center gap-1 bg-memory-primary/10 text-memory-primary px-2 py-0.5 rounded-full font-medium">
              <User className="w-3 h-3" />
              @{task.assignee_hint}
            </span>
          )}

          <span className="font-mono">
            Detected {formatRelativeTime(task.detected_at)}
          </span>
        </div>

        {task.jira_ticket_key && (
          <span className="flex items-center gap-1 text-nexus-primary font-mono shrink-0">
            <ExternalLink className="w-3 h-3" />
            {task.jira_ticket_key}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemoryTasksPage() {
  const [tasks, setTasks] = useState<(Task & { due_date?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { workspaces } = await workspaceApi.list();
        if (workspaces?.length) {
          const data = await memoryApi.listTasks(workspaces[0].id);
          setTasks(data);
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCompleteTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  if (loading) {
    return (
      <div className="p-8 text-center text-text-muted text-sm animate-pulse">
        Loading Tasks…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Detected Tasks
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Tasks automatically created when someone is @mentioned in a message.
          Deadline phrases like &quot;7d&quot; or &quot;by Friday&quot; set the due date automatically.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border-default rounded-2xl">
          <CheckSquare className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No tasks yet</p>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            When someone @mentions a teammate in a connected Slack channel, a task
            will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                onComplete={handleCompleteTask}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}