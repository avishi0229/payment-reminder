import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../api/client.js";
import { formatMoney, relativeTime } from "../lib/format.js";

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"
        />
      ))}
    </div>
  );
}

export default function ReminderHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (status !== "all") p.set("status", status);
    return p.toString();
  }, [from, to, status]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get(`/reminders?${query}`);
        if (!cancelled) setRows(data);
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reminder history</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Timeline of AI-drafted reminders and delivery status.
        </p>
      </div>
      <div className="hidden lg:block">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reminder history</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Timeline of AI-drafted reminders and delivery status.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="all">All</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setStatus("all");
            }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Reset filters
          </button>
        </div>
      </div>

      {loading ? (
        <HistorySkeleton />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            No reminders yet
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Send a reminder from the invoices list to see it appear here.
          </p>
          <Link
            to="/invoices"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
          >
            Go to invoices →
          </Link>
        </div>
      ) : (
        <div className="relative space-y-4 pl-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-200 dark:before:bg-slate-800">
          {rows.map((r) => (
            <div
              key={r.id}
              className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="absolute -left-[3px] top-5 h-3 w-3 rounded-full border-2 border-white bg-amber-500 dark:border-brand-navy" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {r.invoice_number}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {r.channel}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        r.status === "sent"
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200"
                          : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200"
                      }`}
                    >
                      {r.status === "sent" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                    {r.client_name}{" "}
                    <span className="text-slate-500">· {formatMoney(r.currency, r.amount)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {r.client_email}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {relativeTime(r.sent_at)}
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                {r.message_preview}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
