/**
 * شناسایی سیستم‌عامل کاربر از userAgent
 */
export type Platform = 'win' | 'mac' | 'linux' | null;

export function detectOS(): Platform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win') || ua.includes('windows')) return 'win';
  if (ua.includes('mac') || ua.includes('iphone') || ua.includes('ipad')) return 'mac';
  if (ua.includes('linux') || ua.includes('x11')) return 'linux';
  return null;
}

export const platformLabels: Record<NonNullable<Platform>, string> = {
  win: 'Windows',
  mac: 'macOS',
  linux: 'Linux',
};
