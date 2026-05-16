import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client.js";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [previewNumber, setPreviewNumber] = useState("INV-0001");
  const [clients, setClients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    amount: "",
    currency: "INR",
    due_date: "",
    description: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [next, allClients] = await Promise.all([
          api.get("/invoices/preview/next-invoice-number"),
          api.get("/clients"),
        ]);
        setPreviewNumber(next.invoice_number);
        setClients(allClients);
      } catch (e) {
        toast.error(e.message);
      }
    })();
  }, []);

  const emailSuggestions = useMemo(() => {
    const q = form.client_email.trim().toLowerCase();
    if (!q) return [];
    return clients
      .filter((c) => c.email.toLowerCase().includes(q))
      .slice(0, 6);
  }, [clients, form.client_email]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function pickClient(c) {
    setForm((f) => ({
      ...f,
      client_email: c.email,
      client_name: c.name,
    }));
  }

  function validate() {
    if (!form.client_name.trim()) return "Client name is required.";
    if (!form.client_email.trim()) return "Client email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email)) return "Invalid email.";
    const amt = Number(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) return "Amount must be greater than 0.";
    if (!form.due_date) return "Due date is required.";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/invoices", {
        client_name: form.client_name.trim(),
        client_email: form.client_email.trim(),
        amount: Number(form.amount),
        currency: form.currency,
        due_date: form.due_date,
        description: form.description.trim(),
      });
      toast.success("Invoice created.");
      navigate("/invoices");
    } catch (e2) {
      toast.error(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create invoice</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Clients are reused automatically by email.
        </p>
      </div>
      <div className="hidden lg:block">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create invoice</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Clients are reused automatically by email.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
      >
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-5">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Invoice number (preview)
            </label>
            <div className="mt-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              {previewNumber}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              The server assigns the next sequential number on save.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Client name
            </label>
            <input
              required
              value={form.client_name}
              onChange={(e) => update("client_name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-amber-400/0 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="relative">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Client email
            </label>
            <input
              required
              autoComplete="off"
              value={form.client_email}
              onChange={(e) => update("client_email", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-amber-400/0 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {emailSuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {emailSuggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickClient(c)}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{c.email}</span>
                    <span className="text-xs text-slate-500">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </label>
              <input
                required
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-amber-400/0 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due date
            </label>
            <input
              required
              type="date"
              value={form.due_date}
              onChange={(e) => update("due_date", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-amber-400/0 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Create invoice"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
