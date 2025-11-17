export class DateUtil {
  static parseDate(dateString: string): Date | null {
    if (!dateString) return null;

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
