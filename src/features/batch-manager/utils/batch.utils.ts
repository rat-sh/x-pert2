export function generateJoinCode(name?: string): string {
  if (name) {
    const prefix = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${rand}`;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function getDatesForDays(startDate: string, endDate: string, days: number[]): string[] {
  if (!startDate || !endDate || days.length === 0) return [];
  const dates: string[] = [];
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    if (days.includes(cur.getDay())) {
      dates.push(cur.toISOString().slice(0, 10));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}
