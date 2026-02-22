import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../common/db";
import { authLimiter } from "../../common/security/rateLimit";

const router = Router();

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const userQuery = "SELECT id, email, password, role FROM users WHERE email = $1";
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      console.warn("[ADMIN LOGIN] user not found", { email });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = userResult.rows[0] as {
      id: number;
      email: string;
      password: string;
      role?: string | null;
    };

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn("[ADMIN LOGIN] invalid password", { email, userId: user.id });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if ((user.role || "").toUpperCase() !== "ADMIN") {
      console.warn("[ADMIN LOGIN] forbidden role", {
        email,
        userId: user.id,
        role: user.role
      });
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "ADMIN" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    (req as any).user = { id: user.id, role: "ADMIN" };

    return res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: "ADMIN" }
    });
  } catch {
    console.error("[ADMIN LOGIN] server error");
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
