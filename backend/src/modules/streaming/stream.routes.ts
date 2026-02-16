import { Router } from "express";
import { requireAuth } from "../../common/auth/requireAuth";

const router = Router();

router.post("/access", requireAuth, (req, res) => {
  const { contentId } = req.body;

  if (!contentId) {
    return res.status(400).json({
      success: false,
      message: "contentId required"
    });
  }

  res.json({
    success: true,
    signedUrl: "https://cdn.demo.com/file.mp3",
    expiresAt: new Date(Date.now() + 300000)
  });
});

export default router;
