import { Injectable, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';
import { UsersRepository } from '../../database/repositories/users.repository';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private async getOAuth2Client(userId: string): Promise<OAuth2Client> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.googleAccessToken) {
      throw new UnauthorizedException('Google access token not found');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL,
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Refresh token if needed
    try {
      await oauth2Client.getAccessToken();
    } catch (error) {
      // Token might be expired, try to refresh
      if (user.googleRefreshToken) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        await this.usersRepository.updateTokens(
          userId,
          credentials.access_token!,
          credentials.refresh_token || user.googleRefreshToken,
        );
        oauth2Client.setCredentials(credentials);
      } else {
        throw new UnauthorizedException('Unable to refresh Google token');
      }
    }

    return oauth2Client;
  }

  async listSheets(userId: string) {
    const auth = await this.getOAuth2Client(userId);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50,
    });

    return response.data.files || [];
  }

  async getSheetData(
    userId: string,
    sheetId: string,
    maxRows: number = 1000,
  ): Promise<any[][]> {
    const auth = await this.getOAuth2Client(userId);
    const sheets = google.sheets({ version: 'v4', auth });

    // Limit range to prevent excessive memory usage
    // Fetch only what's needed (A-Z columns, up to maxRows)
    const range = `A1:Z${Math.min(maxRows, 1000)}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return response.data.values || [];
  }

  async getSheetInfo(userId: string, sheetId: string) {
    const auth = await this.getOAuth2Client(userId);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    return {
      id: response.data.spreadsheetId,
      title: response.data.properties?.title,
    };
  }
}
