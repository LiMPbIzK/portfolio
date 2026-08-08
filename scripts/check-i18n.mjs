// Guarda de paridad i18n: verifica que las colecciones es/ y en/ de tutoriales
// estén sincronizadas (mismos ids, order/part iguales y frontmatter completo).
// Se ejecuta como parte de `npm run check`.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const esDir = join(root, 'src', 'content', 'tutoriales', 'es');
const enDir = join(root, 'src', 'content', 'tutoriales', 'en');

function parseFrontmatter(content) {
  const block = content.match(/^---\n([\s\S]*?)\n---/);
  const data = {};
  if (!block) return data;
  for (const line of block[1].split('\n')) {
    const match = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    data[match[1]] = value;
  }
  return data;
}

function readEntries(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const raw = readFileSync(join(dir, file), 'utf8');
      return {
        file,
        id: file.replace(/\.md$/, ''),
        frontmatter: parseFrontmatter(raw),
        body: raw.replace(/^---[\s\S]*?---\n?/, '').trim(),
      };
    });
}

const es = readEntries(esDir);
const en = readEntries(enDir);
const esMap = new Map(es.map((entry) => [entry.id, entry]));
const enMap = new Map(en.map((entry) => [entry.id, entry]));

const problems = [];

for (const entry of es) {
  if (!enMap.has(entry.id)) {
    problems.push(`Falta el artículo en inglés para "${entry.id}" -> ${join(enDir, entry.file)}`);
  }
}
for (const entry of en) {
  if (!esMap.has(entry.id)) {
    problems.push(`Sobra el artículo en inglés "${entry.id}" (no existe en español) -> ${join(enDir, entry.file)}`);
  }
}

for (const entry of es) {
  const counterpart = enMap.get(entry.id);
  if (!counterpart) continue;

  for (const field of ['order', 'part']) {
    const esValue = Number(entry.frontmatter[field]);
    const enValue = Number(counterpart.frontmatter[field]);
    if (Number.isNaN(esValue) || Number.isNaN(enValue)) {
      problems.push(
        `${entry.id}: ${field} no es un número (es="${entry.frontmatter[field] ?? 'vacío'}", en="${counterpart.frontmatter[field] ?? 'vacío'}")`
      );
    } else if (esValue !== enValue) {
      problems.push(`${entry.id}: ${field} desincronizado (es=${esValue}, en=${enValue})`);
    }
  }

  for (const field of ['title', 'description']) {
    const esValue = (entry.frontmatter[field] ?? '').trim();
    const enValue = (counterpart.frontmatter[field] ?? '').trim();
    if (!esValue) {
      problems.push(`${entry.id}: falta ${field} en español (${join(esDir, entry.file)})`);
    }
    if (!enValue) {
      problems.push(`${entry.id}: falta ${field} en inglés (${join(enDir, entry.file)})`);
    }
  }

  if (!entry.body) {
    problems.push(`${entry.id}: cuerpo vacío en español (${join(esDir, entry.file)})`);
  }
  if (!counterpart.body) {
    problems.push(`${entry.id}: cuerpo vacío en inglés (${join(enDir, entry.file)})`);
  }
}

if (problems.length > 0) {
  console.error('');
  for (const problem of problems) {
    console.error(`  ✖ ${problem}`);
  }
  console.error('');
  console.error(
    `✖ ${problems.length} problema(s) de paridad i18n. Corrige los archivos indicados y vuelve a ejecutar npm run check.`
  );
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = ['## Errores de paridad i18n', ''];
    problems.forEach((problem, index) => lines.push(`${index + 1}. ${problem}`));
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'), { flag: 'a' });
  }
  process.exit(1);
}

console.log(`✓ Paridad i18n correcta (${es.length} artículos por idioma).`);
