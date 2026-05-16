import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

function syncOverdueStatus(orgId) {
  try {
    db.prepare(
      `UPDATE invoices SET status = 'overdue'
       WHERE due_date < date('now')
       AND status = 'pending'
       AND org_id = ?`
    ).run(orgId);
  } catch (err) {
    console.error("Failed to sync overdue status:", err.message);
  }
}

router.get("/", (req, res) => {
  try {
    const orgId = parseInt(req.org_id, 10);
    syncOverdueStatus(orgId);

    const total_invoices = db.prepare(
      "SELECT COUNT(*) AS c FROM invoices WHERE org_id = ?"
    ).get(orgId).c;

    const unpaidRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) AS s FROM invoices
       WHERE org_id = ? AND status IN ('pending', 'overdue')`
    ).get(orgId);
    const total_unpaid_amount = Number(unpaidRow.s);

    const overdue_count = db.prepare(
      "SELECT COUNT(*) AS c FROM invoices WHERE org_id = ? AND status = 'overdue'"
    ).get(orgId).c;

    const paid_count = db.prepare(
      "SELECT COUNT(*) AS c FROM invoices WHERE org_id = ? AND status = 'paid'"
    ).get(orgId).c;

    const pending_count = db.prepare(
      "SELECT COUNT(*) AS c FROM invoices WHERE org_id = ? AND status = 'pending'"
    ).get(orgId).c;

    const paidThisRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) AS s FROM invoices
       WHERE org_id = ? AND status = 'paid'
         AND created_at >= strftime('%Y-%m-01', 'now')`
    ).get(orgId);
    const paid_this_month = Number(paidThisRow.s);

    const recent_invoices = db.prepare(
      `SELECT id, invoice_number, client_name, client_email, amount, currency,
              due_date, status, created_at
       FROM invoices
       WHERE org_id = ?
       ORDER BY created_at DESC
       LIMIT 5`
    ).all(orgId);

    const monthly_data = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const ym = d.toISOString().slice(0, 7); // YYYY-MM
      const label = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      const paid = db.prepare(
        `SELECT COALESCE(SUM(amount), 0) AS s FROM invoices
         WHERE org_id = ?
           AND strftime('%Y-%m', created_at) = ?
           AND status = 'paid'`
      ).get(orgId, ym).s;

      const unpaid = db.prepare(
        `SELECT COALESCE(SUM(amount), 0) AS s FROM invoices
         WHERE org_id = ?
           AND strftime('%Y-%m', created_at) = ?
           AND status IN ('pending', 'overdue')`
      ).get(orgId, ym).s;

      monthly_data.push({
        month: label,
        month_key: ym,
        paid: Number(paid) || 0,
        unpaid: Number(unpaid) || 0,
      });
    }

    res.json({
      total_invoices,
      total_unpaid_amount,
      overdue_count,
      paid_count,
      pending_count,
      paid_this_month,
      recent_invoices,
      monthly_data,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
