import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const workflows = pgTable('workflows', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  name: varchar('name', { length: 255 }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sheetId: varchar('sheet_id', { length: 255 }),
  sheetName: varchar('sheet_name', { length: 500 }),
  trelloBoardId: varchar('trello_board_id', { length: 255 }).notNull(),
  trelloListId: varchar('trello_list_id', { length: 255 }).notNull(),
  useN8n: text('use_n8n').default('false'),
  n8nWebhookUrl: text('n8n_webhook_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
