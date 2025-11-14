import { Inject, Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database.module';
import { workflows, Workflow, NewWorkflow } from '../schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';

@Injectable()
export class WorkflowsRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: NewWorkflow): Promise<Workflow> {
    const [workflow] = await this.db.insert(workflows).values(data).returning();
    return workflow;
  }

  async findById(id: string): Promise<Workflow | null> {
    const [workflow] = await this.db
      .select()
      .from(workflows)
      .where(eq(workflows.id, id))
      .limit(1);
    return workflow || null;
  }

  async findByUserId(userId: string): Promise<Workflow[]> {
    return this.db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, userId))
      .orderBy(desc(workflows.createdAt));
  }

  async update(id: string, data: Partial<NewWorkflow>): Promise<Workflow> {
    // Ensure UTC time is stored
    const now = new Date();
    const [workflow] = await this.db
      .update(workflows)
      .set({ ...data, updatedAt: now })
      .where(eq(workflows.id, id))
      .returning();
    return workflow;
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(workflows).where(eq(workflows.id, id));
  }
}
