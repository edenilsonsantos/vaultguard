import { Router } from "express";
import type { IRouter } from "express";
import { db, certificatesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateClientCertificate } from "../lib/crypto";
import { GenerateCertificateBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/certificates", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const certs = await db.select().from(certificatesTable).where(eq(certificatesTable.userId, userId));

  res.json(
    certs.map((c) => ({
      id: c.id,
      name: c.name,
      fingerprint: c.fingerprint,
      isActive: c.isActive,
      expiresAt: c.expiresAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

router.post("/certificates", requireAuth, async (req, res): Promise<void> => {
  const parsed = GenerateCertificateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, validityDays } = parsed.data;
  const userId = req.user!.userId;

  const generated = generateClientCertificate(name, validityDays);

  const [cert] = await db
    .insert(certificatesTable)
    .values({
      userId,
      name,
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
      fingerprint: generated.fingerprint,
      isActive: true,
      expiresAt: generated.expiresAt,
    })
    .returning();

  res.status(201).json({
    id: cert.id,
    name: cert.name,
    fingerprint: cert.fingerprint,
    isActive: cert.isActive,
    expiresAt: cert.expiresAt.toISOString(),
    createdAt: cert.createdAt.toISOString(),
    pemBundle: generated.pemBundle,
  });
});

router.delete("/certificates/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db
    .delete(certificatesTable)
    .where(and(eq(certificatesTable.id, id), eq(certificatesTable.userId, req.user!.userId)));

  res.sendStatus(204);
});

router.get("/certificates/:id/download", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const userId = req.user!.userId;
  const [cert] = await db
    .select()
    .from(certificatesTable)
    .where(and(eq(certificatesTable.id, id), eq(certificatesTable.userId, userId)));

  if (!cert) {
    res.status(403).json({ error: "Access denied or certificate not found" });
    return;
  }

  const pemBundle = cert.publicKey + "\n" + cert.privateKey;

  res.json({
    id: cert.id,
    name: cert.name,
    pemBundle,
    fingerprint: cert.fingerprint,
  });
});

export default router;
