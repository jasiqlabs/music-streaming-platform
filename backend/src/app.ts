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
import userRoutes from "./modules/user/user.routes";



const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/v1/artists", artistRoutes);
app.use("/v1/content", contentRoutes);
app.use("/v1/stream", streamRoutes);
app.use("/v1/subscriptions", subRoutes);
app.use("/v1/analytics", analyticsRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const routes: string[] = [];
    const stack = (app as any)?._router?.stack || [];
    for (const layer of stack) {
      if (layer?.route?.path && layer?.route?.methods) {
        const methods = Object.keys(layer.route.methods)
          .filter((m) => layer.route.methods[m])
          .map((m) => m.toUpperCase());
        routes.push(`${methods.join(",")} ${layer.route.path}`);
      } else if (layer?.name === "router" && layer?.handle?.stack) {
        const mountPath = layer?.regexp?.toString?.() || "";
        for (const handler of layer.handle.stack) {
          if (!handler?.route) continue;
          const methods = Object.keys(handler.route.methods)
            .filter((m) => handler.route.methods[m])
            .map((m) => m.toUpperCase());
          routes.push(`${methods.join(",")} ${mountPath} ${handler.route.path}`);
        }
      }
    }
    console.log("Registered routes:");
    for (const r of routes) console.log(r);
  } catch (e) {
    console.warn("Failed to list routes", e);
  }
});
