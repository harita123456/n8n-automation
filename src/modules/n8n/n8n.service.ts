import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { MilestoneRow } from '../../common/dto/milestone-row.dto';

@Injectable()
export class N8nService {
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      timeout: 30000,
    });
  }

  async sendToWebhook(
    webhookUrl: string,
    data: {
      milestones: MilestoneRow[];
      trelloBoardId: string;
      trelloListId: string;
      sheetName?: string;
    },
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.post(webhookUrl, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to send data to n8n webhook: ${error.message}`,
      );
    }
  }
}
