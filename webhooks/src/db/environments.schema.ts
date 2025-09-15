import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const environments = sqliteTable("environments", {
    id: text("id").primaryKey(), // 4-character hex string
    name: text("name").notNull().unique(),
    description: text("description"),
    isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
});