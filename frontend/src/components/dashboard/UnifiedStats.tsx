"use client";

import { motion } from "framer-motion";
import { DashboardStats } from "@/lib/types";
import { formatMTTR } from "@/lib/utils";
import {
  MessageSquare,
  AlertCircle,
  GitPullRequest,
  Database,
  FileText,
  CheckSquare2,
  Lightbulb,
  Clock,
  Bug,
  Timer,
  RefreshCw,
  ShieldOff,
  type LucideIcon,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  barColor: string;
  delay: number;
  icon: LucideIcon;
  trend?: number;
  suffix?: string;
}

function StatCard({ label, value, barColor, delay, icon: Icon, trend }: StatCardProps) {
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="relative bg-bg-surface border border-border-faint rounded-xl p-5 overflow-hidden group hover:border-border-default transition-all duration-200 cursor-default"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse at bottom left, ${barColor}12, transparent 70%)` }}
      />

      {/* Top row: icon + trend */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${barColor}18` }}
        >
          <Icon className="w-4 h-4" style={{ color: barColor }} />
        </div>
        {trend !== undefined && (
          <span
            className="text-2xs font-mono font-medium flex items-center gap-0.5"
            style={{ color: trend >= 0 ? "#22c55e" : "#ef4444" }}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <p className="relative z-10 text-3xl font-light text-text-primary tracking-tight tabular-nums">
        {displayValue}
      </p>

      {/* Label */}
      <p className="relative z-10 text-2xs uppercase tracking-wider text-text-secondary mt-1.5 font-medium">
        {label}
      </p>

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: barColor }}
      />
    </motion.div>
  );
}

interface SectionHeaderProps {
  dot: string;
  label: string;
  textClass: string;
}

function SectionHeader({ dot, label, textClass }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className={`text-2xs font-semibold uppercase tracking-widest ${textClass}`}>
        {label}
      </span>
      <div className="flex-1 h-px bg-border-faint" />
    </div>
  );
}

interface UnifiedStatsProps {
  stats: DashboardStats;
}

export function UnifiedStats({ stats }: UnifiedStatsProps) {
  return (
    <div className="space-y-7">
      {/* NexusOps Overview */}
      <section>
        <SectionHeader
          dot="bg-nexus-primary"
          label="NexusOps Overview"
          textClass="text-nexus-primary"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Today's Queries"
            value={stats.nexus.queries_today}
            barColor="#8b5cf6"
            delay={0}
            icon={MessageSquare}
          />
          <StatCard
            label="Active Incidents"
            value={stats.nexus.active_incidents}
            barColor="#8b5cf6"
            delay={0.05}
            icon={AlertCircle}
          />
          <StatCard
            label="PRs Created"
            value={stats.nexus.prs_created}
            barColor="#8b5cf6"
            delay={0.1}
            icon={GitPullRequest}
          />
          <StatCard
            label="Memory Items"
            value={stats.nexus.memory_items}
            barColor="#8b5cf6"
            delay={0.15}
            icon={Database}
          />
        </div>
      </section>

      {/* Memory Engine Stats */}
      <section>
        <SectionHeader
          dot="bg-memory-primary"
          label="Memory Engine"
          textClass="text-memory-primary"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Messages Indexed"
            value={stats.memory.messages_indexed}
            barColor="#22d3ee"
            delay={0.2}
            icon={FileText}
          />
          <StatCard
            label="Tasks Detected"
            value={stats.memory.tasks_detected}
            barColor="#22d3ee"
            delay={0.25}
            icon={CheckSquare2}
          />
          <StatCard
            label="Decisions Logged"
            value={stats.memory.decisions_logged}
            barColor="#22d3ee"
            delay={0.3}
            icon={Lightbulb}
          />
          <StatCard
            label="Avg Answer Time"
            value={`${(stats.memory.avg_answer_time_ms / 1000).toFixed(1)}s`}
            barColor="#22d3ee"
            delay={0.35}
            icon={Clock}
          />
        </div>
      </section>

      {/* AutoFix Engine Stats */}
      <section>
        <SectionHeader
          dot="bg-autofix-primary"
          label="AutoFix Engine"
          textClass="text-autofix-primary"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Incidents"
            value={stats.autofix.total_incidents}
            barColor="#f59e0b"
            delay={0.4}
            icon={Bug}
          />
          <StatCard
            label="Avg MTTR"
            value={formatMTTR(stats.autofix.avg_mttr_seconds)}
            barColor="#f59e0b"
            delay={0.45}
            icon={Timer}
          />
          <StatCard
            label="Auto Reverts"
            value={stats.autofix.auto_reverts}
            barColor="#f59e0b"
            delay={0.5}
            icon={RefreshCw}
          />
          <StatCard
            label="Safety Blocks"
            value={stats.autofix.safety_blocks}
            barColor="#f59e0b"
            delay={0.55}
            icon={ShieldOff}
          />
        </div>
      </section>
    </div>
  );
}
