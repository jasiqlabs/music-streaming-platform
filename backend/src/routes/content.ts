import { Router } from "express";
import { requireAuth } from "../common/auth/requireAuth";
import { pool } from "../common/db";
import { uploadLimiter } from "../common/security/rateLimit";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const requireArtist = (req: any, res: any, next: any) => {
  const role = (req.user?.role || "").toUpperCase();
  if (role !== "ARTIST") {
    return res.status(403).json({
      success: false,
      message: "Forbidden"
    });
  }
  return next();
};

const requireArtistOrAdmin = (req: any, res: any, next: any) => {
  const role = (req.user?.role || "").toUpperCase();
  if (role !== "ARTIST" && role !== "ADMIN") {
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

const ensurePlaysSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_plays (
      id SERIAL PRIMARY KEY,
      content_id INT NOT NULL,
      user_id INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await pool.query("ALTER TABLE content_plays ADD COLUMN IF NOT EXISTS content_id INT");
  await pool.query("ALTER TABLE content_plays ADD COLUMN IF NOT EXISTS user_id INT");
  await pool.query(
    "ALTER TABLE content_plays ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()"
  );

  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_content_plays_content_id ON content_plays(content_id)"
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_content_plays_created_at ON content_plays(created_at)"
  );
};

const ensureUploadsDir = () => {
  const dir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      cb(null, ensureUploadsDir());
    } catch (e: any) {
      cb(e, ensureUploadsDir());
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 250
  }
});

router.post(
  "/upload",
  uploadLimiter,
  requireAuth,
  requireArtist,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "media", maxCount: 1 }
  ]),
  async (req: any, res: any) => {
    const correlationId = req?.correlationId || "-";

    try {
      await ensureContentSchema();

      const { title, type, genre } = req.body as {
        title?: string;
        type?: string;
        genre?: string;
      };

      const trimmedTitle = (title || "").trim();
      const normalizedType = (type || "").trim().toUpperCase();
      const trimmedGenre = (genre || "").trim();

      if (!trimmedTitle || (normalizedType !== "AUDIO" && normalizedType !== "VIDEO")) {
        return res.status(400).json({
          success: false,
          message: "title and type (Audio/Video) are required",
          correlationId
        });
      }

      const files = (req.files || {}) as Record<string, any[]>;
      const thumb = (files.thumbnail?.[0] as any) ?? null;
      const media = (files.media?.[0] as any) ?? null;

      if (!thumb || !media) {
        return res.status(400).json({
          success: false,
          message: "thumbnail and media files are required",
          correlationId
        });
      }

      const artistId = req.user?.id;

      const thumbnailUrl = `/uploads/${thumb.filename}`;
      const mediaUrl = `/uploads/${media.filename}`;

      const insert = await pool.query(
        `INSERT INTO content_items (title, type, artist_id, thumbnail_url, media_url, genre, lifecycle_state, is_approved)
         VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT', false)
         RETURNING id, title, type, artist_id, thumbnail_url, media_url, genre, lifecycle_state, is_approved, created_at`,
        [trimmedTitle, normalizedType, artistId, thumbnailUrl, mediaUrl, trimmedGenre || null]
      );

      return res.json({
        success: true,
        item: {
          id: insert.rows[0].id,
          title: insert.rows[0].title,
          type: insert.rows[0].type,
          artistId: insert.rows[0].artist_id,
          thumbnailUrl: insert.rows[0].thumbnail_url,
          mediaUrl: insert.rows[0].media_url,
          genre: insert.rows[0].genre,
          lifecycleState: insert.rows[0].lifecycle_state,
          isApproved: insert.rows[0].is_approved,
          status: "PENDING",
          createdAt: insert.rows[0].created_at
        },
        correlationId
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Failed to upload content",
        correlationId
      });
    }
  }
);

router.get("/mine", requireAuth, requireArtist, async (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  try {
    await ensureContentSchema();

    const artistId = req.user?.id;

    const rows = await pool.query(
      `SELECT id, title, type, thumbnail_url, lifecycle_state, is_approved, created_at
       FROM content_items
       WHERE artist_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [artistId]
    );

    const items = (rows.rows ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      thumbnailUrl: r.thumbnail_url ?? null,
      lifecycleState: r.lifecycle_state,
      isApproved: r.is_approved,
      createdAt: r.created_at
    }));

    return res.json({ success: true, items, correlationId });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch artist content",
      correlationId
    });
  }
});

router.post("/upload-metadata", uploadLimiter, requireAuth, requireArtist, async (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  try {
    await ensureContentSchema();

    const { title, type, thumbnailUrl } = req.body as {
      title?: string;
      type?: string;
      thumbnailUrl?: string | null;
    };

    const trimmedTitle = (title || "").trim();
    const normalizedType = (type || "").trim().toUpperCase();

    if (!trimmedTitle || (normalizedType !== "AUDIO" && normalizedType !== "VIDEO")) {
      return res.status(400).json({
        success: false,
        message: "title and type (Audio/Video) are required",
        correlationId
      });
    }

    const artistId = req.user?.id;

    const insert = await pool.query(
      `INSERT INTO content_items (title, type, artist_id, thumbnail_url, lifecycle_state, is_approved)
       VALUES ($1, $2, $3, $4, 'DRAFT', false)
       RETURNING id, title, type, artist_id, thumbnail_url, lifecycle_state, is_approved, created_at`,
      [trimmedTitle, normalizedType, artistId, thumbnailUrl ?? null]
    );

    return res.json({
      success: true,
      item: {
        id: insert.rows[0].id,
        title: insert.rows[0].title,
        type: insert.rows[0].type,
        artistId: insert.rows[0].artist_id,
        thumbnailUrl: insert.rows[0].thumbnail_url,
        lifecycleState: insert.rows[0].lifecycle_state,
        isApproved: insert.rows[0].is_approved,
        createdAt: insert.rows[0].created_at
      },
      correlationId
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to upload content",
      correlationId
    });
  }
});

router.get("/history", requireAuth, requireArtistOrAdmin, async (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  try {
    await ensureContentSchema();
    await ensurePlaysSchema();

    const role = (req.user?.role || "").toUpperCase();

    if (role === "ADMIN") {
      const artistIdRaw = (req.query?.artistId as string | undefined) ?? "";
      const artistId = Number(artistIdRaw);
      if (!artistIdRaw || Number.isNaN(artistId) || artistId <= 0) {
        return res.status(400).json({
          success: false,
          message: "artistId query param is required for admin",
          correlationId
        });
      }

      const rows = await pool.query(
        `SELECT 
          c.id,
          c.title,
          c.type,
          c.thumbnail_url,
          c.media_url,
          c.lifecycle_state,
          c.is_approved,
          c.rejection_reason,
          c.created_at,
          (SELECT COUNT(*)::int FROM content_plays p WHERE p.content_id = c.id) as total_plays
         FROM content_items c
         WHERE c.artist_id = $1
         ORDER BY c.created_at DESC
         LIMIT 500`,
        [artistId]
      );

      const items = (rows.rows ?? []).map((r: any) => {
        const lifecycle = (r.lifecycle_state ?? "DRAFT").toString();
        const approved = Boolean(r.is_approved);
        const status = lifecycle.toUpperCase() === "REJECTED" ? "REJECTED" : approved ? "PUBLISHED" : "PENDING";
        return {
          id: r.id,
          title: r.title,
          type: (r.type ?? "").toString().toLowerCase(),
          thumbnailUrl: r.thumbnail_url ?? null,
          mediaUrl: r.media_url ?? null,
          lifecycleState: lifecycle,
          isApproved: r.is_approved,
          status,
          rejectionReason: r.rejection_reason ?? null,
          totalPlays: Number(r.total_plays ?? 0),
          createdAt: r.created_at
        };
      });

      return res.json({ success: true, items, correlationId });
    }

    const artistId = req.user?.id;
    const rows = await pool.query(
      `SELECT 
        c.id,
        c.title,
        c.type,
        c.thumbnail_url,
        c.media_url,
        c.lifecycle_state,
        c.is_approved,
        c.rejection_reason,
        c.created_at,
        (SELECT COUNT(*)::int FROM content_plays p WHERE p.content_id = c.id) as total_plays
       FROM content_items c
       WHERE c.artist_id = $1
       ORDER BY c.created_at DESC
       LIMIT 500`,
      [artistId]
    );

    const items = (rows.rows ?? []).map((r: any) => {
      const lifecycle = (r.lifecycle_state ?? "DRAFT").toString();
      const approved = Boolean(r.is_approved);
      const status = lifecycle.toUpperCase() === "REJECTED" ? "REJECTED" : approved ? "PUBLISHED" : "PENDING";
      return {
        id: r.id,
        title: r.title,
        type: (r.type ?? "").toString().toLowerCase(),
        thumbnailUrl: r.thumbnail_url ?? null,
        mediaUrl: r.media_url ?? null,
        lifecycleState: lifecycle,
        isApproved: r.is_approved,
        status,
        rejectionReason: r.rejection_reason ?? null,
        totalPlays: Number(r.total_plays ?? 0),
        createdAt: r.created_at
      };
    });

    return res.json({ success: true, items, correlationId });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch content history",
      correlationId
    });
  }
});

router.delete("/:id", requireAuth, requireArtistOrAdmin, async (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  const role = (req.user?.role || "").toUpperCase();
  const actorId = req.user?.id;
  const id = Number(req.params?.id);

  if (!id || Number.isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid content id",
      correlationId
    });
  }

  const timestamp = new Date().toISOString();
  const eventLabel = role === "ADMIN" ? "CONTENT_DELETED_BY_ADMIN" : "CONTENT_DELETED_BY_ARTIST";
  console.log(
    `--------------------------------------------------\n[${eventLabel}] ${timestamp} correlationId=${correlationId} actorId=${actorId} contentId=${id} action=REQUEST`
  );

  try {
    await ensureContentSchema();

    const del =
      role === "ADMIN"
        ? await pool.query(
            `DELETE FROM content_items
             WHERE id = $1
             RETURNING id, title, type, artist_id, is_approved, created_at`,
            [id]
          )
        : await pool.query(
            `DELETE FROM content_items
             WHERE id = $1 AND artist_id = $2
             RETURNING id, title, type, artist_id, is_approved, created_at`,
            [id, actorId]
          );

    if (!del.rows?.length) {
      console.log(
        `--------------------------------------------------\n[${eventLabel}] ${timestamp} correlationId=${correlationId} actorId=${actorId} contentId=${id} action=NOT_FOUND_OR_FORBIDDEN`
      );
      return res.status(404).json({
        success: false,
        message: "Content not found",
        correlationId
      });
    }

    const deletedArtistId = del.rows[0]?.artist_id ?? null;
    console.log(
      `--------------------------------------------------\n[${eventLabel}] ${timestamp} correlationId=${correlationId} actorId=${actorId} contentId=${id} action=DELETED deletedArtistId=${deletedArtistId ?? "-"}`
    );

    return res.json({ success: true, correlationId });
  } catch {
    console.log(
      `--------------------------------------------------\n[${eventLabel}] ${timestamp} correlationId=${correlationId} actorId=${actorId} contentId=${id} action=ERROR`
    );
    return res.status(500).json({
      success: false,
      message: "Failed to delete content",
      correlationId
    });
  }
});

export default router;
