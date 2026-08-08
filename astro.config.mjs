// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

export default defineConfig({
  site: process.env.SITE_URL ?? env.SITE_URL ?? 'http://localhost:4321',
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
    sitemap(),
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
