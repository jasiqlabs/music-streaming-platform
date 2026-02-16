import { Router } from "express";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../common/auth/requireAuth";

const router = Router();
const authController = new AuthController();

router.post("/register", (req, res) =>
  authController.register(req, res)
);

router.post("/login", (req, res) =>
  authController.login(req, res)
);

router.get("/session", requireAuth, (req, res) =>
  authController.session(req, res)
);

export default router;
