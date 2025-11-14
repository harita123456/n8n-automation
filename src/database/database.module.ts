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
          throw new Error('DATABASE_URL is not defined');
        }
        // postgres-js automatically handles UTC timestamps
        // PostgreSQL timestamptz columns store in UTC
        const client = postgres(connectionString);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
