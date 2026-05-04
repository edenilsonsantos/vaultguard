import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  generateToken,
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  requireAuth,
  verifyToken,
} from "../lib/auth";
import {
  RegisterBody,
  LoginBody,
  ChangePasswordBody,
  SetInitialPasswordBody,
  ConfirmTwoFactorBody,
  VerifyTwoFactorBody,
} from "@workspace/api-zod";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

const router: IRouter = Router();

// In-memory store for pending 2FA secrets (userId → {secret, expiresAt})
const pending2fa = new Map<number, { secret: string; expiresAt: number }>();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    requiresPasswordReset: u.requiresPasswordReset,
    totpEnabled: u.totpEnabled,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, email, password, fullName } = parsed.data;

  if (!validatePasswordStrength(password)) {
    res.status(400).json({
      error: "A senha deve ter no mínimo 12 caracteres com maiúscula, minúscula, número e caractere especial",
    });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(409).json({ error: "Username já existe" });
    return;
  }

  const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail.length > 0) {
    res.status(409).json({ error: "Email já cadastrado" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const allUsers = await db.select().from(usersTable);
  const role = allUsers.length === 0 ? "admin" : "user";

  const [user] = await db
    .insert(usersTable)
    .values({ username, email, passwordHash, fullName, role })
    .returning();

  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  res.status(201).json({ user: formatUser(user), token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (!user) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Usuário desativado. Contate o administrador." });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "Redefinição de senha obrigatória" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  if (user.requiresPasswordReset) {
    const token = generateToken({ userId: user.id, username: user.username, role: user.role }, "5m");
    res.json({ user: formatUser(user), token, requiresPasswordReset: true });
    return;
  }

  if (user.totpEnabled) {
    const tempToken = generateToken(
      { userId: user.id, username: user.username, role: user.role, phase: "2fa_pending" },
      "5m"
    );
    res.json({ user: formatUser(user), token: "", requiresTwoFactor: true, tempToken });
    return;
  }

  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  res.json({ user: formatUser(user), token });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Desconectado com sucesso" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }
  res.json(formatUser(user));
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  if (!validatePasswordStrength(newPassword)) {
    res.status(400).json({
      error: "A senha deve ter no mínimo 12 caracteres com maiúscula, minúscula, número e caractere especial",
    });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Senha atual incorreta" });
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
  res.json({ message: "Senha alterada com sucesso" });
});

// Check if username requires password reset (public)
router.get("/auth/check-reset", async (req, res): Promise<void> => {
  const username = req.query.username as string;
  if (!username) {
    res.status(400).json({ error: "Username é obrigatório" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.json({ requiresReset: false, isActive: true });
    return;
  }

  res.json({
    requiresReset: user.requiresPasswordReset || !user.passwordHash,
    isActive: user.isActive,
  });
});

// Set initial password after admin reset (public)
router.post("/auth/set-password", async (req, res): Promise<void> => {
  const parsed = SetInitialPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, newPassword } = parsed.data;

  if (!validatePasswordStrength(newPassword)) {
    res.status(400).json({
      error: "A senha deve ter no mínimo 12 caracteres com maiúscula, minúscula, número e caractere especial",
    });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  if (!user.requiresPasswordReset && user.passwordHash) {
    res.status(400).json({ error: "Redefinição de senha não está pendente para este usuário" });
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  const [updated] = await db
    .update(usersTable)
    .set({ passwordHash, requiresPasswordReset: false })
    .where(eq(usersTable.id, user.id))
    .returning();

  const token = generateToken({ userId: updated.id, username: updated.username, role: updated.role });
  res.json({ user: formatUser(updated), token });
});

// 2FA Setup: generate secret + QR code
router.post("/auth/2fa/setup", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  const secret = generateSecret();
  const otpauthUrl = generateURI({
    strategy: "totp",
    label: user.email,
    issuer: "VaultGuard",
    secret,
  });

  // Store pending secret with 10-minute expiry
  pending2fa.set(userId, { secret, expiresAt: Date.now() + 10 * 60 * 1000 });

  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
  res.json({ secret, qrCodeUrl, otpauthUrl });
});

// 2FA Confirm: verify OTP and enable
router.post("/auth/2fa/confirm", requireAuth, async (req, res): Promise<void> => {
  const parsed = ConfirmTwoFactorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;
  const pending = pending2fa.get(userId);

  if (!pending || Date.now() > pending.expiresAt) {
    pending2fa.delete(userId);
    res.status(400).json({ error: "Sessão de configuração 2FA expirada. Inicie novamente." });
    return;
  }

  let isValid = false;
  try {
    isValid = Boolean(verifySync({ token: parsed.data.otp, secret: pending.secret }));
  } catch {
    isValid = false;
  }

  if (!isValid) {
    res.status(400).json({ error: "Código OTP inválido" });
    return;
  }

  pending2fa.delete(userId);
  await db
    .update(usersTable)
    .set({ totpSecret: pending.secret, totpEnabled: true })
    .where(eq(usersTable.id, userId));

  res.json({ message: "Autenticação de dois fatores ativada com sucesso" });
});

// 2FA Disable
router.post("/auth/2fa/disable", requireAuth, async (req, res): Promise<void> => {
  const parsed = ConfirmTwoFactorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user || !user.totpEnabled || !user.totpSecret) {
    res.status(400).json({ error: "2FA não está ativado" });
    return;
  }

  let isValid = false;
  try {
    isValid = Boolean(verifySync({ token: parsed.data.otp, secret: user.totpSecret }));
  } catch {
    isValid = false;
  }

  if (!isValid) {
    res.status(400).json({ error: "Código OTP inválido" });
    return;
  }

  await db
    .update(usersTable)
    .set({ totpSecret: null, totpEnabled: false })
    .where(eq(usersTable.id, userId));

  res.json({ message: "Autenticação de dois fatores desativada" });
});

// 2FA Verify: complete login with OTP
router.post("/auth/2fa/verify", async (req, res): Promise<void> => {
  const parsed = VerifyTwoFactorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tempToken, otp } = parsed.data;
  const payload = verifyToken(tempToken) as any;

  if (!payload || payload.phase !== "2fa_pending") {
    res.status(401).json({ error: "Token temporário inválido ou expirado" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));

  if (!user || !user.totpEnabled || !user.totpSecret) {
    res.status(401).json({ error: "Usuário inválido ou 2FA não configurado" });
    return;
  }

  let isValid = false;
  try {
    isValid = Boolean(verifySync({ token: otp, secret: user.totpSecret }));
  } catch {
    isValid = false;
  }

  if (!isValid) {
    res.status(401).json({ error: "Código OTP inválido" });
    return;
  }

  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  res.json({ user: formatUser(user), token });
});

export default router;
