import { Router } from "express";
import type { IRouter } from "express";
import { db, vaultItemsTable, vaultEntriesTable, vaultItemAccessTable, usersTable } from "@workspace/db";
import { eq, and, or, inArray, sql, count, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { encryptValue, decryptValue } from "../lib/crypto";
import { CreateVaultItemBody, UpdateVaultItemBody } from "@workspace/api-zod";
import { auditLogsTable } from "@workspace/db";

const router: IRouter = Router();

async function canAccessVaultItem(vaultItemId: number, userId: number): Promise<boolean> {
  const [item] = await db.select().from(vaultItemsTable).where(eq(vaultItemsTable.id, vaultItemId));
  if (!item) return false;
  if (item.accessControl === "all") return true;
  if (item.createdBy === userId) return true;
  const access = await db
    .select()
    .from(vaultItemAccessTable)
    .where(and(eq(vaultItemAccessTable.vaultItemId, vaultItemId), eq(vaultItemAccessTable.userId, userId)));
  return access.length > 0;
}

async function logAccess(vaultItemId: number, userId: number, req: any): Promise<void> {
  await db.insert(auditLogsTable).values({
    userId,
    vaultItemId,
    action: "read",
    ipAddress: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  });
}

router.get("/vault", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const allItems = await db.select().from(vaultItemsTable);

  const accessChecks = await Promise.all(
    allItems.map(async (item) => ({
      item,
      canAccess: await canAccessVaultItem(item.id, userId),
    }))
  );

  const accessibleItems = accessChecks.filter((x) => x.canAccess).map((x) => x.item);

  const result = await Promise.all(
    accessibleItems.map(async (item) => {
      const entries = await db
        .select()
        .from(vaultEntriesTable)
        .where(eq(vaultEntriesTable.vaultItemId, item.id));
      const creator = await db.select().from(usersTable).where(eq(usersTable.id, item.createdBy));
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description ?? null,
        accessControl: item.accessControl,
        entryCount: entries.length,
        createdBy: item.createdBy,
        createdByUsername: creator[0]?.username ?? "unknown",
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.get("/vault/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const allItems = await db.select().from(vaultItemsTable);

  const accessChecks = await Promise.all(
    allItems.map(async (item) => ({
      item,
      canAccess: await canAccessVaultItem(item.id, userId),
    }))
  );

  const accessible = accessChecks.filter((x) => x.canAccess);
  const allEntries = await db.select().from(vaultEntriesTable);

  res.json({
    totalItems: allItems.length,
    credentialCount: allItems.filter((i) => i.category === "credencial").length,
    globalVarCount: allItems.filter((i) => i.category === "variavel_global").length,
    totalEntries: allEntries.length,
    accessibleToMe: accessible.length,
  });
});

router.post("/vault", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateVaultItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, category, description, accessControl, allowedUserIds, entries } = parsed.data;

  const [item] = await db
    .insert(vaultItemsTable)
    .values({ name, category, description: description ?? null, accessControl: accessControl ?? "all", createdBy: req.user!.userId })
    .returning();

  if (entries && entries.length > 0) {
    await db.insert(vaultEntriesTable).values(
      entries.map((e) => ({
        vaultItemId: item.id,
        key: e.key,
        encryptedValue: encryptValue(e.value),
      }))
    );
  }

  if (accessControl === "specific" && allowedUserIds && allowedUserIds.length > 0) {
    await db.insert(vaultItemAccessTable).values(
      allowedUserIds.map((uid) => ({ vaultItemId: item.id, userId: uid }))
    );
  }

  const entryRows = await db.select().from(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, item.id));
  const accessRows = await db.select().from(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, item.id));
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, item.createdBy));

  res.status(201).json({
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description ?? null,
    accessControl: item.accessControl,
    allowedUserIds: accessRows.map((a) => a.userId),
    entries: entryRows.map((e) => ({ key: e.key, value: decryptValue(e.encryptedValue) })),
    createdBy: item.createdBy,
    createdByUsername: creator[0]?.username ?? "unknown",
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });
});

router.get("/vault/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const userId = req.user!.userId;
  const canAccess = await canAccessVaultItem(id, userId);
  if (!canAccess) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const [item] = await db.select().from(vaultItemsTable).where(eq(vaultItemsTable.id, id));
  if (!item) {
    res.status(404).json({ error: "Vault item not found" });
    return;
  }

  await logAccess(id, userId, req);

  const entryRows = await db.select().from(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, id));
  const accessRows = await db.select().from(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, id));
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, item.createdBy));

  res.json({
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description ?? null,
    accessControl: item.accessControl,
    allowedUserIds: accessRows.map((a) => a.userId),
    entries: entryRows.map((e) => ({ key: e.key, value: decryptValue(e.encryptedValue) })),
    createdBy: item.createdBy,
    createdByUsername: creator[0]?.username ?? "unknown",
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });
});

router.patch("/vault/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = UpdateVaultItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.select().from(vaultItemsTable).where(eq(vaultItemsTable.id, id));
  if (!item) {
    res.status(404).json({ error: "Vault item not found" });
    return;
  }

  const updates: Partial<{ name: string; category: string; description: string | null; accessControl: string }> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.category != null) updates.category = parsed.data.category;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description ?? null;
  if (parsed.data.accessControl != null) updates.accessControl = parsed.data.accessControl;

  const [updatedItem] = await db
    .update(vaultItemsTable)
    .set(updates)
    .where(eq(vaultItemsTable.id, id))
    .returning();

  if (parsed.data.entries !== undefined) {
    await db.delete(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, id));
    if (parsed.data.entries.length > 0) {
      await db.insert(vaultEntriesTable).values(
        parsed.data.entries.map((e) => ({
          vaultItemId: id,
          key: e.key,
          encryptedValue: encryptValue(e.value),
        }))
      );
    }
  }

  if (parsed.data.accessControl === "specific" && parsed.data.allowedUserIds !== undefined) {
    await db.delete(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, id));
    if (parsed.data.allowedUserIds.length > 0) {
      await db.insert(vaultItemAccessTable).values(
        parsed.data.allowedUserIds.map((uid) => ({ vaultItemId: id, userId: uid }))
      );
    }
  } else if (parsed.data.accessControl === "all") {
    await db.delete(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, id));
  }

  const entryRows = await db.select().from(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, id));
  const accessRows = await db.select().from(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, id));
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, updatedItem.createdBy));

  res.json({
    id: updatedItem.id,
    name: updatedItem.name,
    category: updatedItem.category,
    description: updatedItem.description ?? null,
    accessControl: updatedItem.accessControl,
    allowedUserIds: accessRows.map((a) => a.userId),
    entries: entryRows.map((e) => ({ key: e.key, value: decryptValue(e.encryptedValue) })),
    createdBy: updatedItem.createdBy,
    createdByUsername: creator[0]?.username ?? "unknown",
    createdAt: updatedItem.createdAt.toISOString(),
    updatedAt: updatedItem.updatedAt.toISOString(),
  });
});

router.delete("/vault/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(vaultItemsTable).where(eq(vaultItemsTable.id, id));
  res.sendStatus(204);
});

export default router;
