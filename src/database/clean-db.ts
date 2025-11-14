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

  const client = postgres(connectionString, { max: 1 });

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

