import { Router } from "express";

import authRoutes from "../../modules/auth/auth.routes";
import userRoutes from "../../modules/user/user.routes";
import artistRoutes from "../../modules/artist/artist.routes";
import contentRoutes from "../../modules/content/content.routes";
import streamRoutes from "../../modules/streaming/stream.routes";
import subRoutes from "../../modules/subscription/sub.routes";
import analyticsRoutes from "../../modules/analytics/analytics.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);

router.use("/artists", artistRoutes);
router.use("/content", contentRoutes);
router.use("/stream", streamRoutes);
router.use("/subscriptions", subRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
