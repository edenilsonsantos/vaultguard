import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { UpdateUserBody } from "@workspace/api-zod";

const DEMO_USERNAMES = ["demo_user", "demo_admin"];

const router: IRouter = Router();

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
  };
}

router.get("/users", requireAuth, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  res.json(users.map(formatUser));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json({
    ...formatUser(user),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
});

router.patch("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<{ email: string; fullName: string; role: string }> = {};
  if (parsed.data.email != null) updates.email = parsed.data.email;
  if (parsed.data.fullName != null) updates.fullName = parsed.data.fullName;
  if (parsed.data.role != null) updates.role = parsed.data.role;

  // Safety check: cannot demote the last active admin
  if (updates.role === "user") {
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (target?.role === "admin" && target?.isActive) {
      const activeAdmins = await db
        .select()
        .from(usersTable)
        .where(and(eq(usersTable.role, "admin"), eq(usersTable.isActive, true)));

      if (activeAdmins.length <= 1) {
        res.status(400).json({
          error: "Não é possível rebaixar o único administrador ativo. Promova outro usuário a admin antes.",
        });
        return;
      }
    }
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json(formatUser(user));
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  if (DEMO_USERNAMES.includes(target.username)) {
    res.status(403).json({ error: "Usuários de demonstração não podem ser excluídos." });
    return;
  }

  // Safety check: cannot delete the last active admin
  if (target.role === "admin" && target.isActive) {
    const activeAdmins = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.role, "admin"), eq(usersTable.isActive, true)));

    if (activeAdmins.length <= 1) {
      res.status(400).json({
        error: "Não é possível excluir o único administrador ativo. Promova outro usuário a admin antes de excluir este.",
      });
      return;
    }
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

// Reset password: mark user as needing password reset
router.post("/users/:id/reset-password", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  if (DEMO_USERNAMES.includes(user.username)) {
    res.status(403).json({ error: "A senha de usuários de demonstração não pode ser redefinida." });
    return;
  }

  await db
    .update(usersTable)
    .set({ requiresPasswordReset: true, passwordHash: "" })
    .where(eq(usersTable.id, id));

  res.json({ message: `Redefinição de senha solicitada para @${user.username}. O usuário deverá definir uma nova senha no próximo acesso.` });
});

// Toggle user active status
router.patch("/users/:id/toggle-active", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  const newIsActive = !user.isActive;

  // Safety check: cannot disable last active admin
  if (!newIsActive && user.role === "admin") {
    const activeAdmins = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.role, "admin"), eq(usersTable.isActive, true)));

    if (activeAdmins.length <= 1) {
      res.status(400).json({
        error: "Não é possível desativar o último administrador ativo. O sistema requer ao menos 1 administrador ativo.",
      });
      return;
    }
  }

  const [updated] = await db
    .update(usersTable)
    .set({ isActive: newIsActive })
    .where(eq(usersTable.id, id))
    .returning();

  res.json(formatUser(updated));
});

export default router;
