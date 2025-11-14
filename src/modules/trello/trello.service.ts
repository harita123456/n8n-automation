import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { MilestoneRow } from '../../common/dto/milestone-row.dto';
import { DateUtil } from '../../common/utils/date.util';

export interface TrelloBoard {
  id: string;
  name: string;
}

export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due?: string;
  idList: string;
}

@Injectable()
export class TrelloService {
  private readonly baseUrl = 'https://api.trello.com/1';
  private readonly memberMap?: Record<string, string>;
  private readonly labelMap?: Record<string, string>;
  // runtime caches by board
  private boardMembersCache: Map<
    string,
    Array<{ id: string; fullName: string; username: string }>
  > = new Map();
  private boardLabelsCache: Map<
    string,
    Array<{ id: string; name: string; color?: string }>
  > = new Map();

  // Trello's available label colors
  private readonly trelloColors = [
    'green',
    'yellow',
    'orange',
    'red',
    'purple',
    'blue',
    'sky',
    'lime',
    'pink',
    'black',
  ];

  constructor(private readonly configService: ConfigService) {
    // Optional JSON map from .env (e.g. {"Harita":"6164...","Jignesh":"6560..."} )
    try {
      const membersJson = this.configService.get<string>('TRELLO_MEMBER_MAP');
      const labelsJson = this.configService.get<string>('TRELLO_LABEL_MAP');
      this.memberMap = membersJson ? JSON.parse(membersJson) : undefined;
      this.labelMap = labelsJson ? JSON.parse(labelsJson) : undefined;
    } catch {
      // ignore malformed JSON
    }
  }

  /**
   * Create an axios instance with user-specific Trello credentials
   */
  private createAxiosInstance(apiKey: string, token: string): AxiosInstance {
    if (!apiKey || !token) {
      throw new BadRequestException(
        'Trello API credentials are required. Please configure your Trello account in settings.',
      );
    }
    return axios.create({
      baseURL: this.baseUrl,
      params: {
        key: apiKey,
        token: token,
      },
    });
  }

  private normalizeName(name: string | undefined | null): string {
    return String(name || '')
      .trim()
      .toLowerCase();
  }

  private async ensureBoardMembers(
    boardId: string,
    apiKey: string,
    token: string,
  ) {
    const cacheKey = `${boardId}-${apiKey}`;
    if (this.boardMembersCache.has(cacheKey)) return;
    const axiosInstance = this.createAxiosInstance(apiKey, token);
    const { data } = await axiosInstance.get(`/boards/${boardId}/members`, {
      params: { fields: 'id,fullName,username' },
    });
    this.boardMembersCache.set(
      cacheKey,
      (data || []).map((m: any) => ({
        id: m.id,
        fullName: m.fullName,
        username: m.username,
      })),
    );
  }

  private async ensureBoardLabels(
    boardId: string,
    apiKey: string,
    token: string,
  ) {
    const cacheKey = `${boardId}-${apiKey}`;
    if (this.boardLabelsCache.has(cacheKey)) return;
    const axiosInstance = this.createAxiosInstance(apiKey, token);
    const { data } = await axiosInstance.get(`/boards/${boardId}/labels`, {
      params: { fields: 'id,name,color', limit: 1000 },
    });
    this.boardLabelsCache.set(
      cacheKey,
      (data || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        color: l.color,
      })),
    );
  }

  private async resolveMemberIds(
    boardId: string,
    membersCsv: string | undefined,
    apiKey: string,
    token: string,
  ): Promise<string[]> {
    if (!membersCsv) return [];
    const names = String(membersCsv)
      .split(',')
      .map((n) => this.normalizeName(n))
      .filter(Boolean);

    // 1) prefer .env mapping if provided
    const idsFromEnv =
      this.memberMap &&
      names
        .map((n) => {
          const entry = Object.entries(this.memberMap!).find(
            ([k]) => this.normalizeName(k) === n,
          );
          return entry ? entry[1] : undefined;
        })
        .filter(Boolean);
    if (idsFromEnv && idsFromEnv.length) return idsFromEnv as string[];

    // 2) fallback to board members lookup by name or username
    const cacheKey = `${boardId}-${apiKey}`;
    await this.ensureBoardMembers(boardId, apiKey, token);
    const boardMembers = this.boardMembersCache.get(cacheKey) || [];
    const ids = names
      .map((n) => {
        const found =
          boardMembers.find((m) => this.normalizeName(m.fullName) === n) ||
          boardMembers.find((m) => this.normalizeName(m.username) === n);
        return found?.id;
      })
      .filter(Boolean) as string[];
    return ids;
  }

  /**
   * Get a random color from Trello's available colors
   */
  private getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * this.trelloColors.length);
    return this.trelloColors[randomIndex];
  }

  /**
   * Get a color that's not already used by existing labels on the board
   * Falls back to random if all colors are used
   */
  private getAvailableColor(
    boardLabels: Array<{ id: string; name: string; color?: string }>,
  ): string {
    const usedColors = new Set(
      boardLabels.map((l) => l.color).filter((c): c is string => Boolean(c)),
    );

    // Find an unused color
    const availableColors = this.trelloColors.filter((c) => !usedColors.has(c));

    if (availableColors.length > 0) {
      // Pick a random color from available ones
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      return availableColors[randomIndex];
    }

    // All colors are used, pick a random one anyway
    return this.getRandomColor();
  }

  /**
   * Create a label in a Trello board if it doesn't exist
   * Trello API requires both name and color
   */
  private async createLabelIfNotExists(
    boardId: string,
    labelName: string,
    apiKey: string,
    token: string,
    boardLabels: Array<{ id: string; name: string; color?: string }> = [],
  ): Promise<string> {
    const axiosInstance = this.createAxiosInstance(apiKey, token);
    const cacheKey = `${boardId}-${apiKey}`;

    try {
      // Pick a color that's not already used (or random if all are used)
      const color = this.getAvailableColor(boardLabels);

      // Trello API requires both name and color
      const response = await axiosInstance.post(`/boards/${boardId}/labels`, {
        name: labelName.trim(),
        color: color,
      });

      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from Trello API');
      }

      const newLabel = {
        id: response.data.id,
        name: response.data.name || labelName.trim(),
        color: response.data.color || color,
      };

      // Update cache with the new label
      const existingLabels = this.boardLabelsCache.get(cacheKey) || [];
      this.boardLabelsCache.set(cacheKey, [...existingLabels, newLabel]);

      // eslint-disable-next-line no-console
      console.log(
        `[Trello] Successfully created label "${labelName}" (ID: ${newLabel.id}, color: ${newLabel.color}) on board ${boardId}`,
      );

      return newLabel.id;
    } catch (error: any) {
      // If label creation fails, log detailed error
      const errorDetails =
        error.response?.data || error.response || error.message;
      console.error(
        `[Trello] Failed to create label "${labelName}" on board ${boardId}:`,
        JSON.stringify(errorDetails, null, 2),
      );
      throw error;
    }
  }

  /**
   * Attach labels to a card after creation (more reliable than during creation)
   * Trello API requires value as a query parameter, not in the body
   */
  private async attachLabelsToCard(
    cardId: string,
    labelIds: string[],
    apiKey: string,
    token: string,
  ): Promise<void> {
    if (!labelIds || labelIds.length === 0) return;

    const axiosInstance = this.createAxiosInstance(apiKey, token);

    // Attach each label individually using POST with value as query parameter
    for (const labelId of labelIds) {
      try {
        // Trello API requires 'value' as a query parameter, not in the body
        await axiosInstance.post(`/cards/${cardId}/idLabels`, null, {
          params: {
            value: labelId,
          },
        });
        // eslint-disable-next-line no-console
        console.log(`[Trello] Attached label ${labelId} to card ${cardId}`);
      } catch (error: any) {
        const errorDetails =
          error.response?.data || error.response || error.message;
        console.warn(
          `[Trello] Failed to attach label ${labelId} to card ${cardId}:`,
          JSON.stringify(errorDetails, null, 2),
        );
        // Continue with other labels even if one fails
      }
    }
  }

  private async resolveLabelIds(
    boardId: string,
    labelsCsv: string | undefined,
    apiKey: string,
    token: string,
  ): Promise<string[]> {
    if (!labelsCsv) {
      // eslint-disable-next-line no-console
      console.log('[Trello] No labels provided in milestone');
      return [];
    }

    const names = String(labelsCsv)
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[Trello] No valid label names after parsing');
      return [];
    }

    // eslint-disable-next-line no-console
    console.log(
      `[Trello] Resolving labels on board ${boardId}: ${names.join(', ')}`,
    );

    // Always check the board first - label IDs are board-specific
    // Never use env mapping directly as label IDs are board-specific
    const cacheKey = `${boardId}-${apiKey}`;
    await this.ensureBoardLabels(boardId, apiKey, token);
    const boardLabels = this.boardLabelsCache.get(cacheKey) || [];

    const resolvedIds: string[] = [];

    for (const name of names) {
      // First, try to find existing label on this board
      const found = boardLabels.find(
        (l) => this.normalizeName(l.name) === this.normalizeName(name),
      );

      if (found) {
        // eslint-disable-next-line no-console
        console.log(
          `[Trello] Found existing label "${name}" (ID: ${found.id}) on board ${boardId}`,
        );
        resolvedIds.push(found.id);
      } else {
        // Label doesn't exist on this board, create it
        try {
          // eslint-disable-next-line no-console
          console.log(
            `[Trello] Label "${name}" not found on board ${boardId}, creating it...`,
          );
          const newLabelId = await this.createLabelIfNotExists(
            boardId,
            name,
            apiKey,
            token,
            boardLabels, // Pass existing labels to avoid color conflicts
          );
          resolvedIds.push(newLabelId);

          // Refresh board labels cache to get the actual color assigned
          await this.ensureBoardLabels(boardId, apiKey, token);
          const updatedBoardLabels = this.boardLabelsCache.get(cacheKey) || [];
          const createdLabel = updatedBoardLabels.find(
            (l) => l.id === newLabelId,
          );
          if (createdLabel) {
            // Update local boardLabels array for next iterations
            boardLabels.push(createdLabel);
          }

          // eslint-disable-next-line no-console
          console.log(
            `[Trello] Successfully created and resolved label "${name}" (ID: ${newLabelId})`,
          );
        } catch (error: any) {
          // Log warning but continue with other labels
          console.warn(
            `[Trello] Could not create label "${name}" on board ${boardId}:`,
            error.response?.data || error.message,
          );
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `[Trello] Resolved ${resolvedIds.length}/${names.length} label IDs for board ${boardId}: ${resolvedIds.join(', ')}`,
    );
    return resolvedIds;
  }

  async getBoards(apiKey: string, token: string): Promise<TrelloBoard[]> {
    try {
      const axiosInstance = this.createAxiosInstance(apiKey, token);
      const response = await axiosInstance.get('/members/me/boards', {
        params: {
          filter: 'open',
        },
      });
      return response.data.map((board: any) => ({
        id: board.id,
        name: board.name,
      }));
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch Trello boards: ${error.message}`,
      );
    }
  }

  async getLists(
    boardId: string,
    apiKey: string,
    token: string,
  ): Promise<TrelloList[]> {
    try {
      const axiosInstance = this.createAxiosInstance(apiKey, token);
      const response = await axiosInstance.get(`/boards/${boardId}/lists`, {
        params: {
          filter: 'open',
        },
      });
      return response.data.map((list: any) => ({
        id: list.id,
        name: list.name,
        idBoard: list.idBoard,
      }));
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch Trello lists: ${error.message}`,
      );
    }
  }

  async createCard(
    listId: string,
    milestone: MilestoneRow,
    apiKey: string,
    token: string,
    boardId?: string,
  ): Promise<TrelloCard> {
    try {
      const axiosInstance = this.createAxiosInstance(apiKey, token);
      const desc = this.formatDescription(milestone);
      const due = milestone.dueDate
        ? DateUtil.parseDate(milestone.dueDate)
        : null;

      const cardData: any = {
        name: milestone.title,
        desc: desc,
        idList: listId,
      };

      let labelIds: string[] = [];

      // Resolve members/labels by .env mapping or by board lookup
      if (boardId) {
        const memberIds = await this.resolveMemberIds(
          boardId,
          milestone.members,
          apiKey,
          token,
        );
        if (memberIds.length) cardData.idMembers = memberIds.join(',');

        // Resolve labels (will create if they don't exist)
        labelIds = await this.resolveLabelIds(
          boardId,
          milestone.labels,
          apiKey,
          token,
        );

        if (!memberIds.length && milestone.members) {
          // eslint-disable-next-line no-console
          console.warn(
            `[Trello] No matching members found for "${milestone.members}" on board ${boardId}`,
          );
        }
      } else {
        // fallback to env-mapping only (no board lookup)
        if (this.memberMap && milestone.members) {
          const memberIds = String(milestone.members)
            .split(',')
            .map((m) => this.memberMap![m.trim()])
            .filter(Boolean);
          if (memberIds.length) cardData.idMembers = memberIds.join(',');
        }
        if (this.labelMap && milestone.labels) {
          labelIds = String(milestone.labels)
            .split(',')
            .map((l) => this.labelMap![l.trim()])
            .filter(Boolean);
        }
      }

      if (due) {
        cardData.due = DateUtil.formatDateForTrello(due);
      }

      // Create the card first (without labels)
      const response = await axiosInstance.post('/cards', cardData);
      const card: TrelloCard = {
        id: response.data.id,
        name: response.data.name,
        desc: response.data.desc,
        due: response.data.due,
        idList: response.data.idList,
      };

      // Attach labels AFTER card creation (more reliable)
      if (labelIds.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[Trello] Attaching ${labelIds.length} labels to card "${milestone.title}" (${card.id}): ${labelIds.join(', ')}`,
        );
        await this.attachLabelsToCard(card.id, labelIds, apiKey, token);
      } else if (milestone.labels) {
        // eslint-disable-next-line no-console
        console.warn(
          `[Trello] No label IDs resolved for labels "${milestone.labels}" on card "${milestone.title}"`,
        );
      }

      return card;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to create Trello card: ${error.message}`,
      );
    }
  }

  async createCards(
    listId: string,
    milestones: MilestoneRow[],
    apiKey: string,
    token: string,
    boardId?: string,
  ): Promise<TrelloCard[]> {
    const cards: TrelloCard[] = [];
    for (const milestone of milestones) {
      try {
        const card = await this.createCard(
          listId,
          milestone,
          apiKey,
          token,
          boardId,
        );
        cards.push(card);
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error: any) {
        // Continue with other cards even if one fails
        console.error(`Failed to create card for ${milestone.title}:`, error);
      }
    }
    return cards;
  }

  private formatDescription(milestone: MilestoneRow): string {
    // Build description following the provided template
    const modulesBlock = (milestone.modules || '')
      .split('\n')
      .map((line) => {
        const parts = line.split(':');
        if (parts.length > 1) {
          return `- **${parts[0].trim()}:**${parts.slice(1).join(':')}`;
        } else {
          const t = line.trim();
          return t ? `- ${t}` : '';
        }
      })
      .filter(Boolean)
      .join('\n');

    const totalHours = milestone.totalHours || '';
    const days = milestone.days || '';
    const fe = milestone.frontendHours || '';
    const be = milestone.backendHours || '';
    const admin = milestone.adminHours || '';
    const ui = milestone.uiHours || '';

    const blocks: string[] = [];
    blocks.push(`#### Total Hours: ${totalHours} Hours (${days} Days)`);
    blocks.push(
      `**Frontend Estimation:** ${fe} Hours  \n**Backend Estimation:** ${be} Hours  \n**Admin Estimation:** ${admin} Hours  \n**UI Estimation:** ${ui} Hours`,
    );
    blocks.push(`---`);
    blocks.push(`#### Scope of Work:\n${modulesBlock}`);

    return blocks.join('\n\n');
  }
}
