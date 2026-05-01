"use client";

import { motion } from "framer-motion";
import {
  Search,
  AlertCircle,
  GitPullRequest,
  CheckSquare,
  Brain,
  FilePlus,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { ActivityItem } from "@/lib/types";
import { formatRelativeTime, cn } from "@/lib/utils";

const moduleConfig = {
  memory: {
    color: "text-memory-primary",
    bg: "bg-memory-muted",
    border: "border-memory-border",
    dotColor: "bg-memory-primary",
    label: "Memory",
    labelClass: "text-memory-primary bg-memory-muted border-memory-border",
  },
  autofix: {
    color: "text-autofix-primary",
    bg: "bg-autofix-muted",
    border: "border-autofix-border",
    dotColor: "bg-autofix-primary",
    label: "AutoFix",
    labelClass: "text-autofix-primary bg-autofix-muted border-autofix-border",
  },
  nexus: {
    color: "text-nexus-primary",
    bg: "bg-nexus-muted",
    border: "border-nexus-border",
    dotColor: "bg-nexus-primary",
    label: "Nexus",
    labelClass: "text-nexus-primary bg-nexus-muted border-nexus-border",
  },
};

const typeIcons: Record<string, React.ElementType> = {
  memory_query: Search,
  incident_received: AlertCircle,
  pr_created: GitPullRequest,
  task_detected: CheckSquare,
  memory_enrichment: Brain,
  source_ingested: FilePlus,
  fix_generated: Zap,
  fix_approved: CheckCircle,
  fix_rejected: XCircle,
  fix_needs_changes: Clock,
  revert_triggered: RotateCcw,
};

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border-faint" />

      <div className="space-y-0.5">
        {items.map((item, index) => {
          const config = moduleConfig[item.module] || moduleConfig.nexus;
          const Icon = typeIcons[item.type] || Zap;
          const isLast = index === items.length - 1;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-bg-elevated/60 transition-colors cursor-pointer group"
            >
              {/* Timeline node */}
              <div className="relative shrink-0 mt-0.5">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center border",
                    config.bg,
                    config.border
                  )}
                >
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                {/* Connector dot at bottom of node */}
                {!isLast && (
                  <div className={cn("absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-0", config.dotColor)} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <p className="text-sm text-text-primary truncate font-medium group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                </div>
                <p className="text-2xs text-text-muted truncate leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Right: module badge + time */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                  className={cn(
                    "text-2xs font-mono px-1.5 py-0.5 rounded border",
                    config.labelClass
                  )}
                >
                  {config.label}
                </span>
                <span className="text-2xs text-text-muted font-mono whitespace-nowrap">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
