import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { metricsApi } from "../services/api";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { staggerContainer, staggerItem } from "../lib/motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Area, AreaChart,
} from "recharts";

const KPI_CONFIG = [
  { key: "total_orders", icon: "📦", label: "Total Orders", color: "#00A896" },
  { key: "total_revenue", icon: "💰", label: "Revenue", color: "#00D264", format: (v) => `₹${(v / 1000).toFixed(1)}K` },
  { key: "active_customers", icon: "👥", label: "Active Customers", color: "#00A896" },
  { key: "pending_orders", icon: "⏳", label: "Pending Orders", color: "#F59E0B" },
  { key: "total_events", icon: "⚡", label: "Total Events", color: "#00D264" },
];

const PIE_COLORS = ["#06B6D4", "#3B82F6", "#6366F1", "#10B981", "#F59E0B"];

const CHART_TOOLTIP = {
  contentStyle: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-default)",
    borderRadius: 12,
    fontSize: 12,
    color: "var(--text-primary)",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "var(--shadow-elevated)",
  },
};

export default function MetricsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchMetrics = async () => {
    try {
      const res = await metricsApi.live();
      setData(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-5 gap-5 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <Skeleton height={14} width="50%" /><div className="h-2" /><Skeleton height={28} width="60%" />
            </div>
          ))}
        </div>
        <Skeleton height={200} rounded={18} /><div className="h-3" /><Skeleton height={280} rounded={18} />
      </div>
    );
  }

  if (!data) return null;

  const biz = data.business_metrics;
  const pipe = data.pipeline_metrics;
  const charts = data.charts;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {KPI_CONFIG.map(({ key, icon, label, color, format }) => (
          <motion.div key={key} variants={staggerItem}>
            <Card className="p-5 group cursor-default">
              <div className="text-lg mb-1">{icon}</div>
              <div
                className="text-xl font-bold truncate"
                style={{ fontFamily: "'Sora', sans-serif", color }}
              >
                {format ? format(biz[key]) : biz[key]?.toLocaleString()}
              </div>
              <div className="text-[11px] mt-1 truncate" style={{ color: "var(--text-muted)" }}>{label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Health Bar */}
      <motion.div variants={staggerItem}>
        <Card className="mb-6 p-5">
          <div
            className="text-xs font-bold tracking-[0.1em] uppercase mb-5"
            style={{ color: "var(--text-muted)" }}
          >
            Pipeline Operations Today
          </div>
          <div className="flex gap-7 flex-wrap">
            {[
              { icon: "✅", label: "Successful", value: pipe.pipelines_succeeded_today, color: "#10B981" },
              { icon: "❌", label: "Failed", value: pipe.pipelines_failed_today, color: "#EF4444" },
              { icon: "⚡", label: "Rows Processed", value: pipe.rows_processed_today?.toLocaleString(), color: "#06B6D4" },
              { icon: "🕐", label: "Data Freshness", value: `${pipe.data_freshness_minutes} min ago`, color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-base">{s.icon}</span>
                <div>
                  <div
                    className="text-base font-bold"
                    style={{ fontFamily: "'Sora', sans-serif", color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Revenue by Region */}
        <motion.div variants={staggerItem}>
          <Card className="px-5 py-4">
            <div
              className="text-xs font-bold tracking-[0.1em] uppercase mb-5"
              style={{ color: "var(--text-muted)" }}
            >
              Revenue by Region
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={charts.revenue_by_region}>
                <XAxis dataKey="region" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip {...CHART_TOOLTIP} />
                <Bar dataKey="revenue" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Orders by Status */}
        <motion.div variants={staggerItem}>
          <Card className="px-5 py-4">
            <div
              className="text-xs font-bold tracking-[0.1em] uppercase mb-5"
              style={{ color: "var(--text-muted)" }}
            >
              Orders by Status
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={charts.orders_by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                  {charts.orders_by_status.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              {charts.orders_by_status.map((s, i) => (
                <div key={s.status} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <div className="w-2 h-2 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.status}: {s.count}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Daily Trend (full width) */}
      <motion.div variants={staggerItem}>
        <Card className="px-5 py-4">
          <div
            className="text-xs font-bold tracking-[0.1em] uppercase mb-5"
            style={{ color: "var(--text-muted)" }}
          >
            Daily Order Trend
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[...(charts.daily_trend || [])].reverse()}>
              <defs>
                <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }}
              />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} fill="url(#orderGradient)" dot={{ r: 3, fill: "#3B82F6" }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revenueGradient)" dot={{ r: 3, fill: "#10B981" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Auto-refresh indicator */}
      <div className="text-center mt-6 text-xs" style={{ color: "var(--text-faint)" }}>
        Auto-refreshes every 30s · Last updated: {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}
