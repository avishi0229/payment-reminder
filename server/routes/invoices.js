import { Router } from "express";
import db from "../db/connection.js";
import { sendReminderEmail } from "../services/emailService.js";

const router = Router();

// GET /api/invoices
router.get("/", (req, res) => {
  try {
    const { search = "", status = "all" } = req.query;
    const org_id = parseInt(req.org_id, 10);
    const params = [org_id];
    let sql = `SELECT * FROM invoices WHERE org_id = ?`;

    if (status !== "all") {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (client_name LIKE ? OR invoice_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY created_at DESC`;
    
    const invoices = db.prepare(sql).all(...params);
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// POST /api/invoices
router.post("/", (req, res) => {
  const {
    client_name,
    client_email,
    amount,
    currency,
    due_date,
    description,
    invoice_number
  } = req.body;
  try {
    const org_id = parseInt(req.org_id, 10);
    // Check if client exists or create one
    let client = db.prepare("SELECT id FROM clients WHERE email = ? AND org_id = ?").get(client_email, org_id);
    if (!client) {
      const insertClient = db.prepare("INSERT INTO clients (name, email, org_id) VALUES (?, ?, ?)");
      const result = insertClient.run(client_name, client_email, org_id);
      client = { id: result.lastInsertRowid };
    }

    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        org_id, client_id, client_name, client_email, amount, 
        currency, due_date, description, invoice_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertInvoice.run(
      org_id,
      client.id,
      client_name,
      client_email,
      amount,
      currency || 'INR',
      due_date,
      description,
      invoice_number || `INV-${Date.now()}`
    );

    res.status(201).json({ message: "Invoice created" });
  } catch (err) {
    console.error("INVOICE_CREATE_ERROR:", err.message);
    res.status(500).json({ error: `Failed to create invoice: ${err.message}` });
  }
});

// PATCH /api/invoices/:id/status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  try {
    const org_id = parseInt(req.org_id, 10);
    const result = db.prepare("UPDATE invoices SET status = ? WHERE id = ? AND org_id = ?")
      .run(status, req.params.id, org_id);
    
    if (result.changes === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// DELETE /api/invoices/:id
router.delete("/:id", (req, res) => {
  try {
    const org_id = parseInt(req.org_id, 10);
    const result = db.prepare("DELETE FROM invoices WHERE id = ? AND org_id = ?")
      .run(req.params.id, org_id);
    
    if (result.changes === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

// POST /api/invoices/:id/remind
router.post("/:id/remind", async (req, res) => {
  try {
    const org_id = parseInt(req.org_id, 10);
    const invoice = db.prepare("SELECT * FROM invoices WHERE id = ? AND org_id = ?")
      .get(req.params.id, org_id);
    
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const messagePreview = await sendReminderEmail(invoice, org_id);

    db.prepare(`
      INSERT INTO reminders (org_id, invoice_id, message_preview, status)
      VALUES (?, ?, ?, 'sent')
    `).run(org_id, invoice.id, messagePreview);

    res.json({ message: "Reminder sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to send reminder" });
  }
});

// GET /api/invoices/export
router.get("/export", (req, res) => {
  try {
    const org_id = parseInt(req.org_id, 10);
    const invoices = db.prepare("SELECT * FROM invoices WHERE org_id = ?").all(org_id);
    
    const headers = ["Invoice #", "Client", "Email", "Amount", "Currency", "Due Date", "Status"];
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.client_name,
      inv.client_email,
      inv.amount,
      inv.currency,
      inv.due_date,
      inv.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=invoices.csv");
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: "Failed to export invoices" });
  }
});

// GET /api/invoices/preview/next-invoice-number
router.get("/preview/next-invoice-number", (req, res) => {
  try {
    const org_id = parseInt(req.org_id, 10);
    const lastInvoice = db.prepare("SELECT invoice_number FROM invoices WHERE org_id = ? ORDER BY id DESC LIMIT 1").get(org_id);
    let nextNumber = "INV-0001";
    if (lastInvoice) {
      const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10) + 1;
        nextNumber = `INV-${num.toString().padStart(4, "0")}`;
      }
    }
    res.json({ invoice_number: nextNumber });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate invoice number" });
  }
});

// POST /api/invoices/bulk-remind
router.post("/bulk-remind", async (req, res) => {
  const { invoice_ids } = req.body;
  let sent = 0;
  let failed = 0;
  const sentTo = [];
  const failedTo = [];

  const org_id = parseInt(req.org_id, 10);

  try {
    let invoices = [];
    if (invoice_ids && invoice_ids.length > 0) {
      // Fetch specific invoices
      const placeholders = invoice_ids.map(() => "?").join(",");
      invoices = db.prepare(`
        SELECT * FROM invoices 
        WHERE id IN (${placeholders}) 
        AND org_id = ? 
        AND status IN ('pending', 'overdue')
      `).all(...invoice_ids, org_id);
    } else {
      // Fetch ALL pending + overdue for this org
      invoices = db.prepare(`
        SELECT * FROM invoices 
        WHERE org_id = ? 
        AND status IN ('pending', 'overdue')
      `).all(org_id);
    }

    if (invoices.length === 0) {
      return res.json({ 
        message: 'No pending or overdue invoices found', 
        sent: 0, 
        failed: 0 
      });
    }

    for (const invoice of invoices) {
      try {
        const messagePreview = await sendReminderEmail(invoice, org_id);
        db.prepare(`
          INSERT INTO reminders (org_id, invoice_id, message_preview, status)
          VALUES (?, ?, ?, 'sent')
        `).run(org_id, invoice.id, messagePreview);
        
        sent++;
        sentTo.push(invoice.client_email);
      } catch (err) {
        console.error(`Failed to send to ${invoice.client_email}:`, err.message);
        failed++;
        failedTo.push(invoice.client_email);
      }
    }

    res.json({ 
      sent, 
      failed,
      sentTo,
      failedTo,
      message: `${sent} reminder${sent === 1 ? '' : 's'} sent successfully`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process bulk reminders" });
  }
});

export default router;
