import { Request, Response } from "express";
import { AuthService } from "./auth.service";

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
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
  }

  async session(req: any, res: Response) {
    try {
      return res.json({
        success: true,
        user: req.user
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Session error"
      });
    }
  }
}
