import { Router } from "express";
import { requireAuth } from "../../common/auth/requireAuth";
import { pool } from "../../common/db";

const router = Router();

const requireAdmin = (req: any, res: any, next: any) => {
  const role = (req.user?.role || "").toUpperCase();
  if (role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Forbidden"
    });
  }
  return next();
};

const ensureContentSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_items (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      artist_id INT NOT NULL,
      thumbnail_url TEXT,
      media_url TEXT,
      genre VARCHAR(80),
      lifecycle_state VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
      is_approved BOOLEAN NOT NULL DEFAULT false,
      rejection_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS title VARCHAR(255)");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS type VARCHAR(20)");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS artist_id INT");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS media_url TEXT");
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS genre VARCHAR(80)");
  await pool.query(
    "ALTER TABLE content_items ADD COLUMN IF NOT EXISTS lifecycle_state VARCHAR(20) NOT NULL DEFAULT 'DRAFT'"
  );
  await pool.query(
    "ALTER TABLE content_items ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false"
  );
  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS rejection_reason TEXT");
  await pool.query(
    "ALTER TABLE content_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()"
  );

  await pool.query("ALTER TABLE content_items ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ");
  await pool.query(
    "ALTER TABLE content_items ADD COLUMN IF NOT EXISTS subscription_required BOOLEAN NOT NULL DEFAULT false"
  );
};

router.get("/pending", requireAuth, requireAdmin, async (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  try {
    await ensureContentSchema();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const toAbsoluteUrl = (value: any) => {
      const raw = (value ?? "").toString().trim();
      if (!raw) return null;
      if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
      if (raw.startsWith("/")) return `${baseUrl}${raw}`;
      return `${baseUrl}/${raw}`;
    };

    const rows = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.type,
        c.thumbnail_url,
        c.media_url,
        c.lifecycle_state,
        c.is_approved,
        c.created_at,
        u.id as artist_id,
        COALESCE(u.name, u.email) as artist_name
      FROM content_items c
      LEFT JOIN users u ON u.id = c.artist_id
      WHERE COALESCE(c.is_approved, false) = false
        AND UPPER(COALESCE(c.lifecycle_state, 'DRAFT')) = 'DRAFT'
      ORDER BY c.created_at DESC
      LIMIT 200`,
      []
    );

    const items = (rows.rows ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      type: (r.type ?? "").toString(),
      thumbnailUrl: toAbsoluteUrl(r.thumbnail_url),
      mediaUrl: toAbsoluteUrl(r.media_url),
      fileUrl: toAbsoluteUrl(r.media_url),
      status: "PENDING",
      artist: {
        id: r.artist_id,
        name: r.artist_name ?? null
      },
      createdAt: r.created_at,
      lifecycleState: r.lifecycle_state,
      isApproved: r.is_approved
    }));

    return res.json({ success: true, items, correlationId });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending content",
      correlationId
    });
  }
});

router.patch("/:id/approve", requireAuth, requireAdmin, async (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
      correlationId
    });
  }

  try {
    await ensureContentSchema();

    const updated = await pool.query(
      `UPDATE content_items
       SET is_approved = true,
           lifecycle_state = 'PUBLISHED',
           published_at = now(),
           rejection_reason = NULL
       WHERE id = $1
       RETURNING id, title, type, artist_id, thumbnail_url, lifecycle_state, is_approved, created_at`,
      [id]
    );

    if (!updated.rows?.length) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
        correlationId
      });
    }

    const row = updated.rows[0];
    return res.json({
      success: true,
      item: {
        id: row.id,
        title: row.title,
        type: row.type,
        artistId: row.artist_id,
        thumbnailUrl: row.thumbnail_url,
        lifecycleState: row.lifecycle_state,
        isApproved: row.is_approved,
        createdAt: row.created_at
      },
      correlationId
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to approve content",
      correlationId
    });
  }
});

router.patch("/:id/reject", requireAuth, requireAdmin, async (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
      correlationId
    });
  }

  try {
    await ensureContentSchema();

    const { reason } = req.body as { reason?: string };
    const trimmed = (reason || "").trim();

    const updated = await pool.query(
      `UPDATE content_items
       SET is_approved = false,
           lifecycle_state = 'REJECTED',
           rejection_reason = $2
       WHERE id = $1
       RETURNING id`,
      [id, trimmed || null]
    );

    if (!updated.rows?.length) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
        correlationId
      });
    }

    return res.json({ success: true, correlationId });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to reject content",
      correlationId
    });
  }
});

export default router;
