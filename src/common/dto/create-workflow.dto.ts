import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sheetId?: string;

  @IsString()
  @IsOptional()
  sheetName?: string;

  @IsString()
  trelloBoardId: string;

  @IsString()
  trelloListId: string;

  @IsBoolean()
  @IsOptional()
  useN8n?: boolean;

  @IsString()
  @IsOptional()
  n8nWebhookUrl?: string;
}
