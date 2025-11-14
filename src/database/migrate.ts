import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Use require for postgres to handle CommonJS/ESM compatibility
const postgres = require('postgres');

dotenv.config();

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`Running migration: ${file}`);
      await client.unsafe(sql);
    }
  }

  await client.end();
  console.log('Migrations completed');
}

migrate().catch(console.error);
