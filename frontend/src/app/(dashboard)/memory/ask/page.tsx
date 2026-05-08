"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Hash,
  Send,
  Loader2,
  MessageSquare,
  Inbox,
  Search,
  BotMessageSquare,
  RefreshCw,
} from "lucide-react";
import { memoryApi, workspaceApi, SlackMessage } from "@/lib/api";

// ─── helpers ────────────────────────────────────────────────────────────────

function relTime(ts: string | null | undefined): string {
  if (!ts) return "";
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  } catch {
    return "";
  }
}

function getDisplayName(msg: SlackMessage): string {
  // Try direct sender field first, then metadata
  const meta = msg.metadata as Record<string, string> | null;
  const raw = msg.sender || meta?.sender || "";
  if (!raw || raw === "unknown") return "Unknown";
  return raw;
}

function getChannelDisplay(msg: SlackMessage): string {
  const meta = msg.metadata as Record<string, string> | null;
  return msg.channel_name || meta?.channel_name || meta?.channel_id || "general";
}

function getTimestamp(msg: SlackMessage): string {
  return msg.timestamp || msg.created_at || "";
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500/20 text-blue-400",
    "bg-purple-500/20 text-purple-400",
    "bg-green-500/20 text-green-400",
    "bg-orange-500/20 text-orange-400",
    "bg-pink-500/20 text-pink-400",
    "bg-cyan-500/20 text-cyan-400",
  ];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[hash];
}

// ─── MessageBubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, index }: { msg: SlackMessage; index: number }) {
  const name = getDisplayName(msg);
  const channel = getChannelDisplay(msg);
  const ts = getTimestamp(msg);
  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.5) }}
      className="flex items-start gap-3 group py-1"
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
          avatarColor(name)
        )}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-xs font-semibold text-text-primary">{name}</span>
          <span className="flex items-center gap-0.5 text-2xs text-text-muted">
            <Hash className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate max-w-[120px]">{channel}</span>
          </span>
          <span className="text-2xs text-text-muted ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {relTime(ts)}
          </span>
        </div>

        {/* Text */}
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
          {msg.text}
        </p>
      </div>
    </motion.div>
  );
}

// ─── AI Answer ───────────────────────────────────────────────────────────────

function AiAnswer({
  answer,
  sources,
}: {
  answer: string;
  sources: { text: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-memory-border/40 bg-memory-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-memory-primary text-xs font-semibold">
        <BotMessageSquare className="w-4 h-4" />
        NexusOps Memory
      </div>
      <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
        {answer}
      </p>
      {sources.length > 0 && (
        <details className="text-2xs text-text-muted">
          <summary className="cursor-pointer hover:text-text-secondary transition-colors select-none">
            {sources.length} source{sources.length !== 1 ? "s" : ""} used
          </summary>
          <ul className="mt-2 space-y-1 pl-2 border-l border-border-faint">
            {sources.map((s, i) => (
              <li key={i} className="truncate">
                {s.text.slice(0, 120)}…
              </li>
            ))}
          </ul>
        </details>
      )}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Tab = "inbox" | "ask";

export default function MemoryAskPage() {
  const [tab, setTab] = useState<Tab>("inbox");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Inbox
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Ask
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{
    answer: string;
    sources: { text: string }[];
  } | null>(null);
  const [asking, setAsking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load workspace
  useEffect(() => {
    workspaceApi
      .list()
      .then(({ workspaces }) => {
        if (workspaces?.length) setWorkspaceId(workspaces[0].id);
      })
      .catch(console.error);
  }, []);

  // Load Slack messages
  const loadMessages = (wsId: string) => {
    setMsgLoading(true);
    setMsgError(null);
    memoryApi
      .getMessages(wsId, "slack", 100)
      .then((data) => setMessages(data))
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setMsgError("Could not load messages. Is the backend running?");
      })
      .finally(() => setMsgLoading(false));
  };

  useEffect(() => {
    if (workspaceId) loadMessages(workspaceId);
  }, [workspaceId]);

  const filtered = messages.filter(
    (m) =>
      !search ||
      m.text.toLowerCase().includes(search.toLowerCase()) ||
      getDisplayName(m).toLowerCase().includes(search.toLowerCase()) ||
      getChannelDisplay(m).toLowerCase().includes(search.toLowerCase())
  );

  async function handleAsk() {
    if (!question.trim() || !workspaceId || asking) return;
    setAsking(true);
    setAnswer(null);
    try {
      const result = await memoryApi.query(workspaceId, question.trim());
      setAnswer(result as { answer: string; sources: { text: string }[] });
    } catch (err) {
      console.error("Query failed:", err);
      setAnswer({
        answer: "Something went wrong. Please try again.",
        sources: [],
      });
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Memory
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          All Slack messages stored in memory — browse or query with AI.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-bg-elevated rounded-lg w-fit border border-border-faint">
        {(["inbox", "ask"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === t
                ? "bg-bg-surface text-text-primary shadow-sm border border-border-faint"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {t === "inbox" ? (
              <Inbox className="w-3.5 h-3.5" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5" />
            )}
            {t === "inbox" ? `Inbox${messages.length ? ` (${messages.length})` : ""}` : "Ask AI"}
          </button>
        ))}
      </div>

      {/* ── INBOX ── */}
      {tab === "inbox" && (
        <div className="space-y-3">
          {/* Search + refresh */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages, senders, channels…"
                className="w-full bg-bg-surface border border-border-faint rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-memory-border transition-colors"
              />
            </div>
            {workspaceId && (
              <button
                onClick={() => loadMessages(workspaceId)}
                disabled={msgLoading}
                title="Refresh"
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-border-faint bg-bg-surface text-text-muted hover:text-text-primary hover:border-border-default transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", msgLoading && "animate-spin")} />
              </button>
            )}
          </div>

          {/* Message list */}
          <div className="bg-bg-surface border border-border-faint rounded-xl divide-y divide-border-faint/50 min-h-[240px]">
            {msgLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-text-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Slack messages…
              </div>
            ) : msgError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <p className="text-sm text-sev-high">{msgError}</p>
                {workspaceId && (
                  <button
                    onClick={() => loadMessages(workspaceId)}
                    className="text-xs text-memory-primary hover:underline mt-1"
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2 px-4">
                <Inbox className="w-8 h-8 text-text-muted mb-1" />
                <p className="text-text-secondary text-sm font-medium">
                  {search ? "No messages match your search" : "No Slack messages stored yet"}
                </p>
                <p className="text-text-muted text-xs max-w-xs">
                  {search
                    ? "Try a different search term."
                    : "Messages will appear here automatically once your Slack bot receives them."}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((msg, i) => (
                    <MessageBubble key={msg.id} msg={msg} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {!msgLoading && !msgError && filtered.length > 0 && (
            <p className="text-2xs text-text-muted text-right">
              {filtered.length} message{filtered.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
            </p>
          )}
        </div>
      )}

      {/* ── ASK AI ── */}
      {tab === "ask" && (
        <div className="space-y-4">
          <div className="bg-bg-surface border border-border-faint rounded-xl p-4">
            <p className="text-2xs text-text-muted font-medium uppercase tracking-wider mb-2">
              Your question
            </p>
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="e.g. What was the server issue about?"
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end mt-3 pt-3 border-t border-border-faint">
              <button
                onClick={handleAsk}
                disabled={!question.trim() || asking}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  question.trim() && !asking
                    ? "bg-memory-primary text-white hover:opacity-90"
                    : "bg-bg-elevated text-text-muted cursor-not-allowed"
                )}
              >
                {asking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Ask
                  </>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {answer && (
              <AiAnswer answer={answer.answer} sources={answer.sources} />
            )}
          </AnimatePresence>

          {!answer && !asking && (
            <div className="text-center py-10 text-text-muted text-xs space-y-1">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>Ask anything about your team&apos;s Slack conversations.</p>
              <p className="opacity-60">
                The AI searches all stored messages to find the answer.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}