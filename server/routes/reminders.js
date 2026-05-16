import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const { from, to, status = "" } = req.query;

    const org_id = parseInt(req.org_id, 10);
    let sql = `
      SELECT r.*, i.invoice_number, i.client_name, i.client_email, i.amount, i.currency
      FROM reminders r
      JOIN invoices i ON i.id = r.invoice_id
      WHERE r.org_id = ?
    `;
    const params = [org_id];

    if (from) {
      sql += ` AND date(r.sent_at) >= ?`;
      params.push(from);
    }
    if (to) {
      sql += ` AND date(r.sent_at) <= ?`;
      params.push(to);
    }
    if (status && status !== "all") {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    sql += " ORDER BY r.sent_at DESC";

    const reminders = db.prepare(sql).all(...params);
    res.json(reminders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load reminders" });
  }
});

export default router;
