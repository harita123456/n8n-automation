import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // For PostgreSQL, Drizzle Kit expects `connectionString` in some versions.
    // Using both keys to satisfy varying type defs; one will be ignored.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    url: process.env.DATABASE_URL || '',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    connectionString: process.env.DATABASE_URL || '',
  },
});

