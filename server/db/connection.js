import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "app.db");

// Create data directory if it doesn't exist
const dbDir = path.dirname(dbPath);
mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

export default db;
