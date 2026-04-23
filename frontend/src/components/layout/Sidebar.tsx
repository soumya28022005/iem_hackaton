"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FolderOpen,
  CheckSquare,
  AlertTriangle,
  AlertCircle,
  GitBranch,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

const memoryNavItems = [
  { label: "Ask", href: "/memory/ask", icon: Search },
  { label: "Sources", href: "/memory/sources", icon: FolderOpen },
  { label: "Tasks", href: "/memory/tasks", icon: CheckSquare },
  { label: "Problems", href: "/memory/problems", icon: AlertTriangle },
];

const autofixNavItems = [
  { label: "Incidents", href: "/autofix/incidents", icon: AlertCircle },
  { label: "Repositories", href: "/autofix/repos", icon: GitBranch },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  collapsed,
  onClick,
  indicatorColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
  indicatorColor: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 relative group",
        isActive
          ? "text-text-primary font-medium"
          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
      )}
      style={isActive ? { backgroundColor: `${indicatorColor}12` } : undefined}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
          style={{ backgroundColor: indicatorColor }}
        />
      )}
      <Icon
        className="w-4 h-4 shrink-0 transition-colors"
        style={isActive ? { color: indicatorColor } : undefined}
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setActiveModule } = useWorkspaceStore();

  const handleNavClick = (module: "memory" | "autofix" | "nexus") => {
    setActiveModule(module);
    onMobileClose();
  };

  const handleLogout = async () => {
    try {
      // Sign out of Firebase
      await firebaseSignOut(firebaseAuth);
    } catch (e) {
      console.error("Firebase sign-out error:", e);
    }
    // Clear backend tokens
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    // Sign out of NextAuth and redirect to login
    await signOut({ redirect: false });
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-border-faint shrink-0 transition-all",
          collapsed ? "px-3 justify-center" : "px-4 gap-3"
        )}
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-nexus-primary/40 to-nexus-primary/10 border border-nexus-border flex items-center justify-center">
            <Brain className="w-4 h-4 text-nexus-primary" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-bg-surface border border-bg-surface flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse-dot" />
          </div>
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="flex flex-col min-w-0"
          >
            <span className="text-sm font-semibold text-text-primary tracking-tight leading-none">
              NexusOps
            </span>
            <span className="text-2xs text-text-muted font-mono mt-0.5">v2.0.4</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {/* Dashboard */}
        <div>
          <NavItem
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            isActive={pathname === "/dashboard"}
            collapsed={collapsed}
            onClick={() => handleNavClick("nexus")}
            indicatorColor="#8b5cf6"
          />
        </div>

        {/* Memory Section */}
        <div>
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-memory-primary opacity-60" />
              <span className="text-2xs font-semibold uppercase tracking-widest text-text-muted">
                Memory
              </span>
            </div>
          )}
          {collapsed && <div className="h-px bg-border-faint mx-1 mb-1.5" />}
          <div className="space-y-0.5">
            {memoryNavItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
                collapsed={collapsed}
                onClick={() => handleNavClick("memory")}
                indicatorColor="#22d3ee"
              />
            ))}
          </div>
        </div>

        {/* AutoFix Section */}
        <div>
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-autofix-primary opacity-60" />
              <span className="text-2xs font-semibold uppercase tracking-widest text-text-muted">
                AutoFix
              </span>
            </div>
          )}
          {collapsed && <div className="h-px bg-border-faint mx-1 mb-1.5" />}
          <div className="space-y-0.5">
            {autofixNavItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname.startsWith(item.href)}
                collapsed={collapsed}
                onClick={() => handleNavClick("autofix")}
                indicatorColor="#f59e0b"
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom: Settings + Collapse */}
      <div className="border-t border-border-faint p-2 space-y-0.5 shrink-0">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all duration-150"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={onToggle}
          className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-all duration-150 w-full"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-bg-surface border-r border-border-faint z-30 transition-all duration-200",
          collapsed ? "w-14" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-bg-surface border-r border-border-faint z-50 md:hidden"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-3 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
