import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from '../../common/dto/create-workflow.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Request } from 'express';

@Controller('api/workflows')
@UseGuards(AuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateWorkflowDto) {
    const user = (req as any).user;
    return this.workflowsService.createWorkflow(user.id, dto);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const user = (req as any).user;
    return this.workflowsService.getUserWorkflows(user.id);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    return this.workflowsService.getWorkflow(user.id, id);
  }

  @Post(':id/run')
  async run(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    return this.workflowsService.runWorkflow(user.id, id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.workflowsService.parseUploadedFile(file);
  }

  @Get(':id/logs')
  async getLogs(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    return this.workflowsService.getWorkflowLogs(user.id, id);
  }
}
