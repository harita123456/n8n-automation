import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { WorkflowsRepository } from '../../database/repositories/workflows.repository';
import { CardsLogRepository } from '../../database/repositories/cards-log.repository';
import { UsersRepository } from '../../database/repositories/users.repository';
import { EncryptionService } from '../../common/services/encryption.service';
import { GoogleService } from '../google/google.service';
import { TrelloService } from '../trello/trello.service';
import { N8nService } from '../n8n/n8n.service';
import { CreateWorkflowDto } from '../../common/dto/create-workflow.dto';
import { MilestoneRow } from '../../common/dto/milestone-row.dto';
import { SheetParserUtil } from '../../common/utils/sheet-parser.util';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly cardsLogRepository: CardsLogRepository,
    private readonly usersRepository: UsersRepository,
    private readonly encryptionService: EncryptionService,
    private readonly googleService: GoogleService,
    private readonly trelloService: TrelloService,
    private readonly n8nService: N8nService,
  ) {}

  async createWorkflow(userId: string, dto: CreateWorkflowDto) {
    return this.workflowsRepository.create({
      userId,
      name: dto.name,
      sheetId: dto.sheetId,
      sheetName: dto.sheetName,
      trelloBoardId: dto.trelloBoardId,
      trelloListId: dto.trelloListId,
      useN8n: dto.useN8n ? 'true' : 'false',
      n8nWebhookUrl: dto.n8nWebhookUrl,
    });
  }
  async deleteWorkflow(userId: string, workflowId: string) {
    const workflow = await this.getWorkflow(userId, workflowId);
    await this.workflowsRepository.deleteById(workflow.id);
    return { success: true };
  }

  async getWorkflow(userId: string, workflowId: string) {
    const workflow = await this.workflowsRepository.findById(workflowId);
    if (!workflow || workflow.userId !== userId) {
      throw new UnauthorizedException('Workflow not found');
    }
    return workflow;
  }

  async getUserWorkflows(userId: string) {
    return this.workflowsRepository.findByUserId(userId);
  }

  async runWorkflow(
    userId: string,
    workflowId: string,
    milestones?: MilestoneRow[],
    sessionMilestones?: MilestoneRow[],
  ) {
    const workflow = await this.getWorkflow(userId, workflowId);

    // Check if workflow is already running (prevent duplicate execution)
    const existingLogs = await this.cardsLogRepository.findByWorkflowId(
      workflow.id,
    );
    const hasPendingLogs = existingLogs.some((log) => log.status === 'pending');
    if (hasPendingLogs) {
      throw new BadRequestException(
        'Workflow is already running. Please wait for it to complete.',
      );
    }

    let milestoneRows: MilestoneRow[] = milestones || [];

    // If no milestones provided, try to get from session (for file uploads)
    if (
      !milestoneRows.length &&
      sessionMilestones &&
      sessionMilestones.length > 0
    ) {
      milestoneRows = sessionMilestones;
    }

    // If still no milestones, fetch from Google Sheet
    if (!milestoneRows.length && workflow.sheetId) {
      try {
        const sheetData = await this.googleService.getSheetData(
          userId,
          workflow.sheetId,
        );
        milestoneRows = SheetParserUtil.parseGoogleSheetData(sheetData);
      } catch (error: any) {
        throw new BadRequestException(
          `Failed to fetch data from Google Sheet: ${error.message}. Please ensure the sheet is accessible and contains milestone data.`,
        );
      }
    }

    if (!milestoneRows.length) {
      throw new BadRequestException(
        'No milestones found to process. Please ensure:\n' +
          '1. If using file upload, the file was uploaded successfully\n' +
          '2. If using Google Sheet, the sheet contains data with a "Title" column\n' +
          '3. The sheet has at least one row of data',
      );
    }

    // Create logs for all milestones with full details
    const logs = await this.cardsLogRepository.createMany(
      milestoneRows.map((m) => ({
        workflowId: workflow.id,
        title: m.title,
        status: 'pending',
        description: m.description || m.modules || null,
        members: m.members || null,
        labels: m.labels || null,
        totalHours: m.totalHours ? String(m.totalHours) : null,
      })),
    );

    try {
      if (workflow.useN8n === 'true' && workflow.n8nWebhookUrl) {
        // Use n8n workflow
        const result = await this.n8nService.sendToWebhook(
          workflow.n8nWebhookUrl,
          {
            milestones: milestoneRows,
            trelloBoardId: workflow.trelloBoardId,
            trelloListId: workflow.trelloListId,
            sheetName: workflow.sheetName,
          },
        );

        // Update logs based on n8n response
        if (result.cards && Array.isArray(result.cards)) {
          for (let i = 0; i < logs.length && i < result.cards.length; i++) {
            await this.cardsLogRepository.update(logs[i].id, {
              cardId: result.cards[i].id,
              status: 'success',
            });
          }
        }

        return {
          success: true,
          cardsCreated: result.cards?.length || 0,
          total: milestoneRows.length,
          logs: await this.cardsLogRepository.findByWorkflowId(workflow.id),
        };
      } else {
        // Use direct Trello API - get user's Trello credentials
        const dbUser = await this.usersRepository.findById(userId);
        if (!dbUser?.trelloApiKey || !dbUser?.trelloToken) {
          throw new BadRequestException(
            'Trello credentials not configured. Please configure your Trello account in settings.',
          );
        }
        // Decrypt credentials
        const apiKey = this.encryptionService.decrypt(dbUser.trelloApiKey);
        const token = this.encryptionService.decrypt(dbUser.trelloToken);

        // Validate board and list still exist and are accessible
        try {
          const boards = await this.trelloService.getBoards(apiKey, token);
          const boardExists = boards.some(
            (board) => board.id === workflow.trelloBoardId,
          );
          if (!boardExists) {
            throw new BadRequestException(
              `Trello board "${workflow.trelloBoardId}" not found or no longer accessible. Please update the workflow with a valid board.`,
            );
          }

          const lists = await this.trelloService.getLists(
            workflow.trelloBoardId,
            apiKey,
            token,
          );
          const listExists = lists.some(
            (list) => list.id === workflow.trelloListId,
          );
          if (!listExists) {
            throw new BadRequestException(
              `Trello list "${workflow.trelloListId}" not found or no longer accessible. Please update the workflow with a valid list.`,
            );
          }
        } catch (error: any) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new BadRequestException(
            `Failed to validate Trello board/list: ${error.message}`,
          );
        }

        const cards = await this.trelloService.createCards(
          workflow.trelloListId,
          milestoneRows,
          apiKey,
          token,
          workflow.trelloBoardId,
        );

        // Update logs
        for (let i = 0; i < logs.length && i < cards.length; i++) {
          await this.cardsLogRepository.update(logs[i].id, {
            cardId: cards[i].id,
            status: 'success',
          });
        }

        // Mark failed logs
        for (let i = cards.length; i < logs.length; i++) {
          await this.cardsLogRepository.update(logs[i].id, {
            status: 'failed',
            errorMessage: 'Card creation failed',
          });
        }

        return {
          success: true,
          cardsCreated: cards.length,
          total: milestoneRows.length,
          logs: await this.cardsLogRepository.findByWorkflowId(workflow.id),
        };
      }
    } catch (error: any) {
      // Mark all logs as failed
      for (const log of logs) {
        await this.cardsLogRepository.update(log.id, {
          status: 'failed',
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }

  async parseUploadedFile(file: Express.Multer.File): Promise<MilestoneRow[]> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (
      !file.mimetype.includes('spreadsheet') &&
      !file.mimetype.includes('excel') &&
      !file.originalname.match(/\.(xlsx|xls|csv)$/i)
    ) {
      throw new BadRequestException('Invalid file type. Expected Excel file.');
    }

    return SheetParserUtil.parseExcel(file.buffer);
  }

  async getWorkflowLogs(userId: string, workflowId: string) {
    const workflow = await this.getWorkflow(userId, workflowId);
    return this.cardsLogRepository.findByWorkflowId(workflow.id);
  }
}
