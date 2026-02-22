import { Router } from "express";
import { pool } from "../../common/db";

const router = Router();

router.get("/", (req, res) => {
  (async () => {
    try {
      const rows = await pool.query(
        `SELECT id, title, type, thumbnail_url
         FROM content_items
         WHERE COALESCE(is_approved, false) = true
           AND UPPER(COALESCE(lifecycle_state, '')) = 'PUBLISHED'
         ORDER BY created_at DESC
         LIMIT 200`,
        []
      );

      const items = (rows.rows ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        artwork: r.thumbnail_url ?? null,
        locked: false
      }));

      return res.json({ success: true, items });
    } catch {
      return res.json({ success: true, items: [] });
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
