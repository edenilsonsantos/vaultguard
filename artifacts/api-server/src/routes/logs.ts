import { Router } from "express";
import type { IRouter } from "express";
import { db, auditLogsTable, usersTable, vaultItemsTable } from "@workspace/db";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { ListAuditLogsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/logs", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListAuditLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { vaultItemId, userId: filterUserId, page = 1, pageSize = 50 } = parsed.data;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const conditions = [gte(auditLogsTable.createdAt, thirtyDaysAgo)];
  if (vaultItemId) conditions.push(eq(auditLogsTable.vaultItemId, vaultItemId));
  if (filterUserId) conditions.push(eq(auditLogsTable.userId, filterUserId));

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const offset = (page - 1) * pageSize;

  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(whereClause)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(auditLogsTable)
    .where(whereClause);

  const enriched = await Promise.all(
    logs.map(async (log) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, log.userId));
      const [item] = await db.select().from(vaultItemsTable).where(eq(vaultItemsTable.id, log.vaultItemId));
      return {
        id: log.id,
        userId: log.userId,
        username: user?.username ?? "unknown",
        vaultItemId: log.vaultItemId,
        vaultItemName: item?.name ?? "deleted",
        action: log.action,
        ipAddress: log.ipAddress ?? null,
        userAgent: log.userAgent ?? null,
        authMethod: log.authMethod ?? null,
        createdAt: log.createdAt.toISOString(),
      };
    })
  );

  res.json({
    logs: enriched,
    total: Number(total),
    page,
    pageSize,
  });
});

router.get("/logs/stats", requireAuth, async (req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const allLogs = await db
    .select()
    .from(auditLogsTable)
    .where(gte(auditLogsTable.createdAt, thirtyDaysAgo))
    .orderBy(desc(auditLogsTable.createdAt));

  const uniqueUsers = new Set(allLogs.map((l) => l.userId)).size;

  const itemCounts: Record<number, number> = {};
  for (const log of allLogs) {
    itemCounts[log.vaultItemId] = (itemCounts[log.vaultItemId] || 0) + 1;
  }

  const topItemIds = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => parseInt(id));

  const topAccessedItems = await Promise.all(
    topItemIds.map(async (id) => {
      const [item] = await db.select().from(vaultItemsTable).where(eq(vaultItemsTable.id, id));
      return {
        vaultItemId: id,
        vaultItemName: item?.name ?? "deleted",
        accessCount: itemCounts[id],
      };
    })
  );

  const recentLogs = await db
    .select()
    .from(auditLogsTable)
    .where(gte(auditLogsTable.createdAt, thirtyDaysAgo))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(10);

  const recentActivity = await Promise.all(
    recentLogs.map(async (log) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, log.userId));
      const [item] = await db.select().from(vaultItemsTable).where(eq(vaultItemsTable.id, log.vaultItemId));
      return {
        id: log.id,
        userId: log.userId,
        username: user?.username ?? "unknown",
        vaultItemId: log.vaultItemId,
        vaultItemName: item?.name ?? "deleted",
        action: log.action,
        ipAddress: log.ipAddress ?? null,
        userAgent: log.userAgent ?? null,
        authMethod: log.authMethod ?? null,
        createdAt: log.createdAt.toISOString(),
      };
    })
  );

  res.json({
    totalAccesses: allLogs.length,
    uniqueUsers,
    topAccessedItems,
    recentActivity,
  });
});

export default router;
