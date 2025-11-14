import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Use require for postgres to handle CommonJS/ESM compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const postgres = require('postgres');

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error(
            'DATABASE_URL is not defined in environment variables. Please set DATABASE_URL in your .env file.',
          );
        }
        if (connectionString.trim() === '') {
          throw new Error(
            'DATABASE_URL is empty. Please provide a valid PostgreSQL connection string.',
          );
        }
        // Validate URL format
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(connectionString);
        } catch (error) {
          throw new Error(
            `DATABASE_URL has invalid format. Expected format: postgresql://user:password@host:port/database. Current value: ${connectionString.substring(0, 20)}...`,
          );
        }

        // Validate hostname is not empty or incomplete
        const hostname = parsedUrl.hostname;
        if (!hostname || hostname.trim() === '') {
          throw new Error(
            'DATABASE_URL is missing hostname. Check your connection string format.',
          );
        }

        // Warn if hostname looks incomplete (common issue with cloud databases)
        if (hostname.split('.').length < 2 && !hostname.includes('localhost')) {
          console.warn(
            `⚠️  Warning: Database hostname "${hostname}" may be incomplete. Cloud database hostnames usually include a domain (e.g., "hostname.provider.com").`,
          );
        }

        // Determine if SSL is needed (cloud databases require SSL, localhost usually doesn't)
        const isLocalhost =
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.');

        // postgres-js automatically handles UTC timestamps
        // PostgreSQL timestamptz columns store in UTC
        // Add connection options for better error handling
        // Enable SSL for cloud databases (Render, Railway, Supabase, etc.)
        const client = postgres(connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
          ssl: isLocalhost ? false : 'require', // Require SSL for remote databases
          onnotice: () => {}, // Suppress notices
          transform: {
            undefined: null,
          },
        });

        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
