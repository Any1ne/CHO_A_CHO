import pool from "@/db/postgres/client";

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL Connected:", res.rows[0]);
  } catch (err) {
    console.error("❌ PostgreSQL Connection Error:", err);
  } finally {
    await pool.end();
  }
}

testConnection();
