
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

import { useEffect, useState } from "react";
import { memoryApi, workspaceApi, Task } from "@/lib/api";

export default function MemoryTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({});
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

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

  const handleCompleteTask = (taskId: string) => {
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }, 300);
  };

  const toggleInfo = (taskId: string) => {
    setExpandedInfo((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleProgressChange = (taskId: string, value: number) => {
    setProgressMap((prev) => ({ ...prev, [taskId]: value }));
  };

  const getTaskParts = (task: Task) => {
    const fullText = (task.source_preview || task.title || "").trim();
    const lowerText = fullText.toLowerCase();
    const idx = lowerText.indexOf("because");
    
    if (idx !== -1) {
      return {
        main: fullText.substring(0, idx).trim(),
        reason: fullText.substring(idx).trim()
      };
    }
    return {
      main: task.title,
      reason: task.description || task.source_preview || null
    };
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
        <AnimatePresence>
          {tasks.map((task, index) => {
            const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            const PriorityIcon = priority.icon;
            const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.detected;
            const { main, reason } = getTaskParts(task);
            const progress = progressMap[task.id] || 0;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-bg-surface border border-border-faint rounded-xl p-5 hover:border-border-default transition-colors flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-nexus-primary focus:ring-nexus-primary cursor-pointer shrink-0"
                      onChange={() => handleCompleteTask(task.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-text-primary leading-tight">
                          {main}
                        </h3>
                        {reason && (
                          <button
                            onClick={() => toggleInfo(task.id)}
                            className="text-text-muted hover:text-nexus-primary transition-colors focus:outline-none"
                            title="Show Reason"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {expandedInfo[task.id] && reason && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 text-xs text-text-secondary bg-bg-elevated p-3 rounded-lg border border-border-faint"
                          >
                            <p className="italic">{reason}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-medium border shrink-0",
                        status.color
                      )}
                    >
                      {status.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <PriorityIcon className={cn("w-4 h-4", priority.color)} />
                      <span className="text-2xs font-medium">{priority.label}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Control */}
                <div className="pl-8 flex items-center gap-4">
                  <label className="text-xs text-text-secondary font-medium whitespace-nowrap">Progress: {progress}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                    className="w-full max-w-xs h-1.5 bg-border-default rounded-lg appearance-none cursor-pointer accent-nexus-primary"
                  />
                </div>

                {/* Footer */}
                <div className="pl-8 flex items-center justify-between text-2xs text-text-muted">
                  <div className="flex items-center gap-3">
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
          })}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}
