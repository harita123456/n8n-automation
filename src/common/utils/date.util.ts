export class DateUtil {
  static parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Try various date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];

    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  }

  static formatDateForTrello(date: Date): string {
    return date.toISOString();
  }
}
