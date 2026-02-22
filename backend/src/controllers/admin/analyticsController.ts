import { Request, Response } from "express";
import { pool } from "../../common/db";

export class AnalyticsController {
  async getDashboardSummary(req: Request, res: Response) {
    try {
      // Total Artists
      const totalArtistsResult = await pool.query(
        "SELECT COUNT(*)::int as value FROM users WHERE role = 'ARTIST' OR UPPER(role) = 'ARTIST'"
      );
      const totalArtists = Number(totalArtistsResult.rows?.[0]?.value ?? 0);

      // Pending Approvals (unverified artists)
      const pendingApprovalsResult = await pool.query(
        "SELECT COUNT(*)::int as value FROM users WHERE (role = 'ARTIST' OR UPPER(role) = 'ARTIST') AND COALESCE(is_verified, verified, false) = false"
      );
      const pendingApprovals = Number(pendingApprovalsResult.rows?.[0]?.value ?? 0);

      // Active Artists (verified artists)
      const activeArtistsResult = await pool.query(
        "SELECT COUNT(*)::int as value FROM users WHERE UPPER(role) = 'ARTIST' AND COALESCE(is_verified, verified, false) = true"
      );
      const activeArtists = Number(activeArtistsResult.rows?.[0]?.value ?? 0);

      // Revenue Today (placeholder for now)
      const revenueToday = 0;

      // Pending Review Count (content awaiting approval)
      let pendingReviewCount = 0;
      try {
        const pendingReviewResult = await pool.query(
          "SELECT COUNT(*)::int as value FROM content_items WHERE COALESCE(is_approved, false) = false"
        );
        pendingReviewCount = Number(pendingReviewResult.rows?.[0]?.value ?? 0);
      } catch {
        pendingReviewCount = 0;
      }

      // Alerts placeholders
      const contentItemsPendingReview = 0;
      const subscriptionPaymentsFailed = 0;

      return res.json({
        success: true,
        data: {
          totalArtists,
          activeArtists,
          pendingApprovals,
          revenueToday,
          pendingReviewCount,
          contentItemsPendingReview,
          subscriptionPaymentsFailed
        }
      });
    } catch (error) {
      console.error("Failed to fetch dashboard summary", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard summary"
      });
    }
  }
}
