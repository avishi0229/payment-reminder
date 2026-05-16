import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bell, CheckCircle2, Download, FilePlus2, Mail, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import api from "../api/client.js";
import { formatMoney } from "../lib/format.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { useSearchParams } from "react-router-dom";

function StatCard({ label, value, hint, delayClass, action }) {
  return (
    <div
      className={`animate-rise relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 ${delayClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
        </div>
        {action && (
          <Link
            to={action.to}
            className="rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-500 hover:text-slate-950 dark:text-amber-500 dark:hover:bg-amber-500 dark:hover:text-slate-950 transition-all"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gmailStatus, setGmailStatus] = useState({ connected: false, loading: true });
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (gmailParam === "connected") {
      toast.success("Gmail connected successfully!", { icon: "📧" });
      searchParams.delete("gmail");
      setSearchParams(searchParams, { replace: true });
    }
    checkGmailStatus();
  }, []);

  async function checkGmailStatus() {
    try {
      const res = await api.get("/auth/gmail/status");
      setGmailStatus({ ...res, loading: false });
    } catch (e) {
      setGmailStatus({ connected: false, loading: false });
    }
  }

  async function connectGmail() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/auth/gmail/connect", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Connect error:", error);
        throw new Error(error.error || "Failed to start Gmail connection");
      }

      const data = await response.json();
      console.log("OAuth URL received:", data.url);
      window.location.href = data.url;
    } catch (err) {
      console.error("Full error:", err);
      toast.error(err.message);
    }
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api.get("/dashboard");
        if (!cancelled) setData(d);
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Paid", value: data.paid_count, color: "#10b981" },
      { name: "Pending", value: data.pending_count, color: "#fbbf24" },
      { name: "Overdue", value: data.overdue_count, color: "#f97316" },
    ].filter((d) => d.value > 0);
  }, [data]);

  async function quickRemind(id) {
    try {
      await api.post(`/invoices/${id}/remind`);
      toast.success("Reminder queued and sent.");
      const d = await api.get("/dashboard");
      setData(d);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function quickPaid(id) {
    try {
      await api.patch(`/invoices/${id}/status`, { status: "paid" });
      toast.success("Marked as paid.");
      const d = await api.get("/dashboard");
      setData(d);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-8">
        <div className="lg:hidden">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Cashflow health, aging, and recent activity.
          </p>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Cashflow health, aging, and recent activity.
          </p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const unpaidDisplay = Number(data.total_unpaid_amount || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-8">
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Cashflow health, aging, and recent activity.
        </p>
      </div>
      <div className="hidden lg:block">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Cashflow health, aging, and recent activity.
        </p>
      </div>

      {!gmailStatus.loading && !gmailStatus.connected && (
        <div className="animate-rise rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Gmail not connected</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">You must connect your Gmail account to send payment reminders.</p>
            </div>
          </div>
          <button
            onClick={connectGmail}
            className="whitespace-nowrap inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            <Mail size={18} />
            Connect Gmail Account
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mobile-grid-2">
        <StatCard
          label="Total invoices"
          value={data.total_invoices}
          hint="All time"
          delayClass="[animation-delay:0ms]"
        />
        <StatCard
          label="Unpaid amount"
          value={unpaidDisplay}
          hint="Raw sum of pending + overdue (mixed currencies)"
          delayClass="[animation-delay:60ms]"
        />
        <StatCard
          label="Overdue"
          value={data.overdue_count}
          hint="Needs attention"
          delayClass="[animation-delay:120ms]"
          action={data.overdue_count > 0 ? { label: "Send Reminders →", to: "/invoices?action=bulk-remind" } : null}
        />
        <StatCard
          label="Paid this month"
          value={Number(data.paid_this_month || 0).toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
          hint="Paid invoices created this month (mixed currency)"
          delayClass="[animation-delay:180ms]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mobile-stack">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-2 mobile-full-width">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Paid vs unpaid
              </div>
              <div className="text-xs text-slate-500">Last 6 months (by invoice created month)</div>
            </div>
            <Link
              to="/invoices"
              className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300"
            >
              View invoices →
            </Link>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#33415533" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 12,
                    color: "#f8fafc",
                  }}
                />
                <Legend />
                <Bar dataKey="paid" name="Paid" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="unpaid" name="Unpaid" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 mobile-full-width">
          <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
            Status mix
          </div>
          <div className="text-xs text-slate-500">Paid vs pending vs overdue</div>
          <div className="mt-4 h-64 w-full">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No invoices to chart yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: 12,
                      color: "#f8fafc",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent invoices
            </div>
            <div className="text-xs text-slate-500">Latest five, with quick actions</div>
          </div>
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-400"
          >
            <FilePlus2 className="h-4 w-4" />
            New invoice
          </Link>
        </div>
        <div className="table-view w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.recent_invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                    {inv.invoice_number}
                  </td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{inv.client_name}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {formatMoney(inv.currency, inv.amount)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{inv.due_date}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={inv.status === "paid"}
                        onClick={() => quickRemind(inv.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        Remind
                      </button>
                      <button
                        type="button"
                        disabled={inv.status === "paid"}
                        onClick={() => quickPaid(inv.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paid
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-view divide-y divide-slate-100 dark:divide-slate-800">
          {data.recent_invoices.map((inv) => (
            <div key={inv.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{inv.invoice_number}</div>
                  <div className="text-xs text-slate-500">{inv.client_name}</div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {formatMoney(inv.currency, inv.amount)}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Due {inv.due_date}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={inv.status === "paid"}
                  onClick={() => quickRemind(inv.id)}
                  className="flex-1 bg-amber-500 text-slate-950 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                >
                  Remind
                </button>
                <button
                  disabled={inv.status === "paid"}
                  onClick={() => quickPaid(inv.id)}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                >
                  Mark Paid
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300"
          >
            <Download className="h-4 w-4" />
            Open invoices for export & bulk actions
          </Link>
        </div>
      </div>
    </div>
  );
}
