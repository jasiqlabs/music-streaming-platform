import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { pool } from "../../common/db";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password required"
        });
      }

      const result = await authService.register(email, password);

      if (result.success) {
        return res.status(201).json(result);
      }

      return res.status(400).json(result);
    } catch {
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return res.json(result);
    } catch (err: any) {
      return res.status(err?.status || 401).json({
        success: false,
        message: err?.message || "Invalid credentials"
      });
    }
  }

  async session(req: any, res: Response) {
    try {
      const tokenUser = req.user;

      let dbUser: any = null;
      try {
        const userQuery = "SELECT id, email, status FROM users WHERE id = $1";
        const userResult = await pool.query(userQuery, [tokenUser?.id]);
        dbUser = userResult.rows?.[0] || null;
      } catch (err: any) {
        if (err?.code === "42703") {
          const userQuery = "SELECT id, email FROM users WHERE id = $1";
          const userResult = await pool.query(userQuery, [tokenUser?.id]);
          dbUser = userResult.rows?.[0] || null;
        } else {
          throw err;
        }
      }

      return res.json({
        success: true,
        user: {
          ...(tokenUser || {}),
          ...(dbUser || {}),
          status: dbUser?.status ?? (tokenUser as any)?.status ?? "ACTIVE"
        }
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Session error"
      });
    }
  }
}
