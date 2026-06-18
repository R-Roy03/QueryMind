import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import {
  Search, Database, Bot, GitBranch, Shield,
  LayoutDashboard, Activity, ShieldCheck,
  Sun, Moon, ChevronLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",    icon: LayoutDashboard, color: "#3B82F6" },
  { id: "query",      label: "Query",        icon: Search,          color: "#06B6D4" },
  { id: "agent",      label: "Agent",        icon: Bot,             color: "#8B5CF6" },
  { id: "pipeline",   label: "Pipeline",     icon: GitBranch,       color: "#10B981" },
  { id: "monitor",    label: "Monitor",      icon: Activity,        color: "#F59E0B" },
  { id: "governance", label: "Governance",   icon: ShieldCheck,     color: "#EF4444" },
  { id: "schema",     label: "Schema",       icon: Database,        color: "#6366F1" },
  { id: "quality",    label: "Data Quality", icon: Shield,          color: "#EC4899" },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        h-screen flex flex-col flex-shrink-0 transition-all duration-300 ease-out
        border-r
        ${collapsed ? "w-16" : "w-60"}
      `}
      style={{
        background: "var(--bg-sidebar)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <img
          src="/logo.png"
          alt="QueryMind"
          className="w-8 h-8 rounded-lg flex-shrink-0 object-cover"
        />
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="text-[15px] font-bold tracking-tight"
              style={{ fontFamily: "'Sora', sans-serif", color: "var(--text-primary)" }}
            >
              QueryMind
            </div>
            <div
              className="text-[11px] uppercase tracking-widest mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Data Intelligence
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, icon: Icon, label, color }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              id={`nav-${id}`}
              onClick={() => onNavigate(id)}
              className={`
                w-full flex items-center gap-3 rounded-lg border-none transition-all duration-200
                cursor-pointer relative
                ${collapsed ? "justify-center px-2.5 py-2.5" : "px-3 py-2.5"}
              `}
              style={{
                background: isActive ? "var(--accent-cyan-bg)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}40`,
                    left: "-10px",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isActive ? `${color}18` : "transparent",
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} style={{ color: isActive ? color : "inherit" }} />
              </div>
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t px-2.5 py-2" style={{ borderColor: "var(--border-default)" }}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer border-none"
          style={{ color: "var(--text-muted)", fontSize: 12, background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          {!collapsed && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer border-none"
          style={{ color: "var(--text-muted)", fontSize: 12, background: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <ChevronLeft
            size={15}
            className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* DB Status */}
      <DbStatus collapsed={collapsed} />
    </aside>
  );
}

function DbStatus({ collapsed }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/db/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  const dbType = status?.db_type || "postgresql";
  const dbName = status?.db_name || "connecting...";
  const connected = status?.connected !== false;

  return (
    <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border-default)" }}>
      <div className="flex items-center gap-2" style={{ opacity: 0.6 }}>
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: connected ? "var(--color-success)" : "var(--color-error)",
          }}
        />
        {!collapsed && (
          <div className="min-w-0">
            <div
              className="text-[10px] truncate"
              style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {dbName} · {dbType.toUpperCase()} · {connected ? "connected" : "offline"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
