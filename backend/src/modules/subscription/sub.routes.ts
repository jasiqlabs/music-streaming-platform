import { Router } from "express";
import { requireAuth } from "../../common/auth/requireAuth";
import { createMockOrder, verifyMockPayment } from "../../controllers/paymentController";
import { pool } from "../../common/db";

const router = Router();

router.post("/", requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "Subscription started",
    status: "PENDING"
  });
});

router.get("/status", requireAuth, (req, res) => {
  res.json({
    success: true,
    status: "ACTIVE"
  });
});

router.get("/me", requireAuth, (req, res) => {
  (async () => {
    const userId = req.user?.id;
    const artistIdRaw = (req.query?.artistId as string | undefined) ?? "";
    const artistId = Number(artistIdRaw);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!artistIdRaw || Number.isNaN(artistId) || artistId <= 0) {
      return res.status(400).json({ success: false, message: "artistId required" });
    }

    try {
      const row = await pool.query(
        `SELECT user_id, artist_id, status, plan_type, start_date, end_date, auto_renew
         FROM subscriptions
         WHERE user_id = $1 AND artist_id = $2
         LIMIT 1`,
        [userId, artistId]
      );

      const s = row.rows?.[0] ?? null;
      if (!s) {
        return res.json({ success: true, subscription: null });
      }

      return res.json({
        success: true,
        subscription: {
          user_id: s.user_id,
          artist_id: s.artist_id,
          status: s.status,
          plan_type: s.plan_type,
          start_date: s.start_date,
          end_date: s.end_date,
          auto_renew: s.auto_renew,
        }
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch subscription" });
    }
  })();
});

router.get("/summary", requireAuth, (req: any, res: any) => {
  (async () => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
      const row = await pool.query(
        `SELECT user_id, artist_id, status, plan_type, start_date, end_date, auto_renew
         FROM subscriptions
         WHERE user_id = $1
           AND UPPER(COALESCE(status, '')) = 'ACTIVE'
           AND (end_date IS NULL OR end_date > now())
         ORDER BY end_date DESC NULLS LAST, updated_at DESC, created_at DESC
         LIMIT 1`,
        [userId]
      );

      const s = row.rows?.[0] ?? null;

      return res.json({
        success: true,
        plan: s
          ? {
              user_id: s.user_id,
              artist_id: s.artist_id,
              status: s.status,
              plan_type: s.plan_type,
              start_date: s.start_date,
              end_date: s.end_date,
              auto_renew: s.auto_renew,
            }
          : null,
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch plan" });
    }
  })();
});

router.post("/mock-order", requireAuth, (req, res) => createMockOrder(req as any, res));
router.post("/mock-verify", requireAuth, (req, res) => verifyMockPayment(req as any, res));

export default router;
