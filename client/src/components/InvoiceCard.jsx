import { Bell, CheckCircle2, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { formatMoney, overdueAgingLabel } from "../lib/format.js";

export default function InvoiceCard({
  invoice,
  selected,
  onToggleSelect,
  onRemind,
  onPaid,
  onDelete,
  busyId,
}) {
  const disabledPaid = invoice.status === "paid";
  const aging = overdueAgingLabel(invoice.status, invoice.days_overdue);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 dark:border-slate-600"
            checked={selected}
            onChange={onToggleSelect}
            disabled={disabledPaid}
          />
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {invoice.invoice_number}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {invoice.client_name}
            </div>
            <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              {formatMoney(invoice.currency, invoice.amount)}
            </div>
            <div className="mt-1 text-xs text-slate-500">Due {invoice.due_date}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={invoice.status} />
              {Number(invoice.reminder_count) > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {invoice.reminder_count} reminder
                  {Number(invoice.reminder_count) === 1 ? "" : "s"} sent
                </span>
              )}
            </div>
            <div className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              {aging}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabledPaid || busyId === invoice.id}
          onClick={() => onRemind(invoice)}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Bell className="h-4 w-4" />
          Remind
        </button>
        <button
          type="button"
          disabled={disabledPaid || busyId === invoice.id}
          onClick={() => onPaid(invoice)}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
        >
          <CheckCircle2 className="h-4 w-4" />
          Paid
        </button>
        <button
          type="button"
          disabled={busyId === invoice.id}
          onClick={() => onDelete(invoice)}
          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-slate-700 dark:text-red-300 dark:hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
