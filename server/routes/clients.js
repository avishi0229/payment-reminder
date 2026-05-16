import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const org_id = parseInt(req.org_id, 10);
    const clients = db.prepare(
      `SELECT id, name, email, phone, company, created_at
       FROM clients WHERE org_id = ? ORDER BY name ASC`
    ).all(org_id);
    res.json(clients);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load clients" });
  }
});

export default router;
