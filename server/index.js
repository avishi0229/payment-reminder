import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db/schema.js";
import { requireAuth } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import invoicesRouter from "./routes/invoices.js";
import remindersRouter from "./routes/reminders.js";
import dashboardRouter from "./routes/dashboard.js";
import clientsRouter from "./routes/clients.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "Payment Reminder API is running ✅" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/invoices", requireAuth, invoicesRouter);
app.use("/api/reminders", requireAuth, remindersRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/clients", requireAuth, clientsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  try {
    initDb();
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
      console.log("Database: SQLite");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
