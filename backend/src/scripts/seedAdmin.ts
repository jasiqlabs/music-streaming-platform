import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { pool } from "../common/db";

async function seedAdmin() {
  const email = "admin@test.com";
  const plainPassword = "admin123";
  const role = "ADMIN";

  try {
    await pool.query(
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR NOT NULL DEFAULT 'FAN'"
    );

    const existing = await pool.query(
      "SELECT id, email, role FROM users WHERE email = $1",
      [email]
    );
    if (existing.rows?.[0]) {
      console.log("Existing user:", existing.rows[0]);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const upsertQuery = `
      INSERT INTO users (email, password, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role
      RETURNING id, email, role
    `;

    const result = await pool.query(upsertQuery, [email, hashedPassword, role]);
    const user = result.rows?.[0];

    console.log("Seeded admin user:", user);
  } catch (error) {
    console.error("Failed to seed admin user", error);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  }
}

seedAdmin();
