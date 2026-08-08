import { dictionaries, type Locale, type TranslationKey } from './dictionaries';

export type { Locale, TranslationKey };

export function t(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const template = dictionaries[locale]?.[key] ?? dictionaries.es[key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [param, value]) => acc.replaceAll(`{${param}}`, String(value)),
    template
  );
}

export function getLangTag(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'es-ES';
}

export function toLocaleCode(locale: Locale): string {
  return locale === 'en' ? 'en_US' : 'es_ES';
}
