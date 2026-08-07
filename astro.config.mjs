// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  base: process.env.ASTRO_BASE ?? '',
});
