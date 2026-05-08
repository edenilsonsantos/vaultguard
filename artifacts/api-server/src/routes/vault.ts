import { Router } from "express";
import type { IRouter } from "express";
import { db, vaultItemsTable, vaultEntriesTable, vaultItemAccessTable, usersTable } from "@workspace/db";
import { eq, and, or, inArray, sql, count, desc } from "drizzle-orm";
import { requireAuth, requireAuthOrApiKey, requireAuthOrApiKeyAndCert } from "../lib/auth";
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
    authMethod: req.isApiKeyAuth ? "api" : "browser",
  });
}

function isHostAllowed(allowedHostsMode: string, allowedHosts: string | null, req: any): boolean {
  if (allowedHostsMode === "all") return true;
  if (!allowedHosts) return false;

  // Candidatos: req.ip (respeitando trust proxy), todos os IPs do X-Forwarded-For e X-Real-IP
  const candidates = new Set<string>();

  const addIp = (ip: string | undefined) => {
    if (!ip) return;
    candidates.add(ip.trim());
    candidates.add(ip.trim().replace(/^::ffff:/, ""));
  };

  addIp(req.ip);
  (req.ips ?? []).forEach(addIp);

  // X-Forwarded-For pode ter múltiplos IPs separados por vírgula
  const xForwardedFor = req.headers?.["x-forwarded-for"] as string | undefined;
  if (xForwardedFor) {
    xForwardedFor.split(",").forEach((ip: string) => addIp(ip.trim()));
  }

  addIp(req.headers?.["x-real-ip"]);

  if (candidates.size === 0) return false;

  try {
    const hosts = JSON.parse(allowedHosts) as string[];
    return hosts.some((h) => candidates.has(h.trim()));
  } catch {
    return false;
  }
}

function parseAllowedHosts(allowedHosts: string | null): string[] {
  if (!allowedHosts) return [];
  try {
    return JSON.parse(allowedHosts) as string[];
  } catch {
    return [];
  }
}

function formatVaultItemSummary(
  item: typeof vaultItemsTable.$inferSelect,
  entryCount: number,
  creatorUsername: string
) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description ?? null,
    accessControl: item.accessControl,
    allowedHostsMode: item.allowedHostsMode,
    allowedHosts: parseAllowedHosts(item.allowedHosts),
    entryCount,
    createdBy: item.createdBy,
    createdByUsername: creatorUsername,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function formatVaultItem(
  item: typeof vaultItemsTable.$inferSelect,
  entries: { key: string; encryptedValue: string }[],
  allowedUserIds: number[],
  creatorUsername: string,
  isApiKeyAccess: boolean
) {
  const isCredential = item.category === "credencial";
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description ?? null,
    accessControl: item.accessControl,
    allowedUserIds,
    allowedHostsMode: item.allowedHostsMode,
    allowedHosts: parseAllowedHosts(item.allowedHosts),
    entries: entries.map((e) => ({
      key: e.key,
      value: isCredential && !isApiKeyAccess ? "[PROTEGIDO]" : decryptValue(e.encryptedValue),
    })),
    createdBy: item.createdBy,
    createdByUsername: creatorUsername,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
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
      return formatVaultItemSummary(item, entries.length, creator[0]?.username ?? "unknown");
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

  const { name, category, description, accessControl, allowedUserIds, allowedHostsMode, allowedHosts, entries } = parsed.data;

  const hostsMode = allowedHostsMode ?? "all";
  const hostsJson = hostsMode === "specific" && allowedHosts && allowedHosts.length > 0
    ? JSON.stringify(allowedHosts)
    : null;

  const [item] = await db
    .insert(vaultItemsTable)
    .values({
      name,
      category,
      description: description ?? null,
      accessControl: accessControl ?? "all",
      allowedHostsMode: hostsMode,
      allowedHosts: hostsJson,
      createdBy: req.user!.userId,
    })
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

  res.status(201).json(formatVaultItem(item, entryRows, accessRows.map((a) => a.userId), creator[0]?.username ?? "unknown", false));
});

router.get("/vault/byID/:id", requireAuthOrApiKeyAndCert, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const userId = req.user!.userId;
  const canAccess = await canAccessVaultItem(id, userId);
  if (!canAccess) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const [item] = await db.select().from(vaultItemsTable).where(eq(vaultItemsTable.id, id));
  if (!item) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  if (req.isApiKeyAuth) {
    if (!isHostAllowed(item.allowedHostsMode, item.allowedHosts, req)) {
      res.status(403).json({ error: "Acesso via API não permitido para este host", clientIp: req.ip, xForwardedFor: req.headers["x-forwarded-for"], allowedHostsMode: item.allowedHostsMode });
      return;
    }
  }

  await logAccess(id, userId, req);

  const entryRows = await db.select().from(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, id));
  const accessRows = await db.select().from(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, id));
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, item.createdBy));

  res.json(formatVaultItem(item, entryRows, accessRows.map((a) => a.userId), creator[0]?.username ?? "unknown", req.isApiKeyAuth ?? false));
});

router.get("/vault/byName/:name", requireAuthOrApiKeyAndCert, async (req, res): Promise<void> => {
  const rawName = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
  const name = decodeURIComponent(rawName);

  const userId = req.user!.userId;

  const items = await db
    .select()
    .from(vaultItemsTable)
    .where(sql`lower(${vaultItemsTable.name}) = lower(${name})`);

  if (items.length === 0) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  const item = items[0];
  const canAccess = await canAccessVaultItem(item.id, userId);
  if (!canAccess) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  if (req.isApiKeyAuth) {
    if (!isHostAllowed(item.allowedHostsMode, item.allowedHosts, req)) {
      res.status(403).json({ error: "Acesso via API não permitido para este host", clientIp: req.ip, xForwardedFor: req.headers["x-forwarded-for"], allowedHostsMode: item.allowedHostsMode });
      return;
    }
  }

  await logAccess(item.id, userId, req);

  const entryRows = await db.select().from(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, item.id));
  const accessRows = await db.select().from(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, item.id));
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, item.createdBy));

  res.json(formatVaultItem(item, entryRows, accessRows.map((a) => a.userId), creator[0]?.username ?? "unknown", req.isApiKeyAuth ?? false));
});

router.get("/vault/:id", requireAuthOrApiKeyAndCert, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const userId = req.user!.userId;
  const canAccess = await canAccessVaultItem(id, userId);
  if (!canAccess) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const [item] = await db.select().from(vaultItemsTable).where(eq(vaultItemsTable.id, id));
  if (!item) {
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  if (req.isApiKeyAuth) {
    if (!isHostAllowed(item.allowedHostsMode, item.allowedHosts, req)) {
      res.status(403).json({
        error: "Acesso via API não permitido para este host",
        clientIp: req.ip,
        xForwardedFor: req.headers["x-forwarded-for"],
        allowedHostsMode: item.allowedHostsMode,
      });
      return;
    }
  }

  await logAccess(id, userId, req);

  const entryRows = await db.select().from(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, id));
  const accessRows = await db.select().from(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, id));
  const creator = await db.select().from(usersTable).where(eq(usersTable.id, item.createdBy));

  res.json(formatVaultItem(
    item,
    entryRows,
    accessRows.map((a) => a.userId),
    creator[0]?.username ?? "unknown",
    req.isApiKeyAuth ?? false
  ));
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
    res.status(404).json({ error: "Item não encontrado" });
    return;
  }

  const updates: Partial<{
    name: string;
    category: string;
    description: string | null;
    accessControl: string;
    allowedHostsMode: string;
    allowedHosts: string | null;
  }> = {};

  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.category != null) updates.category = parsed.data.category;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description ?? null;
  if (parsed.data.accessControl != null) updates.accessControl = parsed.data.accessControl;

  if (parsed.data.allowedHostsMode != null) {
    updates.allowedHostsMode = parsed.data.allowedHostsMode;
    if (parsed.data.allowedHostsMode === "specific" && parsed.data.allowedHosts && parsed.data.allowedHosts.length > 0) {
      updates.allowedHosts = JSON.stringify(parsed.data.allowedHosts);
    } else if (parsed.data.allowedHostsMode === "all") {
      updates.allowedHosts = null;
    }
  }

  const [updatedItem] = await db
    .update(vaultItemsTable)
    .set(updates)
    .where(eq(vaultItemsTable.id, id))
    .returning();

  if (parsed.data.entries !== undefined) {
    const existingEntries = await db
      .select()
      .from(vaultEntriesTable)
      .where(eq(vaultEntriesTable.vaultItemId, id));

    const existingMap = new Map(existingEntries.map((e) => [e.key, e.encryptedValue]));

    await db.delete(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, id));

    if (parsed.data.entries.length > 0) {
      await db.insert(vaultEntriesTable).values(
        parsed.data.entries.map((e) => ({
          vaultItemId: id,
          key: e.key,
          encryptedValue: e.value === "" && existingMap.has(e.key)
            ? existingMap.get(e.key)!
            : encryptValue(e.value),
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

  res.json(formatVaultItem(
    updatedItem,
    entryRows,
    accessRows.map((a) => a.userId),
    creator[0]?.username ?? "unknown",
    false
  ));
});

router.delete("/vault/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  // Remove child records before deleting the parent (FK constraints)
  await db.delete(vaultEntriesTable).where(eq(vaultEntriesTable.vaultItemId, id));
  await db.delete(vaultItemAccessTable).where(eq(vaultItemAccessTable.vaultItemId, id));
  await db.delete(auditLogsTable).where(eq(auditLogsTable.vaultItemId, id));
  await db.delete(vaultItemsTable).where(eq(vaultItemsTable.id, id));
  res.sendStatus(204);
});

export default router;
