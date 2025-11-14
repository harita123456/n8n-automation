import * as XLSX from 'xlsx';
import { MilestoneRow } from '../dto/milestone-row.dto';

export class SheetParserUtil {
  static parseExcel(buffer: Buffer): MilestoneRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    return data
      .map((row: any) => {
        const title =
          row.Milestone ||
          row['Milestone '] ||
          row.Title ||
          row.title ||
          row['Milestone Title'] ||
          '';

        return {
          title: String(title || '').trim(),
          milestoneName: row.Milestone || row['Milestone '],
          description:
            row.Description ||
            row.description ||
            row['Milestone Description'] ||
            '',
          modules: row.Modules || row['Scope of Work'] || row['Modules '],
          totalHours: row['Total Hours'] || row['Total'] || row['Total Hours '],
          uiHours: row['UI Hours'] || row['UI'] || row['UI Hours '],
          backendHours:
            row['Backend Hours'] || row['Backend'] || row['Backend Hours '],
          frontendHours:
            row['Frontend Hours'] || row['Frontend'] || row['Frontend Hours '],
          adminHours: row['Admin Hours'] || row['Admin'] || row['Admin Hours '],
          days: row['Days'] || row['Days '],
          members: row['Members'] || row['Members '],
          labels: row['Labels'] || row['Labels '],
          dueDate: row['Due Date'] || row.dueDate || row['DueDate'] || '',
          owner: row.Owner || row.owner || row['Assigned To'] || '',
          priority: row.Priority || row.priority || '',
          status: row.Status || row.status || '',
        } as MilestoneRow;
      })
      .filter((row: MilestoneRow) => row.title && row.title.trim() !== '');
  }

  static parseGoogleSheetData(values: any[][]): MilestoneRow[] {
    if (!values || values.length < 2) return [];

    const headers = values[0].map((h: string) =>
      (h || '').toLowerCase().trim(),
    );
    const rows: MilestoneRow[] = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row || row.length === 0) continue;

      const titleIndex = headers.findIndex((h) =>
        ['title', 'milestone', 'milestone title', 'name'].includes(h),
      );
      const descIndex = headers.findIndex((h) =>
        ['description', 'milestone description', 'desc', 'details'].includes(h),
      );
      const modulesIndex = headers.findIndex((h) =>
        ['modules', 'scope of work', 'scope'].includes(h),
      );
      const totalIndex = headers.findIndex((h) =>
        ['total hours', 'total'].includes(h),
      );
      const uiIndex = headers.findIndex((h) => ['ui hours', 'ui'].includes(h));
      const beIndex = headers.findIndex((h) =>
        ['backend hours', 'backend'].includes(h),
      );
      const feIndex = headers.findIndex((h) =>
        ['frontend hours', 'frontend'].includes(h),
      );
      const adminIndex = headers.findIndex((h) =>
        ['admin hours', 'admin'].includes(h),
      );
      const membersIndex = headers.findIndex((h) => ['members'].includes(h));
      const labelsIndex = headers.findIndex((h) => ['labels'].includes(h));
      const dueDateIndex = headers.findIndex((h) =>
        ['due date', 'duedate', 'deadline'].includes(h),
      );
      const ownerIndex = headers.findIndex((h) =>
        ['owner', 'assigned to', 'assignee', 'assigned'].includes(h),
      );
      const priorityIndex = headers.findIndex((h) =>
        ['priority', 'pri'].includes(h),
      );
      const statusIndex = headers.findIndex((h) =>
        ['status', 'state'].includes(h),
      );

      const title = titleIndex >= 0 ? row[titleIndex] : '';
      if (!title || title.trim() === '') continue;

      rows.push({
        title: String(title || '').trim(),
        milestoneName: String(title || '').trim(),
        description: descIndex >= 0 ? String(row[descIndex] || '') : '',
        modules: modulesIndex >= 0 ? String(row[modulesIndex] || '') : '',
        totalHours: totalIndex >= 0 ? row[totalIndex] : undefined,
        uiHours: uiIndex >= 0 ? row[uiIndex] : undefined,
        backendHours: beIndex >= 0 ? row[beIndex] : undefined,
        frontendHours: feIndex >= 0 ? row[feIndex] : undefined,
        adminHours: adminIndex >= 0 ? row[adminIndex] : undefined,
        members: membersIndex >= 0 ? String(row[membersIndex] || '') : '',
        labels: labelsIndex >= 0 ? String(row[labelsIndex] || '') : '',
        dueDate: dueDateIndex >= 0 ? String(row[dueDateIndex] || '') : '',
        owner: ownerIndex >= 0 ? String(row[ownerIndex] || '') : '',
        priority: priorityIndex >= 0 ? String(row[priorityIndex] || '') : '',
        status: statusIndex >= 0 ? String(row[statusIndex] || '') : '',
      });
    }

    return rows;
  }
}
