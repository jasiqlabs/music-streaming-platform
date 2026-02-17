import { Router } from "express";
import { requireAuth } from "../../common/auth/requireAuth";
import { UserController } from "./user.controller";

const router = Router();
const userController = new UserController();

router.get("/profile", requireAuth, (req, res) => userController.profile(req as any, res));
router.get("/transactions", requireAuth, (req, res) => userController.transactions(req as any, res));
router.put("/update", requireAuth, (req, res) => userController.update(req as any, res));

export default router;
