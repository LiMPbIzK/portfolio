// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

const siteUrl = (process.env.SITE_URL ?? env.SITE_URL ?? 'http://localhost:4321').replace(/\/+$/, '');

/**
 * @param {string} filePath
 */
function isDraft(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const block = raw.match(/^---\n([\s\S]*?)\n---/);
  return block ? /\ndraft:\s*true\b/.test(block[1]) : false;
}

function englishTutorialUrls() {
  const dir = './src/content/tutoriales/es';
  try {
    return readdirSync(dir)
      .filter((file) => file.endsWith('.md'))
      .filter((file) => !isDraft(join(dir, file)))
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
        lucide: [
          'download',
          'sun',
          'moon',
          'arrow-up-right',
          'external-link',
          'menu',
          'x',
          'wrench',
          'activity',
          'headset',
          'database-backup',
          'database',
          'git-branch',
          'file-text',
          'kanban',
          'wifi',
        ],
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
