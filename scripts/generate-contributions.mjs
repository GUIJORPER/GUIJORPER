import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const COLORS = ['#16304D', '#24649A', '#58A6FF', '#3DDC97'];
const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const shade = (hex, factor) => '#' + hex.slice(1).match(/../g).map((value) => Math.round(parseInt(value, 16) * factor).toString(16).padStart(2, '0')).join('');
const fmt = (value) => value.toLocaleString('pt-BR');

export function validateCalendar(calendar) {
  if (!calendar || !Number.isInteger(calendar.totalContributions) || calendar.totalContributions < 0 || !Array.isArray(calendar.weeks) || calendar.weeks.length < 1 || calendar.weeks.length > 54) {
    throw new Error('Calendário ausente ou inválido; a imagem anterior será preservada.');
  }
  const dates = new Set();
  const days = calendar.weeks.flatMap((week, weekIndex) => {
    if (!Array.isArray(week.contributionDays) || week.contributionDays.length < 1 || week.contributionDays.length > 7) throw new Error('Semana inválida.');
    return week.contributionDays.map((day) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isInteger(day.contributionCount) || day.contributionCount < 0 || !Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6 || dates.has(day.date)) throw new Error('Dia inválido ou duplicado.');
      const parsed = new Date(day.date + 'T00:00:00Z');
      if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== day.date || parsed.getUTCDay() !== day.weekday) throw new Error('Data inconsistente.');
      dates.add(day.date);
      return { date: day.date, count: day.contributionCount, weekday: day.weekday, week: weekIndex };
    });
  });
  if (days.reduce((total, day) => total + day.count, 0) !== calendar.totalContributions) throw new Error('A soma diária não corresponde ao total do GitHub.');
  return days;
}

export function renderCalendar(calendar, username, generatedAt = new Date()) {
  const days = validateCalendar(calendar);
  const total = calendar.totalContributions;
  const active = days.filter((day) => day.count > 0).length;
  const peak = Math.max(...days.map((day) => day.count));
  const start = days[0].date;
  const end = days.at(-1).date;
  const labelDate = (value) => value.split('-').reverse().join('/');
  const timestamp = generatedAt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const project = (week, weekday) => ({ x: 86 + week * 17 + weekday * 13, y: 400 - week * 1.4 + weekday * 9 });
  const points = (list) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const cells = [...days].sort((a, b) => project(a.week, a.weekday).y - project(b.week, b.weekday).y).map((day) => {
    const { x, y } = project(day.week, day.weekday);
    const ratio = peak ? day.count / peak : 0;
    const height = day.count ? 5 + Math.sqrt(ratio) * 78 : 1;
    const color = day.count ? COLORS[Math.min(3, Math.floor(ratio * 4))] : '#111B27';
    const a = [x, y - height], b = [x + 14.5, y - 1.88 - height], c = [x + 25.3, y + 5.6 - height], d = [x + 10.8, y + 7.48 - height];
    return `<g><title>${labelDate(day.date)}: ${fmt(day.count)} contribuições</title><polygon points="${points([d, c, [c[0], c[1] + height], [d[0], d[1] + height]])}" fill="${shade(color, 0.64)}"/><polygon points="${points([b, c, [c[0], c[1] + height], [b[0], b[1] + height]])}" fill="${shade(color, 0.8)}"/><polygon points="${points([a, b, c, d])}" fill="${color}" stroke="#203147" stroke-width="0.45"/></g>`;
  }).join('\n');
  const monthLabels = [];
  let lastMonth;
  for (const day of days) {
    const month = day.date.slice(0, 7);
    if (month !== lastMonth) {
      const { x, y } = project(day.week, 0);
      if (day.week < calendar.weeks.length - 2) monthLabels.push(`<text x="${x}" y="${y - 100}" fill="#93A4B8" font-size="11">${months[Number(day.date.slice(5, 7)) - 1]}</text>`);
      lastMonth = month;
    }
  }
  const title = `${username}: ${fmt(total)} contribuições entre ${labelDate(start)} e ${labelDate(end)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="526" viewBox="0 0 1120 526" role="img" aria-labelledby="title description">
<title id="title">${escapeXml(title)}</title>
<desc id="description">Calendário 3D de contribuições. ${fmt(active)} dias com atividade; maior contagem diária: ${fmt(peak)}. A altura e a cor de cada coluna representam contribuições reais retornadas pelo GitHub. Nenhum nome de repositório é consultado ou exibido.</desc>
<rect x="1" y="1" width="1118" height="524" rx="18" fill="#090E14" stroke="#16304D"/>
<g font-family="Segoe UI, Arial, sans-serif">
<path d="M36 38h26" stroke="#3DDC97" stroke-width="3"/>
<text x="75" y="43" fill="#93A4B8" font-size="12" letter-spacing="2">GUIJORPER / ACTIVITY SIGNAL</text>
<text x="36" y="83" fill="#CFD9E5" font-size="29" font-weight="700" letter-spacing="1">CONTRIBUTION FLOW</text>
<text x="36" y="106" fill="#93A4B8" font-size="12">${labelDate(start)} — ${labelDate(end)} · Dados visíveis no GitHub</text>
<text x="1065" y="72" text-anchor="end" font-family="Consolas, monospace" font-size="33" font-weight="700" fill="#58A6FF">G&gt;<tspan fill="#3DDC97">_</tspan></text>
<path d="M36 128h1048" stroke="#16304D"/>
<text x="36" y="171" fill="#58A6FF" font-size="31" font-weight="700">${fmt(total)}</text>
<text x="36" y="193" fill="#93A4B8" font-size="12">CONTRIBUIÇÕES VISÍVEIS NO PERÍODO</text>
<text x="342" y="171" fill="#CFD9E5" font-size="31" font-weight="700">${fmt(active)}</text>
<text x="342" y="193" fill="#93A4B8" font-size="12">DIAS COM ATIVIDADE</text>
<text x="651" y="171" fill="#3DDC97" font-size="31" font-weight="700">${fmt(peak)}</text>
<text x="651" y="193" fill="#93A4B8" font-size="12">MAIOR CONTAGEM DIÁRIA</text>
${monthLabels.join('\n')}
${cells}
${peak === 0 ? '<text x="560" y="447" text-anchor="middle" fill="#93A4B8" font-size="13">Nenhuma contribuição disponível para esta consulta.</text>' : ''}
<path d="M36 468h1048" stroke="#16304D"/>
<text x="36" y="499" fill="#93A4B8" font-size="12">Atualizado em ${escapeXml(timestamp)} · Apenas datas e contagens</text>
<text x="847" y="499" fill="#93A4B8" font-size="11">MENOS</text>
${['#111B27', ...COLORS].map((color, index) => `<rect x="${893 + index * 23}" y="486" width="16" height="16" rx="3" fill="${color}" stroke="#203147"/>`).join('')}
<text x="1018" y="499" fill="#93A4B8" font-size="11">MAIS</text>
</g></svg>\n`;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_PROFILE || 'GUIJORPER';
  if (!token) throw new Error('GITHUB_TOKEN não configurado.');
  if (!/^[A-Za-z0-9-]{1,39}$/.test(username)) throw new Error('Usuário inválido.');
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'Guijorper-Contribution-Flow' },
    body: JSON.stringify({
      query: 'query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { contributionCount date weekday } } } } } }',
      variables: { login: username },
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`GitHub retornou HTTP ${response.status}.`);
  const data = await response.json();
  if (data.errors?.length || !data.data?.user) throw new Error('O GitHub não disponibilizou o calendário.');
  const calendar = data.data.user.contributionsCollection.contributionCalendar;
  const svg = renderCalendar(calendar, username);
  await mkdir('assets', { recursive: true });
  await writeFile('assets/contribution-flow.svg', svg, 'utf8');
  console.log(`Calendário gerado: ${calendar.totalContributions} contribuições. Nenhum repositório consultado.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
