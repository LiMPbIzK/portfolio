export const prerender = true;

export function GET() {
  const site = (import.meta.env.SITE_URL ?? 'http://localhost:4321').replace(/\/+$/, '');
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
