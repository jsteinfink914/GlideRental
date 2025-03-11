import { db } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./vite";

async function dropTables() {
  try {
    log("Dropping database tables...", "db");
    
    await db.execute(sql`
      DROP TABLE IF EXISTS rental_applications;
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS maintenance_requests;
      DROP TABLE IF EXISTS saved_properties;
      DROP TABLE IF EXISTS messages;
      DROP TABLE IF EXISTS landlord_criteria;
      DROP TABLE IF EXISTS properties;
      DROP TABLE IF EXISTS buildings;
      DROP TABLE IF EXISTS user_preferences;
      DROP TABLE IF EXISTS users;
    `);
    
    log("All tables dropped successfully", "db");
  } catch (error) {
    log(`Error dropping tables: ${error}`, "db");
    throw error;
  }
}

// Execute the function
dropTables().then(() => {
  log("Drop tables operation completed", "db");
  process.exit(0);
}).catch(error => {
  log(`Drop tables operation failed: ${error}`, "db");
  process.exit(1);
});