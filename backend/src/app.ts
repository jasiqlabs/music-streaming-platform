import dotenv from "dotenv";
dotenv.config();
import "./common/db";

import express from "express";
import authRoutes from "./modules/auth/auth.routes";

import artistRoutes from "./modules/artist/artist.routes";
import contentRoutes from "./modules/content/content.routes";
import streamRoutes from "./modules/streaming/stream.routes";
import subRoutes from "./modules/subscription/sub.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";



const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/v1/artists", artistRoutes);
app.use("/v1/content", contentRoutes);
app.use("/v1/stream", streamRoutes);
app.use("/v1/subscriptions", subRoutes);
app.use("/v1/analytics", analyticsRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
