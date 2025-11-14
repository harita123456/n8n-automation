import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Use require for postgres to handle CommonJS/ESM compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const postgres = require('postgres');

dotenv.config();

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Determine if SSL is needed (cloud databases require SSL, localhost usually doesn't)
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(connectionString);
  } catch (error) {
    throw new Error('DATABASE_URL has invalid format');
  }

  const hostname = parsedUrl.hostname;
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname?.startsWith('192.168.') ||
    hostname?.startsWith('10.') ||
    hostname?.startsWith('172.');

  const client = postgres(connectionString, {
    max: 1,
    ssl: isLocalhost ? false : 'require', // Require SSL for remote databases
    connect_timeout: 30, // Increase timeout for migrations
  });

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
