import { Router } from "express";
import type { IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const DEFAULT_SETTINGS: Record<string, string> = {
  show_demo_credentials: "true",
  session_timeout_minutes: "0",
};

async function ensureDefaults() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
    if (existing.length === 0) {
      await db.insert(settingsTable).values({ key, value });
    }
  }
}

router.get("/settings", async (_req, res): Promise<void> => {
  await ensureDefaults();
  const settings = await db.select().from(settingsTable);
  res.json(settings.map((s) => ({ key: s.key, value: s.value })));
});

const DEMO_USERNAMES = ["demo_admin", "demo_user"];
const SETTINGS_BLOCKED_FOR_DEMO = ["show_demo_credentials"];

router.put("/settings/:key", requireAdmin, async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;

  const username = (req.user as { username?: string } | undefined)?.username ?? "";
  if (DEMO_USERNAMES.includes(username) && SETTINGS_BLOCKED_FOR_DEMO.includes(key)) {
    res.status(403).json({ error: "Usuários de demonstração não podem alterar esta configuração." });
    return;
  }

  if (!req.body || typeof req.body.value !== "string") {
    res.status(400).json({ error: "Valor é obrigatório" });
    return;
  }

  const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  if (existing.length === 0) {
    const [created] = await db.insert(settingsTable).values({ key, value: req.body.value }).returning();
    res.json({ key: created.key, value: created.value });
    return;
  }

  const [updated] = await db
    .update(settingsTable)
    .set({ value: req.body.value })
    .where(eq(settingsTable.key, key))
    .returning();

  res.json({ key: updated.key, value: updated.value });
});

export default router;
