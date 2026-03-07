/**
 * Ensures content_items has provider-neutral columns at startup so media-access and stream work.
 */

import { pool } from "../common/db";

export async function ensureContentMediaColumns(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_items (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      artist_id INT NOT NULL,
      thumbnail_url TEXT,
      media_url TEXT,
      audio_url TEXT,
      video_url TEXT,
      genre VARCHAR(80),
      lifecycle_state VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
      is_approved BOOLEAN NOT NULL DEFAULT false,
      rejection_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      published_at TIMESTAMPTZ,
      subscription_required BOOLEAN NOT NULL DEFAULT false
    )
  `);
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(20) DEFAULT 'local'");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS storage_key TEXT");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS thumbnail_storage_key TEXT");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS visibility VARCHAR(30) DEFAULT 'PROTECTED'");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS status VARCHAR(20)");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100)");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS file_size_bytes INT");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255)");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS video_storage_key TEXT");
}
