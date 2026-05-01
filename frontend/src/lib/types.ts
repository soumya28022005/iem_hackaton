export type ActiveModule = "memory" | "autofix" | "nexus";
export type Severity = "critical" | "high" | "medium" | "low";


export type IncidentStatus = 
  | "received" | "sanitizing" | "fetching_code" | "analyzing" 
  | "querying_memory" | "generating_fix" | "safety_check" 
  | "creating_pr" | "pr_created" | "fix_blocked" | "failed" 
  | "resolved" | "dismissed";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  telegram_chat_id?: string | null;
  default_branch: string;
  auto_revert_enabled: boolean;
  notify_on_pr: boolean;
  notify_on_revert: boolean;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  workspace_id: string;
  repository_id?: string | null;
  error_type?: string | null;
  error_message?: string | null;
  severity: Severity;
  status: IncidentStatus;
  environment: string;
  source: string;
  root_cause?: string | null;
  raw_stack_trace?: string | null;
  sanitized_error?: string | null;
  affected_files?: string[] | null;
  analysis_confidence?: number | null;
  memory_context?: {
    related_discussions: string[];
    query: string;
    matches_found: number;
    insight: string;
  } | null;
  pr_url?: string | null;
  pr_number?: number | null;
  pr_created_at?: string | null;
  pipeline_error?: string | null;
  received_at: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  source_id: string;
  content: string;
  metadata: Record<string, unknown>;
  score?: number;
}





export interface ActivityItem {
  id: string;
  module: ActiveModule;
  type: 
    | "memory_query" | "incident_received" | "pr_created" 
    | "task_detected" | "memory_enrichment" | "source_ingested"
    | "fix_generated" | "fix_approved" | "fix_rejected" | "fix_needs_changes"
    | "incident_updated" | "pr_merged" | "deployment_failed";
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  nexus: {
    queries_today: number;
    active_incidents: number;
    prs_created: number;
    memory_items: number;
  };
  memory: {
    messages_indexed: number;
    tasks_detected: number;
    decisions_logged: number;
    avg_answer_time_ms: number;
  };
  autofix: {
    total_incidents: number;
    avg_mttr_seconds: number;
    auto_reverts: number;
    safety_blocks: number;
  };
}
