import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { pool } from "../common/db";

type SeedUser = {
  role: "ADMIN" | "ARTIST";
  email: string;
  password: string;
  isVerified?: boolean;
  subscriptionPrice?: number;
};

const USERS: SeedUser[] = [
  {
    role: "ADMIN",
    email: "admin@test.com",
    password: "admin123"
  },
  {
    role: "ARTIST",
    email: "artist@test.com",
    password: "artist123",
    isVerified: true,
    subscriptionPrice: 10.0
  
  }
];

async function ensureSchema() {
  await pool.query(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR NOT NULL DEFAULT 'FAN'"
  );

  await pool.query(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false"
  );

  await pool.query(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_price NUMERIC(10,2) NOT NULL DEFAULT 0"
  );
}

async function upsertUser(user: SeedUser) {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const isVerified = Boolean(user.isVerified);
  const subscriptionPrice = Number(user.subscriptionPrice ?? 0);

  const upsertQuery = `
    INSERT INTO users (email, password, role, is_verified, subscription_price)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email)
    DO UPDATE SET
      password = EXCLUDED.password,
      role = EXCLUDED.role,
      is_verified = EXCLUDED.is_verified,
      subscription_price = EXCLUDED.subscription_price
    RETURNING id, email, role, is_verified, subscription_price
  `;

  return pool.query(upsertQuery, [
    user.email,
    hashedPassword,
    user.role,
    isVerified,
    subscriptionPrice
  ]);
}

                            
async function seed() {
  try {
    await ensureSchema();

    for (const u of USERS) {
      const result = await upsertUser(u);
      const row = result.rows?.[0];

      console.log(
        `[AUDIT] ${JSON.stringify({
          event: "seed_user_upserted",
          email: row?.email ?? u.email,
          role: row?.role ?? u.role,
          isVerified: row?.is_verified ?? u.isVerified ?? false,
          subscriptionPrice: row?.subscription_price ?? u.subscriptionPrice ?? 0
        })}`
      );
    }

    console.log("Users Seeded Successfully");
    console.log("");
    console.log("Role,Email,Password,Dashboard URL");
    console.log("Admin,admin@test.com,admin123,localhost:5173/admin/login");
    console.log("Artist,artist@test.com,artist123,localhost:5176/artist/login");
  } catch (error) {
    console.error("Failed to seed users", error);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  }
}

seed();
