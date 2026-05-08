"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  ExternalLink,
  CheckSquare,
  Info
} from "lucide-react";
import { useEffect, useState } from "react";
import { memoryApi, workspaceApi, Task } from "@/lib/api";

const priorityConfig = {
  high: { icon: ArrowUpCircle, color: "text-sev-high", label: "High" },
  medium: { icon: ArrowRightCircle, color: "text-sev-medium", label: "Medium" },
  low: { icon: ArrowDownCircle, color: "text-sev-low", label: "Low" },
};

const statusConfig = {
  detected: { color: "bg-autofix-primary/10 text-autofix-primary border-autofix-border", label: "Detected" },
  confirmed: { color: "bg-memory-primary/10 text-memory-primary border-memory-border", label: "Confirmed" },
  synced_to_jira: { color: "bg-nexus-primary/10 text-nexus-primary border-nexus-border", label: "Synced to Jira" },
  dismissed: { color: "bg-status-neutral/10 text-status-neutral border-border-default", label: "Dismissed" },
};

// Component for Individual Task Item 
function TaskItem({ 
  task, 
  index, 
  onComplete 
}: { 
  task: Task, 
  index: number,
  onComplete: (id: string) => void
}) {
  const [showReason, setShowReason] = useState(false);
  const [progress, setProgress] = useState(0);

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const PriorityIcon = priority.icon;
  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.detected;

  // Split logic based on a simple Enter (Newline \n)
  const textToSplit = task.source_preview || task.title || "";
  let beforeText = textToSplit;
  let afterText = null;

  const splitIndex = textToSplit.indexOf('\n');
  if (splitIndex !== -1) {
    beforeText = textToSplit.substring(0, splitIndex).trim();
    afterText = textToSplit.substring(splitIndex + 1).trim();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-bg-surface border border-border-faint rounded-xl p-5 hover:border-border-default transition-colors"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 w-full">
          {/* Checkbox for Completion */}
          <input 
            type="checkbox" 
            className="mt-1 w-5 h-5 rounded border-border-default text-memory-primary focus:ring-memory-primary cursor-pointer accent-memory-primary"
            onChange={(e) => {
              if (e.target.checked) {
                // Short timeout gives visual feedback of checking the box before unmounting
                setTimeout(() => onComplete(task.id), 300);
              }
            }}
          />

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary flex items-center">
                {beforeText}
                {afterText && afterText.length > 0 && (
                  <button 
                    onClick={() => setShowReason(!showReason)}
                    className="ml-2 text-text-muted hover:text-text-primary transition-colors"
                    title="Why is this important?"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </h3>
            </div>
            
            {/* Expanded Reason Section */}
            {showReason && afterText && afterText.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs text-memory-primary mt-2 bg-memory-primary/5 p-3 rounded border border-memory-border/50"
              >
                <span className="font-semibold">Reason:</span> {afterText}
              </motion.div>
            )}

            {/* Progress Slider */}
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex max-w-xs items-center gap-3">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-bg-elevated rounded-lg appearance-none cursor-pointer accent-memory-primary"
                />
                <span className="text-xs font-mono text-text-secondary w-10">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-medium border shrink-0",
            status.color
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Footer Details */}
      <div className="ml-8 mt-3 flex items-center justify-between text-2xs text-text-muted">
        <div className="flex items-center gap-3">
          <PriorityIcon className={cn("w-3.5 h-3.5", priority.color)} />
          {task.assignee_hint && (
            <span>Assignee: <span className="text-text-secondary">{task.assignee_hint}</span></span>
          )}
          <span className="font-mono">
            Detected {formatRelativeTime(task.detected_at)}
          </span>
        </div>
        {task.jira_ticket_key && (
          <span className="flex items-center gap-1 text-nexus-primary font-mono">
            <ExternalLink className="w-3 h-3" />
            {task.jira_ticket_key}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function MemoryTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { workspaces } = await workspaceApi.list();
        if (workspaces && workspaces.length > 0) {
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

  const handleCompleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) return <div className="p-8 text-center text-text-muted text-sm animate-pulse">Loading Tasks...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Detected Tasks
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Tasks automatically detected from team conversations
        </p>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border-default rounded-2xl">
          <CheckSquare className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No tasks detected yet</p>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            Tasks will appear here automatically as your team discusses action items in connected sources.
          </p>
        </div>
      ) : (
      <div className="space-y-3">
        {/* AnimatePresence enables smooth unmount animations when a task is checked off */}
        <AnimatePresence>
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