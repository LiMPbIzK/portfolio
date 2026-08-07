import { getCollection } from 'astro:content';

export const SERIES_INFO: Record<string, { title: string; description: string }> = {
  'web-personal': {
    title: 'Tu web personal con Astro, GitHub Pages y Cloudflare',
    description:
      'Guía paso a paso para construir una web personal estática, desplegarla en GitHub Pages y conectarla a un dominio propio en Cloudflare. Contada desde la experiencia: qué decidimos, qué problemas aparecieron y cómo los resolvimos.',
  },
};

export async function getPublishedTutorials() {
  const entries = await getCollection('tutoriales', ({ data }) => !data.draft);
  return entries.sort((a, b) => a.data.order - b.data.order);
}
