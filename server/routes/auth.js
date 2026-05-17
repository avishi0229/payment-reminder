import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { google } from "googleapis";

const router = Router();

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/auth/register-org
router.post("/register-org", (req, res) => {
  const { name, email, password, org_name } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const inviteCode = generateInviteCode();

    const insertOrg = db.prepare(`
      INSERT INTO organizations (name, invite_code, gmail_user, gmail_app_password)
      VALUES (?, ?, '', '')
    `);
    
    const orgResult = insertOrg.run(org_name, inviteCode);
    const orgId = orgResult.lastInsertRowid;

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password, role, org_id)
      VALUES (?, ?, ?, 'admin', ?)
    `);
    
    const userResult = insertUser.run(name, email, hashedPassword, orgId);
    const userId = userResult.lastInsertRowid;

    const token = jwt.sign(
      { id: userId, email, org_id: orgId, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: userId, name, email, role: "admin" },
      org: { id: orgId, name: org_name, invite_code: inviteCode }
    });
  } catch (err) {
    console.error(err);
    if (err.message.includes("UNIQUE constraint failed: users.email")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to register organization" });
  }
});

// DELETE /api/auth/join-org - REMOVED AS PER SIMPLIFICATION REQUEST
/*
router.post("/join-org", (req, res) => {
  ...
});
*/

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const org = db.prepare("SELECT id, name, invite_code FROM organizations WHERE id = ?").get(user.org_id);

    const token = jwt.sign(
      { id: user.id, email: user.email, org_id: user.org_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      org
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/auth/me (protected)
router.get("/me", requireAuth, (req, res) => {
  try {
    const user = db.prepare("SELECT id, name, email, role, org_id FROM users WHERE id = ?").get(req.user.id);
    const org = db.prepare("SELECT id, name, invite_code FROM organizations WHERE id = ?").get(user.org_id);
    res.json({ user, org });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user info" });
  }
});

// GET /api/auth/check-code?code=XXXXXX (public)
router.get("/check-code", (req, res) => {
  const { code } = req.query;
  try {
    const org = db.prepare("SELECT name FROM organizations WHERE invite_code = ?").get(code);
    if (org) {
      res.json({ valid: true, org_name: org.name });
    } else {
      res.json({ valid: false });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to check code" });
  }
});

// --- GMAIL OAUTH ROUTES ---

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// GET /api/auth/gmail/connect (protected)
router.get("/gmail/connect", requireAuth, async (req, res) => {
  try {
    console.log("Gmail connect route hit for org:", req.org_id);
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/userinfo.email"],
      state: req.org_id.toString(),
    });
    console.log("Generated OAuth URL:", url);
    res.json({ url });
  } catch (err) {
    console.error("Gmail connect error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/gmail/callback (public - called by Google)
router.get("/gmail/callback", async (req, res) => {
  const { code, state: orgId } = req.query;
  if (!code) return res.status(400).send("No code provided");

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const gmailUser = userInfo.data.email;

    // Save to DB
    db.prepare(`
      UPDATE organizations 
      SET gmail_user = ?, 
          gmail_access_token = ?, 
          gmail_refresh_token = ?, 
          gmail_token_expiry = ?
      WHERE id = ?
    `).run(
      gmailUser,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? tokens.expiry_date.toString() : null,
      orgId
    );

    // Redirect to frontend
    res.redirect("http://localhost:5173/dashboard?gmail=connected");
  } catch (err) {
    console.error("Gmail callback error:", err);
    res.status(500).send("Failed to connect Gmail");
  }
});

// GET /api/auth/gmail/status (protected)
router.get("/gmail/status", requireAuth, (req, res) => {
  console.log("Gmail status route hit for org:", req.org_id);
  try {
    const org = db.prepare("SELECT gmail_user, gmail_refresh_token FROM organizations WHERE id = ?").get(req.org_id);
    if (org && org.gmail_refresh_token) {
      res.json({ connected: true, gmail: org.gmail_user });
    } else {
      res.json({ connected: false });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to check Gmail status" });
  }
});

// POST /api/auth/gmail/disconnect (protected)
router.post("/gmail/disconnect", requireAuth, (req, res) => {
  try {
    db.prepare(`
      UPDATE organizations 
      SET gmail_access_token = NULL, 
          gmail_refresh_token = NULL,
          gmail_user = ''
      WHERE id = ?
    `).run(req.org_id);
    res.json({ success: true, message: "Gmail disconnected" });
  } catch (err) {
    console.error("Disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect Gmail" });
  }
});

export default router;
