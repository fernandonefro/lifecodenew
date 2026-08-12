import { formatInTimeZone, toDate } from 'date-fns-tz';

export const UTC_TIMEZONE = 'UTC';
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

export function getUtcIsoString(date: Date = new Date()): string {
  return date.toISOString();
}

export function formatToBrazilTime(date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm:ss'): string {
  const d = typeof date === 'string' ? toDate(date) : date;
  return formatInTimeZone(d, BRAZIL_TIMEZONE, formatStr);
}

export function isTimestampOlderThanMinutes(timestampIso: string, minutes: number): boolean {
  const diffMs = new Date().getTime() - new Date(timestampIso).getTime();
  return diffMs > minutes * 60 * 1000;
}
