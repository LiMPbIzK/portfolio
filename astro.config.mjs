// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { readdirSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

const siteUrl = (process.env.SITE_URL ?? env.SITE_URL ?? 'http://localhost:4321').replace(/\/+$/, '');

function englishTutorialUrls() {
  const dir = './src/content/tutoriales/es';
  try {
    return readdirSync(dir)
      .filter((file) => file.endsWith('.md'))
      .map((file) => `${siteUrl}/en/tutoriales/${file.replace(/\.md$/, '')}/`);
  } catch {
    return [];
  }
}

export default defineConfig({
  site: siteUrl,
  base: process.env.ASTRO_BASE ?? env.ASTRO_BASE ?? '',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    fallback: { en: 'es' },
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es-ES',
          en: 'en-US',
        },
      },
      customPages: englishTutorialUrls(),
    }),
    icon({
      include: {
        'simple-icons': [
          'github',
          'linkedin',
          'gmail',
          'python',
          'html5',
          'css3',
          'javascript',
          'git',
          'jira',
          'linux',
          'windows',
          'apple',
          'delphi',
          'fastapi',
        ],
        lucide: ['download', 'sun', 'moon', 'arrow-up-right', 'external-link', 'menu', 'x'],
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'light',
    },
  },
});
