/**
 * Standalone script to clean all database data
 * WARNING: This will delete ALL data from all tables!
 *
 * This script is separate from migrations and will NOT run automatically.
 *
 * Usage:
 *   npm run db:clean
 * Or:
 *   npx tsx src/database/clean-db.ts
 */

import * as dotenv from 'dotenv';

// Use require for postgres to handle CommonJS/ESM compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const postgres = require('postgres');

dotenv.config();

async function cleanDatabase() {
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
    connect_timeout: 30, // Increase timeout for cleanup operations
  });

  try {
    console.log('⚠️  WARNING: This will delete ALL data from all tables!');
    console.log('Starting database cleanup...');

    // Truncate all tables in the correct order
    // Using CASCADE to handle foreign key dependencies automatically
    await client.unsafe('TRUNCATE TABLE "cards_log" CASCADE');
    console.log('✓ Cleaned cards_log table');

    await client.unsafe('TRUNCATE TABLE "workflows" CASCADE');
    console.log('✓ Cleaned workflows table');

    await client.unsafe('TRUNCATE TABLE "users" CASCADE');
    console.log('✓ Cleaned users table');

    console.log('✅ Database cleanup completed successfully!');
  } catch (error: any) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  cleanDatabase().catch((error) => {
    console.error('Failed to clean database:', error);
    process.exit(1);
  });
}

export { cleanDatabase };
