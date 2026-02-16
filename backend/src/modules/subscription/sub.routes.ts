import { Router } from "express";
import { requireAuth } from "../../common/auth/requireAuth";

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
  const { artistId } = req.query;

  if (!artistId) {
    return res.status(400).json({
      success: false,
      message: "artistId required"
    });
  }

  res.json({
    success: true,
    subscription: {
      artistId,
      status: "ACTIVE"
    }
  });
});

export default router;
