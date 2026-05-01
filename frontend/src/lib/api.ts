import axios from "axios";
import { Workspace, Incident, DocumentChunk } from "./types";


const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/v1";

// --- Types (Remaining UI-only types) ---

export type { Workspace, Incident, DocumentChunk } from "./types";

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  default_branch: string;
  language?: string;
  is_private: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  detected_at: string;
  source_preview?: string;
  assignee_hint?: string;
  jira_ticket_key?: string;
}

export interface Problem {
  id: string;
  title: string;
  description?: string;
  frequency: number;
  severity?: string;
  last_seen: string;
}

export interface Source {
  id: string;
  name: string;
  source_type: string;
  status: string;
  created_at: string;
}


// --- API Client Setup ---

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 errors (expired token) gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Clear stale tokens — the session provider will handle redirect
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    return Promise.reject(error);
  }
);

export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
};

// --- Service Objects ---

export const workspaceApi = {
  list: async () => {
    const res = await api.get<{ workspaces: Workspace[]; total: number }>("/workspace/");
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<Workspace>(`/workspace/${id}`);
    return res.data;
  },
  create: async (name: string, slug: string) => {
    const res = await api.post<Workspace>("/workspace/", { name, slug });
    return res.data;
  },
};

export const memoryApi = {
  listTasks: async (workspaceId: string) => {
    const res = await api.get<Task[]>("/memory/tasks/", { params: { workspace_id: workspaceId } });
    return res.data;
  },
  listProblems: async (workspaceId: string) => {
    const res = await api.get<Problem[]>("/memory/problems/", { params: { workspace_id: workspaceId } });
    return res.data;
  },
  listSources: async (workspaceId: string) => {
    const res = await api.get<Source[]>("/memory/ingest/", { params: { workspace_id: workspaceId } });
    return res.data;
  },
  addSource: async (workspaceId: string, name: string, sourceType: string) => {
    const res = await api.post<Source>("/memory/ingest/document", { workspace_id: workspaceId, name, source_type: sourceType });
    return res.data;
  },
  query: async (workspaceId: string, query: string) => {
    const res = await api.get<{ answer: string; sources: DocumentChunk[] }>("/memory/query/", { params: { workspace_id: workspaceId, query } });
    return res.data;
  },
};


export const autofixApi = {
  listRepos: async (workspaceId: string) => {
    const res = await api.get<Repository[]>("/autofix/repos/", { params: { workspace_id: workspaceId } });
    return res.data;
  },
  connectRepo: async (workspaceId: string, name: string, fullName: string, defaultBranch: string, githubToken?: string) => {
    interface ConnectRepoPayload {
      workspace_id: string;
      name: string;
      full_name: string;
      default_branch: string;
      github_token?: string;
    }
    const payload: ConnectRepoPayload = { workspace_id: workspaceId, name, full_name: fullName, default_branch: defaultBranch };
    if (githubToken) {
      payload.github_token = githubToken;
    }
    const res = await api.post<Repository>("/autofix/repos/connect", payload);
    return res.data;
  },
  listIncidents: async (workspaceId: string) => {
    const res = await api.get<Incident[]>("/autofix/incidents/", { params: { workspace_id: workspaceId } });
    return res.data;
  },
  getIncident: async (id: string) => {
    const res = await api.get<Incident>(`/autofix/incidents/${id}`);
    return res.data;
  },
  updateIncidentStatus: async (id: string, status: string) => {
    const res = await api.patch<Incident>(`/autofix/incidents/${id}/status`, null, { params: { status } });
    return res.data;
  },
  retryIncident: async (id: string) => {
    const res = await api.post<Incident>(`/autofix/incidents/${id}/retry`);
    return res.data;
  },
  createManualIncident: async (workspaceId: string, errorMessage: string, stackTrace?: string, severity?: string) => {
    const res = await api.post<Incident>("/autofix/incidents/manual", {
      workspace_id: workspaceId,
      error_message: errorMessage,
      stack_trace: stackTrace || "",
      severity: severity || "medium",
    });
    return res.data;
  },
  listFixes: async (incidentId: string) => {
    const res = await api.get(`/autofix/fixes/incident/${incidentId}`);
    return res.data;
  },
};


export const dashboardApi = {
  getStats: async (workspaceId: string) => {
    const res = await api.get("/dashboard/stats", { params: { workspace_id: workspaceId } });
    return res.data;
  },
  getTimeline: async (workspaceId: string, limit?: number) => {
    const res = await api.get("/dashboard/timeline", { params: { workspace_id: workspaceId, limit } });
    return res.data;
  },
  getIncidentSeries: async (workspaceId: string, days?: number) => {
    const res = await api.get("/dashboard/incidents/series", { params: { workspace_id: workspaceId, days } });
    return res.data;
  },
};


export const authApi = {
  register: async (email: string, name: string, password: string) => {
    const res = await api.post("/auth/register", { email, name, password });
    return res.data;
  },
  login: async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
};


export default api;
