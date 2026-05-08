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

// ─── Chat turn type ───────────────────────────────────────────────────────────

interface ChatTurn {
  id: string;
  question: string;
  answer: { answer: string; sources: { text: string }[] } | null;
}

// ─── MessageBubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  index,
  checked,
  onCheck,
}: {
  msg: SlackMessage;
  index: number;
  checked: boolean;
  onCheck: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const name = getDisplayName(msg);
  const channel = getChannelDisplay(msg);
  const ts = getTimestamp(msg);
  const initial = name.charAt(0).toUpperCase();

  // First line only (up to first newline, or first 80 chars)
  const firstLine = msg.text.split("\n")[0].slice(0, 80);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.5) }}
      className="flex items-start gap-3 group py-1"
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onCheck(msg.id)}
        className="mt-1.5 w-3.5 h-3.5 shrink-0 cursor-pointer accent-purple-500"
        aria-label={`Select message from ${name}`}
      />

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

        {/* Collapsed: first line only. Expanded: full message */}
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.p
              key="full"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words overflow-hidden"
            >
              {msg.text}
            </motion.p>
          ) : (
            <motion.p
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-text-secondary leading-relaxed truncate"
            >
              {firstLine}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Circular "i" button — always present */}
      <button
        onClick={() => setExpanded((v) => !v)}
        title={expanded ? "Collapse" : "Show full message"}
        className={cn(
          "w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 mt-1 transition-colors select-none",
          expanded
            ? "bg-purple-600 border-purple-600 text-white"
            : "border-border-faint text-text-muted hover:border-purple-500 hover:text-purple-400"
        )}
        aria-label={expanded ? "Collapse message" : "Show full message"}
      >
        i
      </button>
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

// ─── ChatHistoryItem ─────────────────────────────────────────────────────────

function ChatHistoryItem({
  turn,
  checked,
  onCheck,
}: {
  turn: ChatTurn;
  checked: boolean;
  onCheck: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      {/* Question row */}
      <div className="flex items-start gap-2 group">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onCheck(turn.id)}
          className="mt-1 w-3.5 h-3.5 shrink-0 cursor-pointer accent-purple-500"
          aria-label={`Select question: ${turn.question}`}
        />

        <div className="flex-1 rounded-lg bg-bg-elevated border border-border-faint px-3 py-2 text-sm text-text-primary">
          {turn.question}
        </div>

        {/* Circular "i" button — shows/hides answer */}
        <button
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? "Collapse answer" : "View answer"}
          className={cn(
            "w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 mt-1 transition-colors select-none",
            expanded
              ? "bg-purple-600 border-purple-600 text-white"
              : "border-border-faint text-text-muted hover:border-purple-500 hover:text-purple-400"
          )}
          aria-label={expanded ? "Collapse" : "Show answer"}
        >
          i
        </button>
      </div>

      {/* Answer: always behind "i" button */}
      <AnimatePresence>
        {expanded && turn.answer && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-5 overflow-hidden"
          >
            <AiAnswer answer={turn.answer.answer} sources={turn.answer.sources} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Tab = "inbox" | "ask";

export default function MemoryAskPage() {
  const [tab, setTab] = useState<Tab>("inbox");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Inbox
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [checkedMsgs, setCheckedMsgs] = useState<Set<string>>(new Set());
  const [msgLoading, setMsgLoading] = useState(true);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Ask
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [asking, setAsking] = useState(false);
  const [checkedTurns, setCheckedTurns] = useState<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    workspaceApi
      .list()
      .then(({ workspaces }) => {
        if (workspaces?.length) setWorkspaceId(workspaces[0].id);
      })
      .catch(console.error);
  }, []);

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

  // Inbox checkboxes
  const toggleMsg = (id: string) =>
    setCheckedMsgs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allMsgsChecked =
    filtered.length > 0 && filtered.every((m) => checkedMsgs.has(m.id));

  const toggleAllMsgs = () => {
    if (allMsgsChecked) {
      setCheckedMsgs((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setCheckedMsgs((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.add(m.id));
        return next;
      });
    }
  };

  // Chat turn checkboxes
  const toggleTurn = (id: string) =>
    setCheckedTurns((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allTurnsChecked =
    chatHistory.length > 0 && chatHistory.every((t) => checkedTurns.has(t.id));

  const toggleAllTurns = () => {
    if (allTurnsChecked) {
      setCheckedTurns(new Set());
    } else {
      setCheckedTurns(new Set(chatHistory.map((t) => t.id)));
    }
  };

  async function handleAsk() {
    if (!question.trim() || !workspaceId || asking) return;
    const q = question.trim();
    setAsking(true);
    setQuestion("");

    const turnId = `turn-${Date.now()}`;
    setChatHistory((prev) => [...prev, { id: turnId, question: q, answer: null }]);

    try {
      const result = await memoryApi.query(workspaceId, q);
      setChatHistory((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? { ...t, answer: result as { answer: string; sources: { text: string }[] } }
            : t
        )
      );
    } catch (err) {
      console.error("Query failed:", err);
      setChatHistory((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? { ...t, answer: { answer: "Something went wrong. Please try again.", sources: [] } }
            : t
        )
      );
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
            {t === "inbox"
              ? `Inbox${messages.length ? ` (${messages.length})` : ""}`
              : "Ask AI"}
          </button>
        ))}
      </div>

      {/* ── INBOX ── */}
      {tab === "inbox" && (
        <div className="space-y-3">
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

          <div className="bg-bg-surface border border-border-faint rounded-xl min-h-[240px]">
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
                {/* Select all */}
                <div className="flex items-center gap-2 pb-2 border-b border-border-faint/50">
                  <input
                    type="checkbox"
                    checked={allMsgsChecked}
                    onChange={toggleAllMsgs}
                    className="w-3.5 h-3.5 cursor-pointer accent-purple-500"
                    aria-label="Select all messages"
                  />
                  <span className="text-2xs text-text-muted">
                    {checkedMsgs.size > 0 ? `${checkedMsgs.size} selected` : "Select all"}
                  </span>
                </div>

                <AnimatePresence mode="popLayout">
                  {filtered.map((msg, i) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      index={i}
                      checked={checkedMsgs.has(msg.id)}
                      onCheck={toggleMsg}
                    />
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
          {/* Chat history */}
          {chatHistory.length > 0 && (
            <div className="space-y-4">
              {/* Select all turns */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allTurnsChecked}
                  onChange={toggleAllTurns}
                  className="w-3.5 h-3.5 cursor-pointer accent-purple-500"
                  aria-label="Select all chat turns"
                />
                <span className="text-2xs text-text-muted">
                  {checkedTurns.size > 0 ? `${checkedTurns.size} selected` : "Select all"}
                </span>
              </div>

              {chatHistory.map((turn, idx) => (
                <ChatHistoryItem
                  key={turn.id}
                  turn={turn}
                  checked={checkedTurns.has(turn.id)}
                  onCheck={toggleTurn}
                />
              ))}

              {asking && (
                <div className="flex items-center gap-2 ml-5 text-text-muted text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Searching memory…
                </div>
              )}
            </div>
          )}

          {/* Input box */}
          <div className="bg-bg-surface border border-border-faint rounded-xl p-4">
            <p className="text-2xs text-text-muted font-medium uppercase tracking-wider mb-2">
              {chatHistory.length > 0 ? "Ask a follow-up" : "Your question"}
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

          {chatHistory.length === 0 && !asking && (
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