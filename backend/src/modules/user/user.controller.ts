import { Response } from "express";
import { pool } from "../../common/db";

export class UserController {
  async profile(req: any, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      let userRow: any;
      try {
        const q =
          "SELECT id, name, email, profile_image_url, subscription_count, total_listen_time, audio_quality_pref, notifications_pref, status FROM users WHERE id = $1";
        const r = await pool.query(q, [userId]);
        userRow = r.rows?.[0];
      } catch (err: any) {
        if (err?.code === "42703") {
          const q = "SELECT id, name, email, status FROM users WHERE id = $1";
          const r = await pool.query(q, [userId]);
          userRow = r.rows?.[0];
        } else {
          throw err;
        }
      }

      if (!userRow) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const subscriptionCount = Number(userRow.subscription_count ?? 0);

      return res.json({
        success: true,
        profile: {
          id: userRow.id,
          name: userRow.name ?? null,
          email: userRow.email,
          profileImageUrl: userRow.profile_image_url ?? null,
          audioQualityPref: userRow.audio_quality_pref ?? "HIGH",
          notificationsPref: userRow.notifications_pref ?? true,
          totalListenTimeSeconds: Number(userRow.total_listen_time ?? 0)
        },
        premium: {
          isPremium: subscriptionCount > 0,
          subscriptionCount
        }
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }

  async transactions(req: any, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      // Until the transactions table exists in the DB, return an empty list.
      // This endpoint should still be reachable (no 404).
      return res.json({
        success: true,
        transactions: []
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }

  async update(req: any, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      // Placeholder: implement full update once DB migration is baselined.
      return res.status(501).json({
        success: false,
        message: "Not implemented yet"
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
}
