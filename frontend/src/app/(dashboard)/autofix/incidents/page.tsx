"use client";


import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { autofixApi, workspaceApi, Incident, Repository } from "@/lib/api";
import { Plus, X, AlertTriangle, Send } from "lucide-react";

const filters = ["All", "Active", "Resolved", "Dismissed"] as const;

export default function IncidentsPage() {
  const [activeFilter, setActiveFilter] = useState<typeof filters[number]>("All");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [repos, setRepos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  // Create form state
  const [errorMessage, setErrorMessage] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { workspaces } = await workspaceApi.list();
      if (workspaces && workspaces.length > 0) {
        const wsId = workspaces[0].id;
        setWorkspaceId(wsId);
        const [incidentsData, reposData] = await Promise.all([
          autofixApi.listIncidents(wsId),
          autofixApi.listRepos(wsId)
        ]);
        setIncidents(incidentsData);
        
        const repoMap: Record<string, string> = {};
        reposData.forEach((r: Repository) => repoMap[r.id] = r.full_name || r.name);
        setRepos(repoMap);
      }
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !errorMessage.trim()) return;
    
    setCreateLoading(true);
    try {
      const newIncident = await autofixApi.createManualIncident(
        workspaceId, errorMessage, stackTrace, severity
      );
      setIncidents(prev => [newIncident, ...prev]);
      setShowCreateModal(false);
      setErrorMessage("");
      setStackTrace("");
      setSeverity("medium");
    } catch (err) {
      console.error("Failed to create incident:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  const filtered = incidents.filter((i) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Active")
      return !["resolved", "dismissed", "pr_created"].includes(i.status);
    if (activeFilter === "Resolved")
      return i.status === "resolved" || i.status === "pr_created";
    if (activeFilter === "Dismissed") return i.status === "dismissed";
    return true;
  });

  if (loading) return <div className="p-8 text-center text-text-muted text-sm animate-pulse">Loading Incidents...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Incidents
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Production errors monitored by the AutoFix Engine
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-autofix-primary hover:bg-autofix-hover text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Report Error
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 p-1 bg-bg-surface border border-border-faint rounded-xl w-fit">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeFilter === filter
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      

      {/* Create Manual Incident Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-surface border border-border-faint rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-border-faint flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-autofix-primary" />
                  <h2 className="text-sm font-semibold text-text-primary">Report Manual Error</h2>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Error Message *</label>
                  <input
                    type="text"
                    value={errorMessage}
                    onChange={(e) => setErrorMessage(e.target.value)}
                    required
                    placeholder="e.g., TypeError: Cannot read property 'id' of undefined"
                    className="w-full px-3 py-2.5 bg-bg-elevated border border-border-faint rounded-lg text-sm text-text-primary placeholder-text-muted focus:ring-1 focus:ring-autofix-primary focus:border-autofix-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Stack Trace (optional)</label>
                  <textarea
                    value={stackTrace}
                    onChange={(e) => setStackTrace(e.target.value)}
                    rows={5}
                    placeholder="Paste the stack trace here..."
                    className="w-full px-3 py-2.5 bg-bg-elevated border border-border-faint rounded-lg text-xs font-mono text-text-code placeholder-text-muted focus:ring-1 focus:ring-autofix-primary focus:border-autofix-primary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Severity</label>
                  <div className="flex gap-2">
                    {["critical", "high", "medium", "low"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverity(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
                          severity === s
                            ? s === "critical" ? "bg-red-500/20 border-red-500/50 text-red-400" :
                              s === "high" ? "bg-orange-500/20 border-orange-500/50 text-orange-400" :
                              s === "medium" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" :
                              "bg-blue-500/20 border-blue-500/50 text-blue-400"
                            : "bg-bg-elevated border-border-faint text-text-muted hover:text-text-secondary"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createLoading || !errorMessage.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-autofix-primary hover:bg-autofix-hover text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {createLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit to AutoFix Engine
                    </>
                  )}
                </button>
                <p className="text-2xs text-text-muted text-center">
                  The AI will analyze this error, query team memory for context, and generate a fix automatically.
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
