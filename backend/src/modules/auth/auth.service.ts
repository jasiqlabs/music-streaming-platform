import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../common/db";

export class AuthService {
  async register(email: string, password: string) {
    try {
      const existingUserQuery = "SELECT id FROM users WHERE email = $1";
      const existingUser = await pool.query(existingUserQuery, [email]);

      if (existingUser.rows.length > 0) {
        return { success: false, message: "Email already exists" };
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertUserQuery = "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id";
      await pool.query(insertUserQuery, [email, hashedPassword]);

      return { success: true, message: "User registered successfully" };
    } catch (error) {
      return { success: false, message: "Registration failed" };
    }
  }

  async login(email: string, password: string) {
    try {
      const userQuery = "SELECT id, email, password FROM users WHERE email = $1";
      const userResult = await pool.query(userQuery, [email]);

      if (userResult.rows.length === 0) {
        throw new Error("Invalid credentials");
      }

      const user = userResult.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
      );

      return {
        success: true,
        token,
        user: { id: user.id, email: user.email }
      };
    } catch (error) {
      throw new Error("Invalid credentials");
    }
  }
}