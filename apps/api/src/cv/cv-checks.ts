import { extractText } from 'unpdf';
import type { CvCheck } from '@devprofile/shared';
import type { CvData } from './cv-data.js';

// The automatable part of the checklist in the CV research report: what a parser
// will read from the PDF, plus the content rules with the most evidence behind them.

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const MAX_SUMMARY_WORDS = 60;
const MAX_BULLET_CHARS = 220;

export async function checkCv(
  pdf: Uint8Array,
  pages: number,
  data: CvData,
): Promise<CvCheck[]> {
  const { text } = await extractText(new Uint8Array(pdf), { mergePages: true });
  const flat = text.replace(/\s+/g, ' ');
  const checks: CvCheck[] = [];
  const add = (check: CvCheck) => checks.push(check);
  const pt = data.lang === 'pt';

  add({
    id: 'pages',
    // One page when it fits; two are fine when the content needs them.
    status: pages <= 2 ? 'pass' : 'fail',
    label: pt ? 'Até duas páginas' : 'Two pages at most',
    detail:
      pages === 1
        ? 'Uma página, com o espaçamento mais confortável que coube.'
        : pages === 2
          ? 'Duas páginas: o conteúdo não coube em uma sem apertar a leitura.'
          : `${pages} páginas. Corte bullets, projetos ou skills marcados para o currículo.`,
  });

  const headings = data.order
    .filter((key) => key !== 'intro' || data.intro !== '')
    .map((key) => data.headings[key]);
  // Each heading must appear after the previous one (searching forward, so a word
  // like "experiência" inside the summary doesn't count as the heading).
  // Headings are printed in capitals, so compare without case.
  const upper = flat.toUpperCase();
  let cursor = flat.indexOf(data.name);
  const inOrder =
    cursor >= 0 &&
    headings.every((heading) => {
      cursor = upper.indexOf(heading.toUpperCase(), cursor + 1);
      return cursor >= 0;
    });
  add({
    id: 'text-layer',
    status: inOrder ? 'pass' : 'fail',
    label: 'Texto legível por sistemas de triagem (ATS), na ordem certa',
    detail: inOrder
      ? null
      : 'O texto extraído do PDF não traz o nome ou as seções na ordem esperada.',
  });

  // Every accented letter in the data must come back out of the PDF as itself.
  const expected = new Set(
    JSON.stringify(data).match(/[^\p{ASCII}–—·•]/gu) ?? [],
  );
  const missing = [...expected].filter((char) => !flat.includes(char));
  const garbled = flat.includes('�') || flat.includes('(cid:');
  add({
    id: 'characters',
    status: missing.length === 0 && !garbled ? 'pass' : 'fail',
    label: 'Acentos e caracteres especiais extraídos corretamente',
    detail:
      missing.length || garbled
        ? `Problemas com: ${missing.join(' ') || 'caracteres ilegíveis'}`
        : null,
  });

  const unprinted = data.contacts.filter(
    (c) => c.url && !flat.includes(c.text),
  );
  add({
    id: 'links',
    status: unprinted.length === 0 ? 'pass' : 'warn',
    label: 'Contatos impressos como texto (além de clicáveis)',
    detail: unprinted.length ? unprinted.map((c) => c.text).join(', ') : null,
  });

  const personal = [
    /\bCPF\b/i,
    /\bRG\b/,
    /\d{3}\.\d{3}\.\d{3}-\d{2}/,
    /data de nascimento|date of birth/i,
    /estado civil|marital status/i,
  ].filter((pattern) => pattern.test(flat));
  add({
    id: 'personal-data',
    status: personal.length === 0 ? 'pass' : 'fail',
    label: 'Sem dados pessoais desnecessários (CPF, RG, idade, estado civil)',
    detail: personal.length
      ? 'Remova esses dados: a LGPD pede só o necessário.'
      : null,
  });

  const summaryWords = words(data.intro);
  add({
    id: 'summary',
    status: summaryWords <= MAX_SUMMARY_WORDS ? 'pass' : 'warn',
    label: pt
      ? 'Resumo curto (até ~50 palavras)'
      : 'Short summary (up to ~50 words)',
    detail:
      summaryWords > MAX_SUMMARY_WORDS ? `${summaryWords} palavras.` : null,
  });

  const bullets = [...data.experience, ...data.projects].flatMap(
    (item) => item.bullets,
  );
  const long = bullets.filter((b) => b.length > MAX_BULLET_CHARS);
  add({
    id: 'bullet-length',
    status: long.length === 0 ? 'pass' : 'warn',
    label: 'Bullets com no máximo duas linhas',
    detail: long.length
      ? long.map((b) => `“${b.slice(0, 60)}…”`).join('; ')
      : null,
  });

  // Years ("2025") don't count as a result metric.
  const withNumbers = bullets.filter((b) =>
    /\d/.test(b.replace(/\b(19|20)\d{2}\b/g, '')),
  ).length;
  add({
    id: 'metrics',
    status: withNumbers * 2 >= bullets.length ? 'pass' : 'warn',
    label:
      'Metade dos bullets ou mais com números (quantidade, tempo, %, usuários…)',
    detail:
      `${withNumbers} de ${bullets.length} trazem números. ` +
      'Métricas mostram resultado: "reduzi o tempo de resposta em 40%", "atendi 30 usuários por dia".',
  });

  return checks;
}
