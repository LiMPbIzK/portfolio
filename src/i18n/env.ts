import type { Locale } from './utils';

type ProfileField = 'ROLE' | 'BIO' | 'OBJECTIVE';

export function profileText(locale: Locale, field: ProfileField): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const base = env[`SITE_${field}`];
  const english = env[`SITE_${field}_EN`];
  return locale === 'en' ? (english ?? base ?? '') : (base ?? '');
}
