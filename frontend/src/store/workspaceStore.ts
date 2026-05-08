"use client";

import { create } from "zustand";
import { workspaceApi, type Workspace } from "@/lib/api";

type ActiveModule = "memory" | "autofix" | "nexus";

interface WorkspaceStore {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
  activeModule: ActiveModule;

  setCurrentWorkspace: (ws: Workspace) => void;
  setActiveModule: (module: ActiveModule) => void;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, slug: string) => Promise<Workspace>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
  error: null,
  activeModule: "nexus",

  setCurrentWorkspace: (ws) => set({ currentWorkspace: ws }),
  setActiveModule: (module) => set({ activeModule: module }),

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await workspaceApi.list();
      const workspaces = data.workspaces;
      set({
        workspaces,
        currentWorkspace: workspaces[0] || get().currentWorkspace,
        isLoading: false,
      });
    } catch (err: any) {
      console.error("Backend fetch error:", err.message);
      set({
        workspaces: [],
        currentWorkspace: null,
        isLoading: false,
        error: "Failed to connect to real backend",
      });
    }
  },

  createWorkspace: async (name: string, slug: string) => {
    const ws = await workspaceApi.create(name, slug);
    set((state) => ({
      workspaces: [ws, ...state.workspaces],
      currentWorkspace: ws,
    }));
    return ws;
  },
}));