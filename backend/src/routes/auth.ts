import { Router } from "express";
import { authLimiter } from "../common/security/rateLimit";
import { registerFan } from "../controllers/auth";

const router = Router();

router.post("/register", authLimiter, (req, res) => registerFan(req, res));

router.post("/artist/register", authLimiter, (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";

  return res.status(410).json({
    success: false,
    message: "Artist self-registration is no longer available. Please contact an administrator.",
    correlationId
  });
});

export default router;
