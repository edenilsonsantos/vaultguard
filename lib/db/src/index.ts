import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";

export async function runMigrations(): Promise<void> {
  // At runtime the bundled file lives in dist/, migrations are copied there by build.mjs
  const currentDir = typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

  const migrationsFolder = path.join(currentDir, "drizzle");

  // If the DB was previously created via drizzle-kit push (no migration tracking table),
  // we seed __drizzle_migrations so that migrate() knows the initial schema is already applied.
  const client = await pool.connect();
  try {
    const { rows: tableCheck } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'users'
       ) AS exists`
    );
    const tablesExist = tableCheck[0]?.exists ?? false;

    if (tablesExist) {
      // Ensure the drizzle schema and migration-tracking table exist
      // (drizzle-orm uses the "drizzle" schema by default, not "public")
      await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
      await client.query(`
        CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )
      `);

      // Read migration journal and mark every migration as applied (if not already)
      const fs = await import("node:fs");
      const crypto = await import("node:crypto");
      const journalPath = path.join(migrationsFolder, "meta/_journal.json");

      if (fs.existsSync(journalPath)) {
        const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8")) as {
          entries: Array<{ tag: string; when: number }>;
        };

        for (const entry of journal.entries) {
          const sqlPath = path.join(migrationsFolder, `${entry.tag}.sql`);
          if (!fs.existsSync(sqlPath)) continue;

          const sqlContent = fs.readFileSync(sqlPath, "utf-8");
          const hash = crypto.createHash("sha256").update(sqlContent).digest("hex");

          const { rows } = await client.query(
            `SELECT 1 FROM drizzle."__drizzle_migrations" WHERE hash = $1`,
            [hash]
          );
          if (rows.length === 0) {
            await client.query(
              `INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
              [hash, entry.when]
            );
          }
        }
      }
    }
  } finally {
    client.release();
  }

  await migrate(db, { migrationsFolder });
}
