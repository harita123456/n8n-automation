import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database.module';
import { users, User, NewUser } from '../schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user || null;
  }

  async update(id: string, data: Partial<NewUser>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<User> {
    return this.update(id, {
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
    });
  }
}
