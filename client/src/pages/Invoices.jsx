import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Bell, BellRing, Check, CheckCircle2, Copy, Download, Loader2, Trash2, X } from "lucide-react";
import api from "../api/client.js";
import { formatMoney, overdueAgingLabel } from "../lib/format.js";
import StatusBadge from "../components/StatusBadge.jsx";
import InvoiceCard from "../components/InvoiceCard.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import BulkRemindModal from "../components/BulkRemindModal.jsx";

function InvoicesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
      <div className="hidden h-64 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 lg:block" />
      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"
          />
        ))}
      </div>
    </div>
  );
}

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("due_date");
  const [selected, setSelected] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkTarget, setBulkTarget] = useState([]); // Invoices targeted for bulk action

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("search", search.trim());
    if (status !== "all") p.set("status", status);
    p.set("sort", sort);
    return p.toString();
  }, [search, status, sort]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.get(`/invoices?${query}`);
      setInvoices(rows);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Handle auto-trigger from Dashboard
  useEffect(() => {
    if (!loading && searchParams.get("action") === "bulk-remind") {
      const pending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
      if (pending.length > 0) {
        setBulkTarget(pending);
        setBulkOpen(true);
      }
      // Clear the param
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [loading, invoices, searchParams, setSearchParams]);

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked) {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    const next = new Set();
    for (const inv of invoices) {
      if (inv.status !== "paid") next.add(inv.id);
    }
    setSelected(next);
  }

  const selectedIds = useMemo(() => [...selected], [selected]);
  const selectableCount = invoices.filter((i) => i.status !== "paid").length;
  const allSelectableChecked =
    selectableCount > 0 && selectedIds.length === selectableCount;

  async function exportCsv() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Export failed");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices_export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded.");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function remind(inv) {
    setBusyId(inv.id);
    try {
      await api.post(`/invoices/${inv.id}/remind`);
      toast.success(`Reminder sent to ${inv.client_email}`);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(inv) {
    setBusyId(inv.id);
    try {
      await api.patch(`/invoices/${inv.id}/status`, { status: "paid" });
      toast.success("Marked as paid.");
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await api.delete(`/invoices/${deleteTarget.id}`);
      toast.success("Invoice deleted.");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function bulkRemind() {
    setBulkLoading(true);
    const ids = bulkTarget.map(i => i.id);
    try {
      const res = await api.post("/invoices/bulk-remind", { invoice_ids: ids });
      
      if (res.failed === 0) {
        toast.success(`✅ ${res.sent} reminders sent successfully!`);
      } else if (res.sent > 0) {
        toast.success(`⚠️ ${res.sent} sent, ${res.failed} failed. Check reminder history.`);
      } else {
        toast.error("❌ Failed to send reminders. Check Gmail settings.");
      }

      setBulkOpen(false);
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBulkLoading(false);
    }
  }

  const allPendingOverdue = useMemo(() => 
    invoices.filter(i => i.status === 'pending' || i.status === 'overdue'),
    [invoices]
  );

  const selectedInvoices = useMemo(() => 
    invoices.filter(i => selected.has(i.id)),
    [invoices, selected]
  );

  function openBulkSelection() {
    setBulkTarget(selectedInvoices);
    setBulkOpen(true);
  }

  function openBulkAll() {
    setBulkTarget(allPendingOverdue);
    setBulkOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Search, filter, remind, and export.
        </p>
      </div>
      <div className="hidden lg:block">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Invoices</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Search, filter, remind, and export.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, number, description"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-amber-400/0 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="due_date">Due date</option>
              <option value="amount">Amount</option>
              <option value="created">Created date</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={allPendingOverdue.length === 0}
            onClick={openBulkAll}
            title={allPendingOverdue.length === 0 ? "No pending or overdue invoices" : ""}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-500/5 px-4 py-2 text-sm font-bold text-amber-600 hover:bg-amber-500 hover:text-slate-950 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <BellRing size={18} />
            Send All Reminders {allPendingOverdue.length > 0 && `(${allPendingOverdue.length} pending)`}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link
            to="/invoices/new"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Create invoice
          </Link>
        </div>
      </div>

      {loading ? (
        <InvoicesSkeleton />
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            No invoices yet
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Create your first invoice to populate the dashboard and reminder flows.
          </p>
          <Link
            to="/invoices/new"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
          >
            Create your first one →
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 dark:border-slate-600"
                        checked={allSelectableChecked}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Aging</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 dark:border-slate-600"
                          checked={selected.has(inv.id)}
                          disabled={inv.status === "paid"}
                          onChange={() => toggleOne(inv.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {inv.invoice_number}
                        </div>
                        {Number(inv.reminder_count) > 0 && (
                          <div className="mt-1 text-[11px] font-medium text-slate-500">
                            {inv.reminder_count} reminder
                            {Number(inv.reminder_count) === 1 ? "" : "s"} sent
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {inv.client_name}
                        </div>
                        <div className="text-xs text-slate-500">{inv.client_email}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {formatMoney(inv.currency, inv.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {inv.due_date}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
                        {overdueAgingLabel(inv.status, inv.days_overdue)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={inv.status === "paid" || busyId === inv.id}
                            onClick={() => remind(inv)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-xs font-semibold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Bell className="h-3.5 w-3.5" />
                            Send reminder
                          </button>
                          <button
                            type="button"
                            disabled={inv.status === "paid" || busyId === inv.id}
                            onClick={() => markPaid(inv)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark paid
                          </button>
                          <button
                            type="button"
                            disabled={busyId === inv.id}
                            onClick={() => setDeleteTarget(inv)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {invoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                selected={selected.has(inv.id)}
                onToggleSelect={() => toggleOne(inv.id)}
                onRemind={remind}
                onPaid={markPaid}
                onDelete={setDeleteTarget}
                busyId={busyId}
              />
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete invoice?"
        description={
          deleteTarget
            ? `This will remove ${deleteTarget.invoice_number} and its reminder history.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={busyId === deleteTarget?.id}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <BulkRemindModal
        open={bulkOpen}
        invoices={bulkTarget}
        loading={bulkLoading}
        onClose={() => setBulkOpen(false)}
        onConfirm={bulkRemind}
      />

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-500 w-[calc(100%-2rem)] md:w-auto">
          <div className="bg-slate-900 text-white rounded-2xl md:rounded-full px-4 md:px-6 py-3 md:py-4 shadow-2xl flex flex-col md:flex-row items-center gap-3 md:gap-6 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 bg-amber-500 text-slate-950 text-xs font-bold rounded-full flex items-center justify-center">
                {selectedIds.length}
              </span>
              <span className="font-medium text-sm md:text-base">invoices selected</span>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                onClick={() => setSelected(new Set())}
                className="flex-1 md:flex-none px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={openBulkSelection}
                className="flex-[2] md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                Send Reminders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
