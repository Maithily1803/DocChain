"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  fetchDashboardData,
  type DashboardData,
  type InstitutionStats,
  type FraudAlert,
} from "@/lib/dashboardUtils";
import { connectWallet } from "@/lib/contractUtils";
import {
  Building2, ShieldCheck, ShieldOff, AlertTriangle,
  RefreshCw, Wallet, ChevronDown, ChevronUp,
  TrendingUp, Users, FileText, Clock, ExternalLink,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CHART_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6"];

const SEVERITY_STYLES: Record<FraudAlert["severity"], string> = {
  HIGH: "border-red-300 bg-red-50 text-red-900",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-900",
  LOW: "border-blue-300 bg-blue-50 text-blue-900",
};

const SEVERITY_BADGE: Record<FraudAlert["severity"], string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <span className={`p-2 rounded-lg ${accent}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AlertCard({ alert }: { alert: FraudAlert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${SEVERITY_STYLES[alert.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{alert.type.replace("_", " ")}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[alert.severity]}`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-sm mt-0.5 leading-snug">{alert.description}</p>
          </div>
        </div>
        {(alert.hashes.length > 0 || alert.addresses.length > 1) && (
          <button onClick={() => setExpanded((v) => !v)} className="shrink-0 mt-0.5">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="text-xs space-y-1 pt-1 border-t border-current/20 font-mono">
          {alert.addresses.map((a) => (
            <div key={a} className="flex items-center gap-2">
              <span>Issuer:</span>
              <a
                href={`https://sepolia.etherscan.io/address/${a}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {a}
              </a>
            </div>
          ))}
          {alert.hashes.slice(0, 3).map((h) => (
            <div key={h} className="truncate">
              <span className="mr-1">Hash:</span>{h.slice(0, 32)}…
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstitutionRow({
  inst,
  rank,
}: {
  inst: InstitutionStats;
  rank: number;
}) {
  const [open, setOpen] = useState(false);

  const revokeRate =
    inst.totalIssued > 0
      ? ((inst.totalRevoked / inst.totalIssued) * 100).toFixed(1)
      : "0.0";

  const pieData = Object.entries(inst.byCategory).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-4 py-3 text-sm text-muted-foreground w-10">{rank}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <a
              href={`https://sepolia.etherscan.io/address/${inst.address}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {shortAddr(inst.address)}
            </a>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </div>
        </td>
        <td className="px-4 py-3 text-sm tabular-nums font-medium">
          {inst.totalIssued}
        </td>
        <td className="px-4 py-3 text-sm tabular-nums text-emerald-700 font-medium">
          {inst.activeCount}
        </td>
        <td className="px-4 py-3 text-sm tabular-nums text-red-600">
          {inst.totalRevoked}
        </td>
        <td className="px-4 py-3 text-sm">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              parseFloat(revokeRate) > 10
                ? "bg-red-100 text-red-700"
                : parseFloat(revokeRate) > 3
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {revokeRate}%
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {inst.lastActivity?.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "2-digit",
          }) ?? "—"}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </td>
      </tr>

      {open && (
        <tr className="bg-muted/20">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Issuance – Last 30 Days
                </p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={inst.issuanceTimeline} barSize={4}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => [v, "Documents Issued"]}
labelFormatter={(d) => fmtDate(String(d))}
                      contentStyle={{ fontSize: 11 }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {pieData.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    By Document Type
                  </p>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={40}
                        dataKey="value"
                        label={({ name, percent }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(inst.byCategory).map(([cat, cnt]) => (
                <span
                  key={cat}
                  className="text-xs bg-muted border border-border rounded-full px-3 py-0.5"
                >
                  {cat}: <strong>{cnt}</strong>
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "institutions" | "fraud"
  >("overview");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    }
  };

  const TABS = [
    { key: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
    {
      key: "institutions",
      label: "Institutions",
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      key: "fraud",
      label: `Fraud Alerts${data?.fraudAlerts.length ? ` (${data.fraudAlerts.length})` : ""}`,
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Institution Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live blockchain analytics · Multi-institution overview · Fraud detection
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleConnect}>
              <Wallet className="w-4 h-4 mr-2" />
              {walletAddress ? shortAddr(walletAddress) : "Connect"}
            </Button>

            <Button size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {data && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last updated: {data.fetchedAt.toLocaleTimeString()}
          </p>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText className="w-4 h-4" />}
            label="Total Issued"
            value={loading ? "…" : data?.globalTotalIssued ?? 0}
            sub="All institutions"
            accent="bg-indigo-100 text-indigo-600"
          />

          <StatCard
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Active Certs"
            value={loading ? "…" : data?.globalActiveCount ?? 0}
            sub="Valid today"
            accent="bg-emerald-100 text-emerald-600"
          />

          <StatCard
            icon={<ShieldOff className="w-4 h-4" />}
            label="Revoked"
            value={loading ? "…" : data?.globalTotalRevoked ?? 0}
            sub="Invalidated"
            accent="bg-red-100 text-red-600"
          />

          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Institutions"
            value={loading ? "…" : data?.institutionCount ?? 0}
            sub="Unique issuers"
            accent="bg-cyan-100 text-cyan-600"
          />
        </div>
      </div>
    </div>
  );
}