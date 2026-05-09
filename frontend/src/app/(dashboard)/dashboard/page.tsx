"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { UnifiedStats } from "@/components/dashboard/UnifiedStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

import {
  Search,
  ArrowRight,
  Brain,
  Shield,
  TrendingUp,
  User,
  CheckCircle2,
  Circle,
  AtSign,
  Clock,
  Award,
  Zap,
  MessageSquare,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { dashboardApi } from "@/lib/api";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { DashboardStats, ActivityItem } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContributionTask {
  id: string;
  label: string;
  /** 'D' marker — drips in gradually over time */
  delayed?: boolean;
  delayMs?: number;
  checked: boolean;
}

interface Mention {
  id: string;
  from: string;
  message: string;
  timestamp: Date;
  channel?: string | null;
  /** 'D' marker — drips in gradually over time */
  delayed?: boolean;
  delayMs?: number;
  visible: boolean;
  unread?: boolean;
}

// ─── Demo seed data ───────────────────────────────────────────────────────────
// Replace with real API fetches in production (see comments below each block)

const SEED_TASKS: ContributionTask[] = [
  { id: "t1", label: "Review memory enrichment PR #42",          checked: false },
  { id: "t2", label: "Triage incoming Sentry alerts",            checked: false },
  { id: "t3", label: "Update pgvector similarity threshold docs", checked: false },
  // D items — will drip in after delayMs
  { id: "t4", label: "Benchmark new embedding model",            checked: false, delayed: true, delayMs: 4000  },
  { id: "t5", label: "Write post-mortem: payment service #88",   checked: false, delayed: true, delayMs: 8000  },
  { id: "t6", label: "Validate BullMQ retry logic edge cases",   checked: false, delayed: true, delayMs: 12000 },
];

const SEED_MENTIONS: Mention[] = [
  {
    id: "m1",
    from: "arjun.dev",
    message: "Hey, can you look at the RAG retrieval chain? Threshold feels too aggressive.",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    visible: true,
    unread: true,
  },
  {
    id: "m2",
    from: "priya.sre",
    message: "Great catch on the PII sanitizer edge case — merged to main 🎉",
    timestamp: new Date(Date.now() - 1000 * 60 * 22),
    visible: true,
  },
  // D items — drip in
  {
    id: "m3",
    from: "devops-bot",
    message: "Incident #88 assigned to you — NullPointerException in payment-service.",
    timestamp: new Date(Date.now() - 1000 * 60 * 58),
    delayed: true,
    delayMs: 5500,
    visible: false,
    unread: true,
  },
  {
    id: "m4",
    from: "rahul.arch",
    message: "Could you review the Octokit Draft PR scope? Needs a second pair of eyes.",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    delayed: true,
    delayMs: 10000,
    visible: false,
    unread: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(/[.\-_]/)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

// Avatar colour is deterministic per username
const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-rose-500 to-pink-700",
  "from-amber-500 to-orange-700",
  "from-sky-500 to-blue-700",
];
function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

// ─── System Status ────────────────────────────────────────────────────────────

const systemStatus = [
  { label: "Memory Engine", icon: Brain,  color: "memory", pulse: true  },
  { label: "PII Shield",    icon: Shield, color: "nexus",  pulse: false },
];

// ─── Personal Hub sub-components ─────────────────────────────────────────────

function ContributionCounter({ count }: { count: number }) {
  return (
    <motion.span
      key={count}
      initial={{ scale: 1.4, color: "#34d399" }}
      animate={{ scale: 1,   color: "#a78bfa" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="text-4xl font-bold tabular-nums"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {count}
    </motion.span>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: ContributionTask;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0  }}
      exit={{   opacity: 0, x:  14 }}
      transition={{ duration: 0.28 }}
      onClick={onToggle}
      className={`
        flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer group transition-all duration-200
        ${task.checked
          ? "bg-emerald-950/30 border border-emerald-800/30"
          : "bg-bg-elevated border border-border-faint hover:border-nexus-border hover:bg-nexus-muted/20"}
      `}
    >
      <span className="shrink-0 text-text-muted group-hover:text-nexus-primary transition-colors">
        {task.checked
          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          : <Circle      className="w-4 h-4" />}
      </span>

      <span className={`flex-1 text-sm transition-colors ${
        task.checked ? "line-through text-text-muted" : "text-text-secondary group-hover:text-text-primary"
      }`}>
        {task.label}
      </span>

      {task.delayed && !task.checked && (
        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-amber-700/50 text-amber-400/80 bg-amber-950/30">
          D
        </span>
      )}

      <AnimatePresence>
        {task.checked && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y:  0 }}
            exit={{   opacity: 0         }}
            className="text-[11px] font-mono font-bold text-emerald-400"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MentionCard({ mention, onRead }: { mention: Mention; onRead: () => void }) {
  const grad = avatarGradient(mention.from);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{   opacity: 0, y: -6  }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      onClick={onRead}
      className={`
        relative flex gap-3 rounded-xl border px-3.5 py-3 cursor-pointer group transition-all duration-200
        ${mention.unread
          ? "border-nexus-border bg-nexus-muted/20 hover:bg-nexus-muted/30"
          : "border-border-faint bg-bg-elevated hover:border-border-default"}
      `}
    >
      {/* Unread dot */}
      {mention.unread && (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-nexus-primary animate-pulse-dot" />
      )}

      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-xs font-bold text-white select-none`}>
        {getInitials(mention.from)}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
          <span className="text-xs font-semibold text-nexus-primary">@{mention.from}</span>
          {mention.channel && (
            <span className="text-[9px] font-mono text-text-muted">#{mention.channel}</span>
          )}
          {mention.delayed && (
            <span className="text-[9px] font-mono font-bold px-1 py-0 rounded border border-amber-700/50 text-amber-400/70 bg-amber-950/20">
              D
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[11px] text-text-muted shrink-0">
            <Clock className="w-3 h-3" />
            {mounted ? timeAgo(mention.timestamp) : ""}
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 group-hover:text-text-primary transition-colors">
          {mention.message}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Personal Hub section ─────────────────────────────────────────────────────

function PersonalHub() {
  const { data: session } = useSession();
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { currentWorkspace } = useWorkspaceStore();

  // Real user info from session
  const userName  = session?.user?.name  ?? "You";
  const userEmail = session?.user?.email ?? "";
  // Initials: "Soumya Chakraborty" → "SC"
  const userInitials = userName
    .split(" ")
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "??";
  // Role from email domain বা fallback
  const userRole = userEmail.includes("admin") ? "Admin · NexusOps" : "SRE · NexusOps";

  const [tasks,         setTasks]         = useState<ContributionTask[]>([]);
  const [mentions,      setMentions]      = useState<Mention[]>([]);
  const [contributions, setContributions] = useState(0);
  const [plusFlash,     setPlusFlash]     = useState(false);
  const [loadingHub,    setLoadingHub]    = useState(true);

  // Real data fetch from API
  useEffect(() => {
    if (!currentWorkspace) return;

    const fetchHubData = async () => {
      setLoadingHub(true);
      try {
        const [apiTasks, apiMentions] = await Promise.all([
          dashboardApi.getMyTasks(currentWorkspace.id, 10),
          dashboardApi.getMentions(currentWorkspace.id, 15),
        ]);

        // API tasks → ContributionTask shape
        if (apiTasks.length > 0) {
          setTasks(apiTasks.map(t => ({
            id:      t.id,
            label:   t.title,
            checked: t.status === 'done',
          })));
        } else {
          // Fallback to SEED when DB has no tasks yet
          setTasks(SEED_TASKS.filter(t => !t.delayed));
          // Drip delayed seed tasks
          SEED_TASKS.filter(t => t.delayed).forEach(task => {
            const tid = setTimeout(() => {
              setTasks(prev => prev.find(t => t.id === task.id) ? prev : [...prev, { ...task }]);
            }, task.delayMs ?? 5000);
            timerRefs.current.push(tid);
          });
        }

        // API mentions → Mention shape
        if (apiMentions.length > 0) {
          setMentions(apiMentions.map(m => ({
            id:        m.id,
            from:      m.from,
            message:   m.message,
            timestamp: new Date(m.timestamp),
            visible:   true,
            unread:    m.unread,
            channel:   m.channel,
          })));
        } else {
          // Fallback to SEED when no Slack messages ingested yet
          setMentions(SEED_MENTIONS.filter(m => m.visible));
          SEED_MENTIONS.filter(m => m.delayed).forEach(mention => {
            const mid = setTimeout(() => {
              setMentions(prev => prev.find(m => m.id === mention.id) ? prev : [{ ...mention, visible: true }, ...prev]);
            }, mention.delayMs ?? 5000);
            timerRefs.current.push(mid);
          });
        }
      } catch (err) {
        console.warn("[PersonalHub] API fetch failed, using seed data:", err);
        // Fallback to SEED on error
        setTasks(SEED_TASKS.filter(t => !t.delayed));
        setMentions(SEED_MENTIONS.filter(m => m.visible));
      } finally {
        setLoadingHub(false);
      }
    };

    fetchHubData();
    return () => timerRefs.current.forEach(clearTimeout);
  }, [currentWorkspace]);

  const handleToggle = (id: string) => {
    // setTasks-এর বাইরে contribution update করা হচ্ছে
    // কারণ map callback-এর ভেতরে setState করলে React Strict Mode-এ 2x run হয়
    setTasks(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) return prev;
      const next = !target.checked;
      // contribution change — map-এর বাইরে, setTimeout দিয়ে schedule করা
      setTimeout(() => {
        if (next) {
          setContributions(c => c + 1);
          setPlusFlash(true);
          setTimeout(() => setPlusFlash(false), 1000);
        } else {
          setContributions(c => Math.max(0, c - 1));
        }
      }, 0);
      return prev.map(t => t.id === id ? { ...t, checked: next } : t);
    });
  };

  const handleRead = (id: string) => {
    setMentions(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
  };

  const checked   = tasks.filter(t => t.checked).length;
  const total     = tasks.length;
  const pct       = total > 0 ? (checked / total) * 100 : 0;
  const unreadCnt = mentions.filter(m => m.unread).length;

  return (
    <section className="space-y-4 mt-2">

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-nexus-border/60 to-transparent" />
        <div className="flex items-center gap-1.5 text-2xs font-mono text-nexus-primary/70 uppercase tracking-[0.18em] px-2">
          <User className="w-3 h-3" />
          Personal Hub
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-nexus-border/60 to-transparent" />
      </div>

      {/* ── Three-panel grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Panel 1 — Profile card */}
        <div className="rounded-2xl border border-border-faint bg-bg-surface p-5 flex flex-col gap-4 relative overflow-hidden shadow-md shadow-black/20">
          {/* Ambient glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-nexus-primary/5 blur-3xl pointer-events-none" />

          {/* Avatar + name */}
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center text-base font-bold text-white shadow-lg shadow-violet-900/40">
                {userInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-success border-2 border-bg-surface" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">{userName}</div>
              <div className="text-2xs text-text-muted font-mono">{userRole}</div>
            </div>
          </div>

          {/* Contribution counter */}
          <div className="rounded-xl bg-bg-elevated border border-border-faint px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-2xs uppercase tracking-widest text-text-muted mb-0.5 font-medium">
                Contributions
              </span>
              <div className="flex items-end gap-2 h-10">
                <ContributionCounter count={contributions} />
                <AnimatePresence>
                  {plusFlash && (
                    <motion.span
                      key="flash"
                      initial={{ opacity: 1, y: 0   }}
                      animate={{ opacity: 0, y: -14 }}
                      transition={{ duration: 0.8 }}
                      className="text-emerald-400 font-bold font-mono text-sm mb-1"
                    >
                      +1
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-nexus-primary/30 ml-auto" />
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-2xs text-text-muted mb-1.5">
              <span>Tasks completed</span>
              <span className="font-mono">{checked} / {total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-nexus-primary to-emerald-400"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            {[
              { icon: Zap,     label: "Incidents", value: "14" },
              { icon: Award,   label: "PRs merged", value: "7"  },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-xl bg-bg-elevated border border-border-faint py-2.5 gap-0.5"
              >
                <Icon className="w-3.5 h-3.5 text-nexus-primary" />
                <span className="text-base font-bold text-text-primary font-mono">{value}</span>
                <span className="text-2xs text-text-muted">{label}</span>
              </div>
            ))}
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 rounded-xl bg-amber-950/20 border border-amber-800/30 px-3 py-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300 font-medium">5-day contribution streak</span>
          </div>
        </div>

        {/* Panel 2 — Task checklist */}
        <div className="rounded-2xl border border-border-faint bg-bg-surface p-5 flex flex-col gap-3 shadow-md shadow-black/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-nexus-primary" />
            <h3 className="text-sm font-semibold text-text-primary">My Tasks</h3>
            <span className="ml-auto text-2xs font-mono text-text-muted">
              tick → <span className="text-emerald-400 font-bold">+1</span> contribution
            </span>
          </div>

          <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[340px] pr-0.5">
            {loadingHub ? (
              <div className="py-10 text-center text-text-muted text-sm font-mono animate-pulse">Loading tasks…</div>
            ) : (
              <AnimatePresence initial={false}>
                {tasks.map(task => (
                  <TaskRow key={task.id} task={task} onToggle={() => handleToggle(task.id)} />
                ))}
              </AnimatePresence>
            )}
          </div>

          <p className="text-2xs text-text-muted pt-2 border-t border-border-faint mt-auto font-mono">
            Items marked <span className="text-amber-400 font-bold">D</span> drip in gradually over the day.
          </p>
        </div>

        {/* Panel 3 — Mentions feed */}
        <div className="rounded-2xl border border-border-faint bg-bg-surface p-5 flex flex-col gap-3 shadow-md shadow-black/20">
          <div className="flex items-center gap-2 mb-1">
            <AtSign className="w-4 h-4 text-nexus-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Mentions</h3>
            {unreadCnt > 0 && (
              <span className="px-1.5 py-0.5 text-2xs font-mono bg-nexus-muted text-nexus-primary border border-nexus-border rounded-md">
                {unreadCnt} new
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 text-2xs text-text-muted">
              <MessageSquare className="w-3 h-3" />
              {mentions.length}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[340px] pr-0.5">
            {loadingHub ? (
              <div className="py-10 text-center text-text-muted text-sm font-mono animate-pulse">Loading messages…</div>
            ) : (
              <AnimatePresence initial={false}>
                {mentions.map(m => (
                  <MentionCard key={m.id} mention={m} onRead={() => handleRead(m.id)} />
                ))}
              </AnimatePresence>
            )}

            {!loadingHub && mentions.length === 0 && (
              <div className="py-10 text-center text-text-muted text-sm">
                No mentions yet
              </div>
            )}
          </div>

          <p className="text-2xs text-text-muted pt-2 border-t border-border-faint mt-auto font-mono">
            Items marked <span className="text-amber-400 font-bold">D</span> appear gradually over time.
            Click to mark as read.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats,    setStats]    = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceLoading) return;
    if (!currentWorkspace) { setLoading(false); return; }

    const loadData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          dashboardApi.getStats(currentWorkspace.id),
          dashboardApi.getTimeline(currentWorkspace.id, 20),
        ]);
        setStats(statsData);
        setActivity(
          activityData.map((log: {
            id: string;
            module: string;
            action: string;
            resource_type?: string;
            created_at: string;
          }) => ({
            id:          log.id,
            module:      log.module as "autofix" | "memory" | "nexus",
            type:        log.action as ActivityItem["type"],
            title:       log.action.replace(/_/g, " "),
            description: `Action performed on ${log.resource_type ?? "system"}`,
            timestamp:   log.created_at,
          }))
        );
      } catch (err) {
        console.warn("Dashboard data load failed (backend may be offline):", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentWorkspace, workspaceLoading]);

  const emptyStats: DashboardStats = {
    nexus:   { queries_today: 0, active_incidents: 0, prs_created: 0, memory_items: 0 },
    memory:  { messages_indexed: 0, tasks_detected: 0, decisions_logged: 0, avg_answer_time_ms: 0 },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border-faint bg-bg-surface p-6"
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#C9B6FF 1px, transparent 1px), linear-gradient(90deg, #C9B6FF 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Ambient orbs */}
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
      <UnifiedStats stats={stats ?? emptyStats} />

      {/* ── Main Content: Activity + Quick Ask ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Activity Feed — 60% */}
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
              <ActivityFeed items={activity} />
            </div>
          </div>
        </div>

        {/* Quick Ask — 40% */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-bg-surface border border-border-faint rounded-2xl overflow-hidden flex-1">
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

          {/* Memory stats mini-card */}
          <div className="bg-bg-surface border border-border-faint rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-memory-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Memory Engine</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Indexed",  value: stats?.memory.messages_indexed  ?? "—" },
                { label: "Insights", value: stats?.memory.decisions_logged   ?? "—" },
                { label: "Tasks",    value: stats?.memory.tasks_detected     ?? "—" },
                { label: "Avg ms",   value: stats?.memory.avg_answer_time_ms ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col rounded-xl bg-bg-elevated border border-border-faint px-3 py-2.5">
                  <span className="text-base font-bold text-text-primary font-mono">{value}</span>
                  <span className="text-2xs text-text-muted mt-0.5">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Hub ─────────────────────────────────────────────── */}
      <PersonalHub />

    </div>
  );
}