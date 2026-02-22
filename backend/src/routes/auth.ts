import { Router } from "express";
import { authLimiter } from "../common/security/rateLimit";

const router = Router();

router.post("/artist/register", authLimiter, (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  return res.status(410).json({
    success: false,
    message: "Artist self-registration is no longer available. Please contact an administrator.",
    correlationId
  });
});

export default router;
