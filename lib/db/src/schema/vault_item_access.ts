import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vaultItemsTable } from "./vault_items";
import { usersTable } from "./users";

export const vaultItemAccessTable = pgTable("vault_item_access", {
  id: serial("id").primaryKey(),
  vaultItemId: integer("vault_item_id").notNull().references(() => vaultItemsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVaultItemAccessSchema = createInsertSchema(vaultItemAccessTable).omit({ id: true, createdAt: true });
export type InsertVaultItemAccess = z.infer<typeof insertVaultItemAccessSchema>;
export type VaultItemAccess = typeof vaultItemAccessTable.$inferSelect;
