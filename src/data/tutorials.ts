import { getCollection } from 'astro:content';
import type { Locale } from '../i18n/utils';

export type SeriesInfo = { title: string; description: string; highlights: string[] };

export const SERIES_INFO: Record<string, Record<Locale, SeriesInfo>> = {
  'web-personal': {
    es: {
      title: 'Tu web personal con Astro, GitHub Pages y Cloudflare',
      description:
        'Guía paso a paso para construir una web personal estática, desplegarla en GitHub Pages y conectarla a un dominio propio en Cloudflare. Contada desde la experiencia: qué decidimos, qué problemas aparecieron y cómo los resolvimos.',
      highlights: [
        'astro',
        'css',
        'seo',
        'git',
        'github actions',
        'github pages',
        'cloudflare',
        'gsap',
        'i18n',
        'modo oscuro',
        'view transitions',
      ],
    },
    en: {
      title: 'Your personal website with Astro, GitHub Pages and Cloudflare',
      description:
        'A step-by-step guide to build a static personal website, deploy it to GitHub Pages and connect a custom domain on Cloudflare. Told from experience: what we decided, what problems came up and how we solved them.',
      highlights: [
        'astro',
        'css',
        'seo',
        'git',
        'github actions',
        'github pages',
        'cloudflare',
        'gsap',
        'i18n',
        'dark mode',
        'view transitions',
      ],
    },
  },
  'bot-laliga': {
    es: {
      title: 'Bot de LaLiga con calendario de fútbol',
      description:
        'Un bot serverless en Python que raspa el calendario de LaLiga, envía avisos por Telegram y sincroniza los horarios con Google Calendar, automatizado con GitHub Actions.',
      highlights: [
        'python',
        'scraping',
        'telegram',
        'google calendar',
        'github actions',
        'cron',
        'automatización',
      ],
    },
    en: {
      title: 'LaLiga bot with football calendar',
      description:
        'A serverless Python bot that scrapes the LaLiga calendar, sends alerts via Telegram and syncs the kickoff times with Google Calendar, automated with GitHub Actions.',
      highlights: [
        'python',
        'scraping',
        'telegram',
        'google calendar',
        'github actions',
        'cron',
        'automation',
      ],
    },
  },
};

export function getSeriesInfo(locale: Locale, id: string): SeriesInfo {
  return SERIES_INFO[id]?.[locale] ?? { title: id, description: '', highlights: [] };
}

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
