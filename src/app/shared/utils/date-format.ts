export type DateInput = string | number | Date | null | undefined;

// Arabic month names with Latin digits: "1 أكتوبر 2026".
const dateFmt = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
const clockFmt = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { hour: 'numeric', minute: '2-digit' });

/** Parses a date; a bare "YYYY-MM-DD" is read as a local day, not UTC midnight. */
export function toDate(value: DateInput): Date | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** "1 أكتوبر 2026" — '-' when empty or invalid. */
export function formatArDate(value: DateInput): string {
  const d = toDate(value);
  return d ? dateFmt.format(d) : '-';
}

/** "3:45 م" */
export function formatClock(value: DateInput): string {
  const d = toDate(value);
  return d ? clockFmt.format(d) : '';
}

/** Full tooltip text: "1 أكتوبر 2026 - 3:45 م" */
export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  return d ? `${dateFmt.format(d)} - ${clockFmt.format(d)}` : '';
}

/** Arabic count: 1 → singular, 2 → dual, 3–10 → n + plural, 11+ → n + singular. */
function count(n: number, one: string, two: string, plural: string): string {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n <= 10) return `${n} ${plural}`;
  return `${n} ${one}`;
}

const minutes = (n: number) => count(n, 'دقيقة', 'دقيقتين', 'دقايق');
const hours = (n: number) => count(n, 'ساعة', 'ساعتين', 'ساعات');
const days = (n: number) => count(n, 'يوم', 'يومين', 'أيام');

/**
 * Relative time using the two largest units: "منذ ساعة و7 دقايق".
 * 30 days or older (or a future date) falls back to the plain date.
 */
export function formatTimeAgo(value: DateInput, now: Date = new Date()): string {
  const d = toDate(value);
  if (!d) return '-';
  const totalMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (totalMin < -1) return formatArDate(d);
  if (totalMin < 1) return 'الآن';

  const day = Math.floor(totalMin / 1440);
  const hour = Math.floor((totalMin % 1440) / 60);
  const min = totalMin % 60;

  if (day >= 30) return formatArDate(d);
  if (day > 0) return `منذ ${days(day)}${hour ? ' و' + hours(hour) : ''}`;
  if (hour > 0) return `منذ ${hours(hour)}${min ? ' و' + minutes(min) : ''}`;
  return `منذ ${minutes(min)}`;
}
