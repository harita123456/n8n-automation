import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Render,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';
import { AuthGuard } from '../../common/guards/auth.guard';
import { GoogleService } from '../google/google.service';
import { TrelloService } from '../trello/trello.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreateWorkflowDto } from '../../common/dto/create-workflow.dto';
import { UsersRepository } from '../../database/repositories/users.repository';
import { BadRequestException } from '@nestjs/common';
import { EncryptionService } from '../../common/services/encryption.service';

@Controller()
export class UIController {
  constructor(
    private readonly googleService: GoogleService,
    private readonly trelloService: TrelloService,
    private readonly workflowsService: WorkflowsService,
    private readonly usersRepository: UsersRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  @Get()
  @Render('homepage')
  root(@Req() req: Request) {
    // Homepage must be visible without login for Google OAuth verification
    // This meets Google's requirement: "Visible to users without requiring them to log-in"
    return {
      user: (req as any).user || null,
    };
  }

  // Health check endpoint for Render and monitoring services
  @Get('health')
  healthCheck(@Res() res: Response) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  // Serve .well-known files (security.txt, etc.)
  @Get('.well-known/security.txt')
  securityTxt(@Res() res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    const publicPath = isProduction
      ? join(__dirname, '../../../public')
      : join(process.cwd(), 'public');
    const securityTxtPath = join(publicPath, '.well-known', 'security.txt');
    return res.sendFile(securityTxtPath);
  }

  // Suppress other .well-known and favicon errors
  @Get('.well-known/*')
  @Get('favicon.ico')
  notFound() {
    return { statusCode: 404, message: 'Not found' };
  }

  @Get('login')
  @Render('login')
  loginPage(@Req() req: Request) {
    return {
      error: req.query.error,
      message: req.query.message,
    };
  }

  @Get('privacy-policy')
  @Render('privacy-policy')
  privacyPolicy(@Req() req: Request) {
    const user = (req as any).user;
    return {
      user: user || null,
      currentPage: null,
    };
  }

  @Get('terms')
  @Render('terms')
  termsOfService(@Req() req: Request) {
    const user = (req as any).user;
    return {
      user: user || null,
      currentPage: null,
    };
  }

  @Get('dashboard')
  @UseGuards(AuthGuard)
  @Render('dashboard')
  async dashboard(@Req() req: Request) {
    const user = (req as any).user;
    // Get full user data with email
    const dbUser = await this.usersRepository.findById(user.id);
    const workflows = await this.workflowsService.getUserWorkflows(user.id);

    return {
      user: {
        ...user,
        email: dbUser?.email || user.email,
      },
      workflows,
    };
  }

  @Get('sheet/select')
  @UseGuards(AuthGuard)
  @Render('sheet-select')
  async sheetSelect(@Req() req: Request) {
    const user = (req as any).user;
    const dbUser = await this.usersRepository.findById(user.id);
    const error = req.query.error as string | undefined;

    return {
      user: {
        ...user,
        email: dbUser?.email || user.email,
      },
      error: error || null,
    };
  }

  @Post('sheet/validate')
  @UseGuards(AuthGuard)
  async validateSheet(
    @Req() req: Request,
    @Res() res: Response,
    @Body('sheetUrl') sheetUrl: string,
  ) {
    const user = (req as any).user;

    if (!sheetUrl || !sheetUrl.trim()) {
      return res.redirect(
        '/sheet/select?error=' +
          encodeURIComponent('Please enter a Google Sheet URL or ID'),
      );
    }

    try {
      const sheetInfo = await this.googleService.validateSheet(
        user.id,
        sheetUrl,
      );

      // Redirect to Trello selection with validated sheet info
      return res.redirect(
        `/trello/select?sheetId=${sheetInfo.id}&sheetName=${encodeURIComponent(sheetInfo.title || 'Untitled Sheet')}`,
      );
    } catch (error: any) {
      const errorMessage =
        error.message ||
        'Failed to access Google Sheet. Please ensure:\n' +
          '1. The sheet URL or ID is correct\n' +
          '2. The sheet is shared with your Google account\n' +
          '3. You have permission to view the sheet';

      return res.redirect(
        '/sheet/select?error=' + encodeURIComponent(errorMessage),
      );
    }
  }

  @Get('trello/select')
  @UseGuards(AuthGuard)
  @Render('trello-select')
  async trelloSelect(@Req() req: Request) {
    const user = (req as any).user;
    const sheetId = req.query.sheetId as string;
    const sheetName = req.query.sheetName as string;

    // Check for error query parameter (from workflow creation validation)
    const errorQuery = req.query.error as string | undefined;

    // Get user's Trello credentials
    const dbUser = await this.usersRepository.findById(user.id);
    if (!dbUser?.trelloApiKey || !dbUser?.trelloToken) {
      return {
        user: {
          ...user,
          email: dbUser?.email || user.email,
        },
        boards: [],
        sheetId,
        sheetName,
        error:
          errorQuery ||
          'Trello credentials not configured. Please configure your Trello account in settings.',
        needsTrelloSetup: true,
      };
    }

    try {
      // Decrypt credentials
      const apiKey = this.encryptionService.decrypt(dbUser.trelloApiKey);
      const token = this.encryptionService.decrypt(dbUser.trelloToken);
      const boards = await this.trelloService.getBoards(apiKey, token);
      return {
        user: {
          ...user,
          email: dbUser?.email || user.email,
        },
        boards,
        sheetId,
        sheetName,
        error: errorQuery || null,
        needsTrelloSetup: false,
      };
    } catch (error: any) {
      return {
        user: {
          ...user,
          email: dbUser?.email || user.email,
        },
        boards: [],
        sheetId,
        sheetName,
        error: errorQuery || error.message,
        needsTrelloSetup: false,
      };
    }
  }

  @Get('trello/boards/:boardId/lists')
  @UseGuards(AuthGuard)
  async getLists(@Req() req: Request, @Param('boardId') boardId: string) {
    const user = (req as any).user;
    const dbUser = await this.usersRepository.findById(user.id);
    if (!dbUser?.trelloApiKey || !dbUser?.trelloToken) {
      throw new BadRequestException('Trello credentials not configured');
    }
    // Decrypt credentials
    const apiKey = this.encryptionService.decrypt(dbUser.trelloApiKey);
    const token = this.encryptionService.decrypt(dbUser.trelloToken);
    return this.trelloService.getLists(boardId, apiKey, token);
  }

  @Get('settings')
  @UseGuards(AuthGuard)
  @Render('settings')
  async settings(@Req() req: Request) {
    const user = (req as any).user;
    const dbUser = await this.usersRepository.findById(user.id);
    // Decrypt credentials for display (if they exist)
    const trelloApiKey = dbUser?.trelloApiKey
      ? this.encryptionService.decrypt(dbUser.trelloApiKey)
      : '';
    const trelloToken = dbUser?.trelloToken
      ? this.encryptionService.decrypt(dbUser.trelloToken)
      : '';
    return {
      user: {
        ...user,
        email: dbUser?.email || user.email,
      },
      trelloApiKey,
      trelloToken,
      error: req.query.error,
      success: req.query.success,
    };
  }

  @Post('settings/trello')
  @UseGuards(AuthGuard)
  async updateTrelloSettings(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
  ) {
    const user = (req as any).user;
    const { trelloApiKey, trelloToken } = body;

    if (!trelloApiKey || !trelloToken) {
      return res.redirect(
        '/settings?error=' +
          encodeURIComponent('Both API Key and Token are required'),
      );
    }

    const trimmedApiKey = trelloApiKey.trim();
    const trimmedToken = trelloToken.trim();

    // Validate credentials by trying to fetch boards
    try {
      await this.trelloService.getBoards(trimmedApiKey, trimmedToken);
    } catch (error: any) {
      return res.redirect(
        '/settings?error=' +
          encodeURIComponent(`Invalid Trello credentials: ${error.message}`),
      );
    }

    // Encrypt credentials before saving
    const encryptedApiKey = this.encryptionService.encrypt(trimmedApiKey);
    const encryptedToken = this.encryptionService.encrypt(trimmedToken);

    // Save encrypted credentials
    await this.usersRepository.update(user.id, {
      trelloApiKey: encryptedApiKey,
      trelloToken: encryptedToken,
    });

    res.redirect('/settings?success=true');
  }

  @Post('workflow/create')
  @UseGuards(AuthGuard)
  async createWorkflow(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
  ) {
    const user = (req as any).user;
    const dbUser = await this.usersRepository.findById(user.id);

    // Validate Trello credentials
    if (!dbUser?.trelloApiKey || !dbUser?.trelloToken) {
      return res.redirect(
        '/trello/select?error=' +
          encodeURIComponent(
            'Trello credentials not configured. Please configure your Trello account in settings.',
          ),
      );
    }

    // Validate Trello board and list IDs
    try {
      const apiKey = this.encryptionService.decrypt(dbUser.trelloApiKey);
      const token = this.encryptionService.decrypt(dbUser.trelloToken);

      // Verify board exists and belongs to user
      const boards = await this.trelloService.getBoards(apiKey, token);
      const boardExists = boards.some(
        (board) => board.id === body.trelloBoardId,
      );
      if (!boardExists) {
        return res.redirect(
          '/trello/select?error=' +
            encodeURIComponent(
              'Invalid Trello board. Please select a valid board.',
            ),
        );
      }

      // Verify list exists and belongs to board
      const lists = await this.trelloService.getLists(
        body.trelloBoardId,
        apiKey,
        token,
      );
      const listExists = lists.some((list) => list.id === body.trelloListId);
      if (!listExists) {
        return res.redirect(
          '/trello/select?error=' +
            encodeURIComponent(
              'Invalid Trello list. Please select a valid list.',
            ),
        );
      }
    } catch (error: any) {
      return res.redirect(
        '/trello/select?error=' +
          encodeURIComponent(
            `Failed to validate Trello board/list: ${error.message}`,
          ),
      );
    }

    const dto: CreateWorkflowDto = {
      name: body.workflowName || body.name || undefined,
      sheetId: body.sheetId || undefined,
      sheetName: body.sheetName || undefined,
      trelloBoardId: body.trelloBoardId,
      trelloListId: body.trelloListId,
      useN8n: body.useN8n === 'true' || body.useN8n === true,
      n8nWebhookUrl: body.n8nWebhookUrl || undefined,
    };
    const workflow = await this.workflowsService.createWorkflow(user.id, dto);
    res.redirect(`/workflow/review/${workflow.id}`);
  }

  @Post('workflow/delete/:id')
  @UseGuards(AuthGuard)
  async deleteWorkflow(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const user = (req as any).user;
    await this.workflowsService.deleteWorkflow(user.id, id);
    res.redirect('/dashboard');
  }

  @Get('workflow/review/:id')
  @UseGuards(AuthGuard)
  @Render('workflow-review')
  async workflowReview(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    const dbUser = await this.usersRepository.findById(user.id);
    const workflow = await this.workflowsService.getWorkflow(user.id, id);

    // Get milestones from session (for file uploads) or fetch from sheet
    let milestones: any[] = [];
    const sessionMilestones = (req.session as any).uploadedMilestones;

    if (sessionMilestones && sessionMilestones.length > 0) {
      milestones = sessionMilestones;
    } else if (workflow.sheetId) {
      try {
        const sheetData = await this.googleService.getSheetData(
          user.id,
          workflow.sheetId,
        );
        const { SheetParserUtil } = await import(
          '../../common/utils/sheet-parser.util'
        );
        milestones = SheetParserUtil.parseGoogleSheetData(sheetData);
      } catch (error) {
        // Silently fail - milestones will just be empty
        console.error('Failed to fetch milestones for review:', error);
      }
    }

    // Fetch Trello board and list names
    let trelloBoardName = workflow.trelloBoardId;
    let trelloListName = workflow.trelloListId;
    if (dbUser?.trelloApiKey && dbUser?.trelloToken) {
      try {
        const apiKey = this.encryptionService.decrypt(dbUser.trelloApiKey);
        const token = this.encryptionService.decrypt(dbUser.trelloToken);

        // Get board name
        const boards = await this.trelloService.getBoards(apiKey, token);
        const board = boards.find((b) => b.id === workflow.trelloBoardId);
        if (board) {
          trelloBoardName = board.name;
        }

        // Get list name
        const lists = await this.trelloService.getLists(
          workflow.trelloBoardId,
          apiKey,
          token,
        );
        const list = lists.find((l) => l.id === workflow.trelloListId);
        if (list) {
          trelloListName = list.name;
        }
      } catch (error: any) {
        // If fetching fails, just use the IDs
        console.error('Failed to fetch Trello board/list names:', error);
      }
    }

    return {
      user: {
        ...user,
        email: dbUser?.email || user.email,
      },
      workflow,
      milestones,
      milestoneCount: milestones.length,
      trelloBoardName,
      trelloListName,
    };
  }

  @Post('workflow/run/:id')
  @UseGuards(AuthGuard)
  async runWorkflow(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const user = (req as any).user;
    try {
      // Get milestones from session if available (for file uploads)
      const sessionMilestones = (req.session as any).uploadedMilestones;
      await this.workflowsService.runWorkflow(
        user.id,
        id,
        undefined,
        sessionMilestones,
      );
      res.redirect(`/workflow/status/${id}?success=true`);
    } catch (error: any) {
      // If it's a duplicate execution error, show a friendly message
      if (error.message?.includes('already running')) {
        res.redirect(
          `/workflow/status/${id}?error=${encodeURIComponent(error.message)}`,
        );
      } else {
        res.redirect(
          `/workflow/status/${id}?error=${encodeURIComponent(error.message)}`,
        );
      }
    }
  }

  @Get('workflow/status/:id')
  @UseGuards(AuthGuard)
  @Render('workflow-status')
  async workflowStatus(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    const dbUser = await this.usersRepository.findById(user.id);
    const workflow = await this.workflowsService.getWorkflow(user.id, id);
    const logs = await this.workflowsService.getWorkflowLogs(user.id, id);
    return {
      user: {
        ...user,
        email: dbUser?.email || user.email,
      },
      workflow,
      logs,
      success: req.query.success === 'true',
      error: req.query.error,
    };
  }

  @Post('sheet/upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit to prevent memory issues
      },
    }),
  )
  async uploadSheet(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        return res
          .status(400)
          .json({ success: false, error: 'No file uploaded' });
      }

      // Additional size check
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds 10MB limit',
        });
      }

      const milestones = await this.workflowsService.parseUploadedFile(file);
      // Store in session or return to frontend for workflow creation
      (req.session as any).uploadedMilestones = milestones;
      (req.session as any).uploadedFileName = file.originalname;
      res.json({ success: true, milestones, count: milestones.length });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
