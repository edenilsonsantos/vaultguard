import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vaultItemsTable } from "./vault_items";

export const vaultEntriesTable = pgTable("vault_entries", {
  id: serial("id").primaryKey(),
  vaultItemId: integer("vault_item_id").notNull().references(() => vaultItemsTable.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVaultEntrySchema = createInsertSchema(vaultEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVaultEntry = z.infer<typeof insertVaultEntrySchema>;
export type VaultEntry = typeof vaultEntriesTable.$inferSelect;
