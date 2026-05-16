import { Check, X, Loader2 } from "lucide-react";
import { formatMoney } from "../lib/format";

export default function BulkRemindModal({
  open,
  onClose,
  onConfirm,
  invoices,
  loading
}) {
  if (!open) return null;

  const displayLimit = 5;
  const moreCount = invoices.length - displayLimit;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send Payment Reminders</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={24} />
            </button>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            You are about to send professional reminder emails to the following clients:
          </p>
        </div>

        <div className="p-6 max-h-[40vh] overflow-y-auto">
          <div className="space-y-3">
            {invoices.slice(0, displayLimit).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{inv.client_name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{inv.client_email}</span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900 dark:text-amber-400">
                  {formatMoney(inv.currency, inv.amount)}
                </div>
              </div>
            ))}
            
            {moreCount > 0 && (
              <div className="text-center py-2 text-sm font-medium text-slate-400">
                + {moreCount} more client{moreCount === 1 ? '' : 's'}...
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Total Reminders:</span>
              <span className="font-bold text-slate-900 dark:text-white text-lg">{invoices.length} emails</span>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="flex-[2] py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Sending...
                  </>
                ) : (
                  <>
                    Send All Reminders →
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
