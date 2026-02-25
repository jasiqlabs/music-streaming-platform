import { Router } from "express";
import { pool } from "../../common/db";

const router = Router();

const toAbsoluteUrl = (req: any, value: any) => {
  const raw = (value ?? "").toString().trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  if (raw.startsWith("/")) return `${baseUrl}${raw}`;
  return `${baseUrl}/${raw}`;
};

router.get("/", (req, res) => {
  (async () => {
    try {
      const rows = await pool.query(
        `SELECT
           c.id,
           c.title,
           c.type,
           c.thumbnail_url,
           c.media_url,
           c.created_at,
           COALESCE(u.name, u.email) as artist_name
         FROM content_items c
         LEFT JOIN users u ON u.id = c.artist_id
         WHERE COALESCE(c.is_approved, false) = true
           AND UPPER(COALESCE(c.lifecycle_state, '')) = 'PUBLISHED'
         ORDER BY c.created_at DESC
         LIMIT 200`,
        []
      );

      const items = (rows.rows ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        mediaType: ((r.type ?? '').toString().toLowerCase() === 'video' ? 'video' : 'audio'),
        thumbnailUrl: toAbsoluteUrl(req, r.thumbnail_url),
        artwork: toAbsoluteUrl(req, r.thumbnail_url),
        mediaUrl: toAbsoluteUrl(req, r.media_url),
        fileUrl: toAbsoluteUrl(req, r.media_url),
        createdAt: r.created_at,
        artistName: r.artist_name ?? null,
        locked: false
      }));

      return res.json({ success: true, items });
    } catch {
      return res.json({ success: true, items: [] });
    }
  })();
});

router.get("/artist/:artistId", (req, res) => {
  (async () => {
    const artistId = Number(req.params.artistId);
    if (!Number.isFinite(artistId) || artistId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid artist id" });
    }

    try {
      const rows = await pool.query(
        `SELECT id, title, type, thumbnail_url, media_url, created_at
         FROM content_items
         WHERE artist_id = $1
           AND COALESCE(is_approved, false) = true
           AND UPPER(COALESCE(lifecycle_state, '')) = 'PUBLISHED'
         ORDER BY created_at DESC
         LIMIT 500`,
        [artistId]
      );

      const items = (rows.rows ?? []).map((r: any) => {
        const type = (r.type ?? "").toString().toLowerCase();
        const mediaType = type === "video" ? "video" : "audio";
        return {
          id: r.id,
          title: r.title,
          type,
          mediaType,
          thumbnailUrl: toAbsoluteUrl(req, r.thumbnail_url),
          artwork: toAbsoluteUrl(req, r.thumbnail_url),
          mediaUrl: toAbsoluteUrl(req, r.media_url),
          fileUrl: toAbsoluteUrl(req, r.media_url),
          locked: false,
          createdAt: r.created_at,
        };
      });

      return res.json({ success: true, items });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch artist content" });
    }
  })();
});

router.get("/:id", (req, res) => {
  (async () => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    try {
      const rows = await pool.query(
        `SELECT id, title, type, thumbnail_url
         FROM content_items
         WHERE id = $1
           AND COALESCE(is_approved, false) = true
           AND UPPER(COALESCE(lifecycle_state, '')) = 'PUBLISHED'
         LIMIT 1`,
        [id]
      );

      if (!rows.rows?.length) {
        return res.status(404).json({ success: false, message: "Content not found" });
      }

      const r: any = rows.rows[0];
      return res.json({
        success: true,
        content: {
          id: r.id,
          title: r.title,
          type: r.type,
          locked: false,
          artwork: r.thumbnail_url ?? null
        }
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch content" });
    }
  })();
});

export default router;
