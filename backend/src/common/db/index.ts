import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => console.log("DB Connected to Neon ✅"))
  .catch((err) => console.error("DB Connection Error", err));
