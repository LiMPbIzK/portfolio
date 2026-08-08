import { getCollection } from 'astro:content';
import type { Locale } from '../i18n/utils';

export const SERIES_INFO: Record<string, Record<Locale, { title: string; description: string }>> = {
  'web-personal': {
    es: {
      title: 'Tu web personal con Astro, GitHub Pages y Cloudflare',
      description:
        'Guía paso a paso para construir una web personal estática, desplegarla en GitHub Pages y conectarla a un dominio propio en Cloudflare. Contada desde la experiencia: qué decidimos, qué problemas aparecieron y cómo los resolvimos.',
    },
    en: {
      title: 'Your personal website with Astro, GitHub Pages and Cloudflare',
      description:
        'A step-by-step guide to build a static personal website, deploy it to GitHub Pages and connect a custom domain on Cloudflare. Told from experience: what we decided, what problems came up and how we solved them.',
    },
  },
};

function localeOf(id: string): Locale {
  return id.startsWith('en/') ? 'en' : 'es';
}

export function normalizeId(id: string): string {
  return id.startsWith('es/') || id.startsWith('en/') ? id.slice(3) : id;
}

export async function getPublishedTutorials(locale: Locale) {
  const entries = await getCollection('tutoriales', ({ data }) => !data.draft);
  return entries
    .filter((entry) => localeOf(entry.id) === locale)
    .sort((a, b) => a.data.order - b.data.order);
}
