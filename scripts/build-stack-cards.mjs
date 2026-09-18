import { mkdir, writeFile } from 'node:fs/promises';

const version = '16.31.0';
const entries = [
  ['typescript', 'TypeScript', 'LINGUAGEM', 'typescript', 'blue'],
  ['javascript', 'JavaScript', 'LINGUAGEM', 'javascript', 'blue'],
  ['react', 'React', 'INTERFACES', 'react', 'blue'],
  ['tailwindcss', 'Tailwind CSS', 'ESTILIZAÇÃO', 'tailwindcss', 'blue'],
  ['python', 'Python', 'AUTOMAÇÃO', 'python', 'green'],
  ['nodejs', 'Node.js', 'RUNTIME', 'nodedotjs', 'green'],
  ['express', 'Express', 'FRAMEWORK', 'express', 'green'],
  ['dotnet', 'C# / .NET', 'BACK-END', 'dotnet', 'green'],
  ['postgresql', 'PostgreSQL', 'BANCO DE DADOS', 'postgresql', 'blue'],
  ['mysql', 'MySQL', 'BANCO DE DADOS', 'mysql', 'blue'],
  ['sqlite', 'SQLite', 'BANCO DE DADOS', 'sqlite', 'blue'],
  ['git', 'Git', 'VERSIONAMENTO', 'git', 'green'],
  ['pnpm', 'pnpm', 'PACOTES', 'pnpm', 'green'],
  ['playwright', 'Playwright', 'TESTES E2E', null, 'green'],
  ['vite', 'Vite', 'BUILD & DEV', 'vite', 'green'],
  ['docker', 'Docker', 'CONTAINERS', 'docker', 'blue'],
  ['codex', 'Codex', 'ASSISTENTE IA', null, 'blue'],
];
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const custom = {
  playwright: '<g fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5c3 2 6 2 9 0v7c0 4-2 7-4.5 8C5 19 3 16 3 12Z"/><path d="M13 3c3 2 5 2 8 0v8c0 3-1.5 6-4 7"/><path d="M5.5 10h.5m3 0h.5m5-2h.5m3 0h.5M5.5 14c1 1.5 3 1.5 4 0m5-2c1-.5 2-.5 3 0"/></g>',
  codex: '<g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="4"/><path d="m7 9 3 3-3 3m6 0h4"/></g>',
};

await mkdir('assets/stack', { recursive: true });
const icons = await Promise.all(entries.map(async ([id, , , slug]) => {
  if (!slug) return [id, custom[id]];
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@${version}/icons/${slug}.svg`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Icon ${slug}: HTTP ${response.status}`);
  const source = await response.text();
  if (!source.includes('viewBox="0 0 24 24"')) throw new Error(`Unexpected icon geometry: ${slug}`);
  const paths = source.match(/<path\b[^>]*\bd="[^"]+"[^>]*\/>/g);
  if (!paths?.length) throw new Error(`Missing icon path: ${slug}`);
  return [id, `<g fill="currentColor">${paths.join('')}</g>`];
}));
const iconMap = Object.fromEntries(icons);

for (const [id, name, caption, , tone] of entries) {
  const accent = tone === 'blue' ? '#69B6FF' : '#51DCA5';
  const tint = tone === 'blue' ? '#102B44' : '#11362E';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="70" viewBox="0 0 160 70" role="img" aria-labelledby="title">
<title id="title">${escape(name)} — ${escape(caption.toLocaleLowerCase('pt-BR'))}</title>
<defs>
  <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#132031"/><stop offset="1" stop-color="#0B121C"/></linearGradient>
  <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}" stop-opacity=".4"/><stop offset=".65" stop-color="#243347"/><stop offset="1" stop-color="#1B2735"/></linearGradient>
</defs>
<rect x="1.5" y="2.5" width="153" height="62" rx="12" fill="#000" opacity=".12"/>
<rect x="1.5" y="1.5" width="153" height="62" rx="12" fill="url(#surface)" stroke="url(#edge)"/>
<rect x="11" y="12" width="40" height="40" rx="10" fill="${tint}"/>
<g transform="translate(17.5 18.5) scale(1.125)" color="${accent}">${iconMap[id]}</g>
<text x="61" y="30" fill="#EDF4FC" font-family="Segoe UI, Arial, sans-serif" font-size="12.4" font-weight="600">${escape(name)}</text>
<text x="61" y="44" fill="#91A4BA" font-family="Segoe UI, Arial, sans-serif" font-size="7.4" font-weight="500" letter-spacing=".65">${escape(caption)}</text>
<path d="M17 58h18" stroke="${accent}" stroke-opacity=".65" stroke-width="1.5" stroke-linecap="round"/>
</svg>\n`;
  await writeFile(`assets/stack/${id}.svg`, svg, 'utf8');
}
await writeFile('assets/stack/SOURCES.md', `# Stack cards\n\nCard layout and terminal/mask symbols: custom for Guijorper.\n\nTechnology glyphs: [Simple Icons](https://simpleicons.org/), version ${version}, [CC0-1.0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md). Brand names and marks belong to their respective owners. Playwright and Codex use custom symbols, not official brand logos.\n\nCards are self-contained SVGs with no scripts, external fonts or network dependencies when displayed. Regenerate with \`node scripts/build-stack-cards.mjs\`; regeneration downloads the pinned icon version.\n`, 'utf8');
console.log(`Generated ${entries.length} stack cards.`);
