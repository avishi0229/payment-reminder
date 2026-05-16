import db from "./db/connection.js";

try {
    const orgId = 1; // Assuming an org exists
    const total_invoices = db.prepare("SELECT COUNT(*) AS c FROM invoices WHERE org_id = ?").get(orgId);
    console.log("Success:", total_invoices);
} catch (e) {
    console.error("Error:", e.message);
}
process.exit(0);
