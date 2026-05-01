"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UnifiedStats } from "@/components/dashboard/UnifiedStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { IncidentCard } from "@/components/autofix/IncidentCard";
import { mockDashboardStats, mockActivityFeed } from "@/lib/mock-data";
import { Search, ArrowRight, Zap, Brain, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { autofixApi, dashboardApi } from "@/lib/api";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Incident, DashboardStats, ActivityItem } from "@/lib/types";

const systemStatus = [
  { label: "Memory Engine", icon: Brain, color: "memory", pulse: true },
  { label: "AutoFix Active", icon: Zap, color: "autofix", pulse: true },
  { label: "PII Shield", icon: Shield, color: "nexus", pulse: false },
];

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceLoading) return;
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    const loadData = async () => {
      try {
        const [incidentsData, statsData, activityData] = await Promise.all([
          autofixApi.listIncidents(currentWorkspace.id),
          dashboardApi.getStats(currentWorkspace.id),
          dashboardApi.getTimeline(currentWorkspace.id, 20),
        ]);
        setIncidents(incidentsData);
        setStats(statsData);
        setActivity(activityData.map((log: any) => ({
          id: log.id,
          module: log.module as any,
          type: log.action as any,
          title: log.action.replace(/_/g, ' '),
          description: `Action performed on ${log.resource_type || 'system'}`,
          timestamp: log.created_at
        })));
      } catch (err) {
        console.warn("Dashboard data load failed (backend may be offline):", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentWorkspace, workspaceLoading]);

  const activeIncidents = incidents
    .filter((i) => !["resolved", "dismissed", "pr_created"].includes(i.status))
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border-faint bg-bg-surface p-6"
      >
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#C9B6FF 1px, transparent 1px), linear-gradient(90deg, #C9B6FF 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-nexus-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-memory-primary/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-2xs font-mono text-text-muted uppercase tracking-[0.2em] mb-2">
              Incident Command Center
            </p>
            <h1 className="text-3xl font-semibold tracking-tight leading-none">
              <span className="gradient-text-nexus">NexusOps</span>
              <span className="text-text-secondary font-light"> Dashboard</span>
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-md">
              Unified intelligence for Memory &amp; AutoFix engines — institutional memory at incident speed.
            </p>
          </div>

          {/* System Status Pills */}
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            {systemStatus.map(({ label, icon: Icon, color, pulse }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-${color}-border bg-${color}-muted text-${color}-primary text-2xs font-medium`}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-${color}-primary ${pulse ? "animate-pulse-dot" : ""}`} />
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ──────────────────────────────────────────────── */}
      <UnifiedStats stats={stats || mockDashboardStats} />

      {/* ── Main Content: 5-col grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Activity Feed (60%) */}
        <div className="lg:col-span-3">
          <div className="bg-bg-surface border border-border-faint rounded-2xl overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-border-faint flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-text-muted" />
                <h2 className="text-sm font-semibold text-text-primary">Activity Feed</h2>
              </div>
              <div className="flex items-center gap-1.5 text-2xs text-status-success font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse-dot" />
                Live
              </div>
            </div>
            <div className="p-3 max-h-[520px] overflow-y-auto">
              <ActivityFeed items={activity.length > 0 ? activity : mockActivityFeed} />
            </div>
          </div>
        </div>

        {/* Right: Incidents + Quick Ask (40%) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Active Incidents */}
          <div className="bg-bg-surface border border-border-faint rounded-2xl overflow-hidden flex-1">
            <div className="px-5 py-4 border-b border-border-faint flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-autofix-primary animate-pulse-dot" />
                <h2 className="text-sm font-semibold text-text-primary">Active Incidents</h2>
                {!loading && activeIncidents.length > 0 && (
                  <span className="px-1.5 py-0.5 text-2xs font-mono bg-autofix-muted text-autofix-primary border border-autofix-border rounded-md">
                    {activeIncidents.length}
                  </span>
                )}
              </div>
              <Link
                href="/autofix/incidents"
                className="text-2xs text-autofix-primary hover:text-autofix-hover transition-colors flex items-center gap-1 group"
              >
                View all
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="p-3 space-y-2">
              {loading ? (
                <div className="space-y-2 py-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-bg-elevated animate-pulse" />
                  ))}
                </div>
              ) : activeIncidents.length > 0 ? (
                activeIncidents.map((incident, i) => (
                  <IncidentCard key={incident.id} incident={incident} index={i} />
                ))
              ) : (
                <div className="py-10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-faint flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-5 h-5 text-status-success" />
                  </div>
                  <p className="text-sm text-text-secondary font-medium">All systems nominal</p>
                  <p className="text-2xs text-text-muted mt-1">No active incidents</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Ask */}
          <div className="bg-bg-surface border border-border-faint rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border-faint flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-memory-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Quick Ask</h2>
              </div>
              <Link
                href="/memory/ask"
                className="text-2xs text-memory-primary hover:text-memory-hover transition-colors flex items-center gap-1 group"
              >
                Open chat
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="p-4">
              <Link
                href="/memory/ask"
                className="group flex items-center gap-3 px-4 py-3.5 bg-bg-elevated border border-border-faint rounded-xl text-text-muted text-sm hover:border-memory-border hover:bg-memory-muted/30 transition-all duration-200"
              >
                <Search className="w-4 h-4 text-memory-primary/60 group-hover:text-memory-primary transition-colors" />
                <span className="flex-1">Ask your team&apos;s memory...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs font-mono text-text-muted bg-bg-base border border-border-faint rounded">
                  ⌘K
                </kbd>
              </Link>
              <p className="text-2xs text-text-muted mt-2.5 text-center font-mono">
                Semantic search across all indexed incidents &amp; runbooks
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
