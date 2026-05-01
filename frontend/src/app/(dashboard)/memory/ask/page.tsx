"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChatInput } from "@/components/memory/ChatInput";
import { AnswerCard } from "@/components/memory/AnswerCard";
import { Brain, Sparkles } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { memoryApi, workspaceApi } from "@/lib/api";

import { useWorkspaceStore } from "@/store/workspaceStore";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<Record<string, unknown>>;
  confidence?: number;
  timestamp?: string;
}

export default function MemoryAskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?.id;

  const handleSubmit = (message: string) => {
    if (!workspaceId) return;

    const newUserMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    memoryApi.query(workspaceId, message)
      .then((res) => {
        const aiResponse: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: res.answer,
          sources: res.sources as unknown as Array<Record<string, unknown>>,
          confidence: 0.9,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
      })
      .catch(() => {
        const errorResponse: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: "I'm having trouble connecting to the memory service right now. Please make sure the backend is running.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorResponse]);
        setIsTyping(false);
      });
  };


  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-faint shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-memory-primary" />
          <h1 className="text-lg font-semibold gradient-text-memory">
            Ask Your Team&apos;s Memory
          </h1>
        </div>
        <p className="text-xs text-text-muted mt-1 ml-4">
          Search through team decisions, discussions, and documented knowledge
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-memory-muted border border-memory-border flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-memory-primary" />
              </div>
              <h2 className="text-lg font-medium text-text-primary mb-2">
                What would you like to know?
              </h2>
              <p className="text-sm text-text-secondary max-w-md">
                Ask questions about your team&apos;s past discussions, decisions, and documented knowledge. I&apos;ll search through all indexed sources.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  "What was decided about the caching strategy?",
                  "Who set up the CI/CD pipeline?",
                  "What are the known issues with auth?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSubmit(suggestion)}
                    className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-faint text-xs text-text-secondary hover:border-memory-primary/50 hover:text-memory-primary transition-all"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1.5 text-memory-primary/50" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              {msg.role === "user" ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-bg-elevated rounded-xl px-4 py-3 max-w-[70%]"
                >
                  <p className="text-sm text-text-primary">{msg.content}</p>
                  <p className="text-2xs text-text-muted mt-1.5 text-right font-mono">
                    {msg.timestamp ? formatRelativeTime(msg.timestamp) : "just now"}
                  </p>
                </motion.div>
              ) : (
                <AnswerCard
                  content={msg.content}
                  sources={msg.sources}
                  confidence={msg.confidence}
                />
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-4"
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-memory-primary animate-pulse-dot" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-memory-primary animate-pulse-dot" style={{ animationDelay: "200ms" }} />
                <div className="w-2 h-2 rounded-full bg-memory-primary animate-pulse-dot" style={{ animationDelay: "400ms" }} />
              </div>
              <span className="text-2xs text-memory-primary">Searching memory...</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSubmit={handleSubmit} disabled={isTyping} />
    </div>
  );
}
