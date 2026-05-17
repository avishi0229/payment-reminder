import db from "./connection.js";

export function initDb() {
  // Organizations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      gmail_user TEXT,
      gmail_access_token TEXT,
      gmail_refresh_token TEXT,
      gmail_token_expiry TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);



  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(email, org_id)
    )
  `);

  // Invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      description TEXT,
      invoice_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(invoice_number, org_id)
    )
  `);

  // Reminders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      message_preview TEXT,
      channel TEXT DEFAULT 'email',
      status TEXT DEFAULT 'sent'
    )
  `);

  // Add columns if they don't exist (for existing databases)
  const addColumnIfNotExists = (table, column, type) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    } catch (e) {
      // Column already exists, ignore error
    }
  };

  addColumnIfNotExists('organizations', 'gmail_user', 'TEXT');
  addColumnIfNotExists('organizations', 'gmail_app_password', 'TEXT');
  addColumnIfNotExists('organizations', 'gmail_access_token', 'TEXT');
  addColumnIfNotExists('organizations', 'gmail_refresh_token', 'TEXT');
  addColumnIfNotExists('organizations', 'gmail_token_expiry', 'TEXT');
  addColumnIfNotExists('invoices', 'org_id', 'INTEGER');
  addColumnIfNotExists('reminders', 'org_id', 'INTEGER');
  addColumnIfNotExists('clients', 'org_id', 'INTEGER');

  console.log("SQLite tables initialized");
}
