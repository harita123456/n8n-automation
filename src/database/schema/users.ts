import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  googleId: varchar('google_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  avatar: text('avatar'),
  googleAccessToken: text('google_access_token'),
  googleRefreshToken: text('google_refresh_token'),
  trelloApiKey: text('trello_api_key'),
  trelloToken: text('trello_token'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
