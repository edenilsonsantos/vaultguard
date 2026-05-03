import { Router } from "express";
import type { IRouter } from "express";
import { db, apiKeysTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateApiKey } from "../lib/crypto";
import { CreateApiKeyBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/apikeys", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const keys = await db.select().from(apiKeysTable).where(eq(apiKeysTable.userId, userId));

  res.json(
    keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      createdAt: k.createdAt.toISOString(),
    }))
  );
});

router.post("/apikeys", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateApiKeyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { rawKey, keyHash, keyPrefix } = generateApiKey();
  const userId = req.user!.userId;

  const [apiKey] = await db
    .insert(apiKeysTable)
    .values({ userId, name: parsed.data.name, keyHash, keyPrefix, isActive: true })
    .returning();

  res.status(201).json({
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    rawKey,
    createdAt: apiKey.createdAt.toISOString(),
  });
});

router.delete("/apikeys/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db
    .delete(apiKeysTable)
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, req.user!.userId)));

  res.sendStatus(204);
});

export default router;
