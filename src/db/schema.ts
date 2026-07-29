import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }),
});

export const dailyChatUsage = pgTable(
  "daily_chat_usage",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    usageDate: date("usage_date").notNull(),
    chatCount: integer("chat_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_chat_usage_user_date_unique").on(
      table.userId,
      table.usageDate,
    ),
  ],
);

export const generatedImages = pgTable(
  "generated_images",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: varchar("task_id", { length: 160 }).notNull(),
    kind: varchar("kind", { length: 32 }).notNull(),
    prompt: text("prompt").notNull(),
    imageUrl: varchar("image_url", { length: 2_048 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("generated_images_task_id_unique").on(table.taskId),
  ],
);
