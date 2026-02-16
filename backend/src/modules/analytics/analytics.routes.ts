import { Router } from "express";

const router = Router();

router.post("/event", (req, res) => {
  console.log("Analytics Event:", req.body);

  res.json({
    success: true
  });
});

export default router;
