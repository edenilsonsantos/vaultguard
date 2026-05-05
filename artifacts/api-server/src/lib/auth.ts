import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable, apiKeysTable, certificatesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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
      isCertAuth?: boolean;
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
  req.isCertAuth = false;
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

/**
 * Autenticação por API Key + Certificado (dois fatores para acesso programático).
 * Ambos os headers X-API-Key e X-Certificate são obrigatórios.
 * Ambos devem pertencer ao mesmo usuário ativo.
 * A restrição de IP/host do vault ainda é aplicada normalmente.
 */
export async function requireApiKeyAndCert(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = (req.headers["x-api-key"] as string | undefined)
    || (req.query["api_key"] as string | undefined);
  const certHeader = req.headers["x-certificate"] as string | undefined;

  if (!apiKeyHeader || !certHeader) {
    res.status(401).json({ error: "API Key e Certificado são obrigatórios (headers X-API-Key e X-Certificate)" });
    return;
  }

  const keyHash = createHash("sha256").update(apiKeyHeader).digest("hex");
  const [key] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.keyHash, keyHash));

  if (!key || !key.isActive) {
    res.status(401).json({ error: "API key inválida ou inativa" });
    return;
  }

  const fingerprint = certHeader.trim();
  const now = new Date();
  const [cert] = await db
    .select()
    .from(certificatesTable)
    .where(
      and(
        eq(certificatesTable.fingerprint, fingerprint),
        eq(certificatesTable.isActive, true),
        eq(certificatesTable.userId, key.userId)
      )
    );

  if (!cert) {
    res.status(401).json({ error: "Certificado inválido, revogado ou não encontrado" });
    return;
  }

  if (cert.expiresAt < now) {
    res.status(401).json({ error: "Certificado expirado" });
    return;
  }

  if (cert.userId !== key.userId) {
    res.status(401).json({ error: "API Key e Certificado não pertencem ao mesmo usuário" });
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
  req.isCertAuth = true;
  next();
}

/**
 * Aceita: API Key + Certificado (isCertAuth=true, sujeito a restrição IP do vault),
 *         API Key sozinha (isCertAuth=false, sujeito a restrição IP do vault),
 *         ou JWT de sessão (isCertAuth=false, isApiKeyAuth=false).
 */
export async function requireAuthOrApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = (req.headers["x-api-key"] as string | undefined)
    || (req.query["api_key"] as string | undefined);
  const certHeader = req.headers["x-certificate"] as string | undefined;

  if (apiKeyHeader && certHeader) {
    await requireApiKeyAndCert(req, res, next);
    return;
  }

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
    req.isCertAuth = false;
    next();
    return;
  }

  await requireAuth(req, res, next);
}
