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
      const r = await pool.query(
        `SELECT id,
          name,
          COALESCE(is_verified, verified, false) as is_verified,
          profile_image_url,
          COALESCE(status, 'ACTIVE') as status,
          COALESCE(subscription_price, 0) as subscription_price,
          COALESCE(genre, '') as genre
         FROM users
         WHERE UPPER(role) = 'ARTIST'
           AND COALESCE(is_verified, verified, false) = true
           AND COALESCE(status, 'ACTIVE') = 'ACTIVE'
         ORDER BY id DESC
         LIMIT 100`
      );

      const artists = (r.rows ?? []).map((row: any) => ({
        id: row.id,
        name: row.name ?? null,
        isVerified: Boolean(row.is_verified),
        profileImageUrl: row.profile_image_url ?? null,
        status: (row.status ?? 'ACTIVE').toString(),
        subscriptionPrice: Number(row.subscription_price ?? 0),
        genre: (row.genre ?? '').toString(),
      }));

      return res.json({ success: true, artists });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch artists" });
    }
  })();
});

router.get("/:artistId", (req, res) => {
  (async () => {
    const artistId = Number(req.params.artistId);
    if (!Number.isFinite(artistId) || artistId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid artistId" });
    }

    try {
      const rows = await pool.query(
        `SELECT id,
          name,
          COALESCE(is_verified, verified, false) as is_verified,
          profile_image_url,
          COALESCE(status, 'ACTIVE') as status,
          COALESCE(subscription_price, 0) as subscription_price,
          COALESCE(genre, '') as genre
         FROM users
         WHERE id = $1
           AND UPPER(role) = 'ARTIST'
         LIMIT 1`,
        [artistId]
      );

      if (!rows.rows?.length) {
        return res.status(404).json({ success: false, message: "Artist not found" });
      }

      const row: any = rows.rows[0];
      return res.json({
        success: true,
        artist: {
          id: row.id,
          name: row.name ?? null,
          isVerified: Boolean(row.is_verified),
          profileImageUrl: toAbsoluteUrl(req, row.profile_image_url),
          coverImageUrl: toAbsoluteUrl(req, row.profile_image_url),
          status: (row.status ?? 'ACTIVE').toString(),
          subscriptionPrice: Number(row.subscription_price ?? 0),
          genre: (row.genre ?? '').toString(),
        },
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch artist" });
    }
  })();
});

router.get("/:artistId/content", (req, res) => {
  (async () => {
    const artistId = Number(req.params.artistId);
    if (!Number.isFinite(artistId) || artistId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid artistId" });
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

      const content = (rows.rows ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        type: (r.type ?? '').toString().toLowerCase(),
        artwork: toAbsoluteUrl(req, r.thumbnail_url),
        thumbnailUrl: toAbsoluteUrl(req, r.thumbnail_url),
        mediaUrl: toAbsoluteUrl(req, r.media_url),
        locked: false,
        createdAt: r.created_at,
      }));

      return res.json({ success: true, content });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch artist content" });
    }
  })();
});

export default router;
