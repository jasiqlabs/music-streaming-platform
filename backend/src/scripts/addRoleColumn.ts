import dotenv from "dotenv";
dotenv.config();

import { pool } from "../common/db";

async function addRoleColumn() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR NOT NULL DEFAULT \'FAN\'');
    console.log('Role column added successfully');
  } catch (error) {
    console.error('Error adding role column:', error);
  } finally {
    await pool.end();
  }
}

addRoleColumn();
