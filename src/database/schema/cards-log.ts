import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { workflows } from './workflows';

export const cardsLog = pgTable('cards_log', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  cardId: varchar('card_id', { length: 255 }),
  title: varchar('title', { length: 500 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  errorMessage: text('error_message'),
  description: text('description'),
  members: text('members'),
  labels: text('labels'),
  totalHours: varchar('total_hours', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type CardLog = typeof cardsLog.$inferSelect;
export type NewCardLog = typeof cardsLog.$inferInsert;
