import db from "./db/connection.js";

try {
    const orgId = 1;
    const client_email = "priya.sharma@techflow.in";
    const client_name = "Priya Sharma";
    
    let client = db.prepare("SELECT id FROM clients WHERE email = ? AND org_id = ?").get(client_email, orgId);
    if (!client) {
        console.log("Client not found for org 1, attempting to insert...");
        const result = db.prepare("INSERT INTO clients (name, email, org_id) VALUES (?, ?, ?)")
            .run(client_name, client_email, orgId);
        console.log("Insert success:", result.lastInsertRowid);
    } else {
        console.log("Client found:", client.id);
    }
} catch (e) {
    console.error("CRITICAL_ERROR:", e.message);
}
process.exit(0);
