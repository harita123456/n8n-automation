import { Inject, Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database.module';
import { cardsLog, CardLog, NewCardLog } from '../schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';

@Injectable()
export class CardsLogRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: NewCardLog): Promise<CardLog> {
    const [log] = await this.db.insert(cardsLog).values(data).returning();
    return log;
  }

  async createMany(data: NewCardLog[]): Promise<CardLog[]> {
    if (data.length === 0) return [];
    return this.db.insert(cardsLog).values(data).returning();
  }

  async findByWorkflowId(workflowId: string): Promise<CardLog[]> {
    return this.db
      .select()
      .from(cardsLog)
      .where(eq(cardsLog.workflowId, workflowId))
      .orderBy(desc(cardsLog.createdAt));
  }

  async findById(id: string): Promise<CardLog | null> {
    const [log] = await this.db
      .select()
      .from(cardsLog)
      .where(eq(cardsLog.id, id))
      .limit(1);
    return log || null;
  }

  async update(id: string, data: Partial<NewCardLog>): Promise<CardLog> {
    const [log] = await this.db
      .update(cardsLog)
      .set(data)
      .where(eq(cardsLog.id, id))
      .returning();
    return log;
  }
}
