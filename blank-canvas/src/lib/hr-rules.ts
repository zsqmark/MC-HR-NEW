export function brisbaneDate(at: Date): string {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(at);
  const value = (key: string) => parts.find((part) => part.type === key)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function brisbaneDay(at: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane', weekday: 'short',
  }).format(at).toUpperCase();
}

export function validWeekStart(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.getUTCDay() === 1 &&
    date.toISOString().slice(0, 10) === value;
}

export function canPerformJob(staffType: unknown, requiredRole: unknown): boolean {
  if (!requiredRole || requiredRole === 'all') return true;
  if (requiredRole === 'wait_staff') return staffType === 'wait_staff' || staffType === 'bar_staff';
  if (requiredRole === 'bar_staff') return staffType === 'bar_staff';
  return false;
}

export function hoursWorked(start: Date, end: Date, breakMinutes: number): number {
  const roundedMinutes = Math.round((end.getTime() - start.getTime()) / 900000) * 15;
  return Math.round(Math.max(0, roundedMinutes - Math.max(0, breakMinutes)) / 60 * 100) / 100;
}
