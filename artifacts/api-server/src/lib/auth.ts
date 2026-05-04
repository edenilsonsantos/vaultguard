import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable, apiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "vault-secret-key-change-in-prod";

export interface AuthPayload {
  userId: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      isApiKeyAuth?: boolean;
    }
  }
}

export function generateToken(payload: AuthPayload & Record<string, unknown>, expiresIn = "24h"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): boolean {
  if (password.length < 12) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.user = { userId: user.id, username: user.username, role: user.role };
  req.isApiKeyAuth = false;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export async function requireAuthOrApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = (req.headers["x-api-key"] as string | undefined)
    || (req.query["api_key"] as string | undefined);

  if (apiKeyHeader) {
    const keyHash = createHash("sha256").update(apiKeyHeader).digest("hex");
    const [key] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.keyHash, keyHash));

    if (!key || !key.isActive) {
      res.status(401).json({ error: "API key inválida ou inativa" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, key.userId));
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Usuário não encontrado ou desativado" });
      return;
    }

    await db.update(apiKeysTable).set({ lastUsedAt: new Date() }).where(eq(apiKeysTable.id, key.id));

    req.user = { userId: user.id, username: user.username, role: user.role };
    req.isApiKeyAuth = true;
    next();
    return;
  }

  await requireAuth(req, res, next);
}
