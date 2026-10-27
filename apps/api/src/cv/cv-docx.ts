import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from 'docx';
import type { CvData, CvLink, CvSectionKey } from './cv-data.js';

// Word version of the same CV. Gupy says it reads .docx best, so this mirrors the
// PDF with plain paragraphs only: no tables, text boxes, headers or images.

const FONT = 'Calibri';
const SIZE = 21; // half-points: 10.5pt
// A4 is 11906 twips wide; 1.4 cm margins are ~794 twips each.
const MARGIN = 794;
const RIGHT_TAB = 11906 - MARGIN * 2;

const run = (
  text: string,
  opts: { bold?: boolean; italics?: boolean; size?: number } = {},
) =>
  new TextRun({
    text,
    font: FONT,
    size: opts.size ?? SIZE,
    bold: opts.bold,
    italics: opts.italics,
  });

const linkRun = (item: CvLink, size = SIZE) =>
  item.url
    ? new ExternalHyperlink({
        link: item.url,
        children: [
          new TextRun({
            text: item.text,
            font: FONT,
            size,
            style: 'Hyperlink',
          }),
        ],
      })
    : run(item.text, { size });

const heading = (title: string) =>
  new Paragraph({
    spacing: { before: 200, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 2 },
    },
    children: [
      new TextRun({
        text: title,
        font: FONT,
        size: 23,
        bold: true,
        smallCaps: true,
      }),
    ],
  });

/** Title on the left, date pushed to the right margin with a tab stop. */
const headline = (
  children: (TextRun | ExternalHyperlink)[],
  date: string | null,
) =>
  new Paragraph({
    spacing: { before: 80 },
    tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
    children: date ? [...children, run(`\t${date}`)] : children,
  });

const bullet = (text: string) =>
  new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [run(text)],
  });

const plain = (children: (TextRun | ExternalHyperlink)[]) =>
  new Paragraph({ children });

function sectionParagraphs(key: CvSectionKey, data: CvData): Paragraph[] {
  const title = data.headings[key];
  switch (key) {
    case 'intro':
      return data.intro ? [heading(title), plain([run(data.intro)])] : [];
    case 'skills':
      return data.skills.length
        ? [
            heading(title),
            ...data.skills.map((s) =>
              plain([run(`${s.label}: `, { bold: true }), run(s.items)]),
            ),
          ]
        : [];
    case 'experience':
      return data.experience.length
        ? [
            heading(title),
            ...data.experience.flatMap((job) => [
              headline(
                [
                  run(job.role, { bold: true }),
                  run(
                    ` — ${job.company}${job.detail ? ` (${job.detail})` : ''}`,
                  ),
                ],
                job.period,
              ),
              ...job.bullets.map(bullet),
            ]),
          ]
        : [];
    case 'projects':
      return data.projects.length
        ? [
            heading(title),
            ...data.projects.flatMap((p) => [
              headline(
                [
                  run(p.name, { bold: true }),
                  ...(p.stack
                    ? [run(' | '), run(p.stack, { italics: true })]
                    : []),
                  ...(p.link ? [run(' | '), linkRun(p.link)] : []),
                ],
                p.period,
              ),
              ...p.bullets.map(bullet),
            ]),
          ]
        : [];
    case 'education':
      return data.education.length
        ? [
            heading(title),
            ...data.education.flatMap((e) => [
              headline([run(e.degree, { bold: true })], e.period),
              plain([run(e.institution)]),
            ]),
          ]
        : [];
    case 'certifications':
      return data.certifications.length
        ? [
            heading(title),
            ...data.certifications.map((c) =>
              headline(
                [
                  run(c.name, { bold: true }),
                  run(` — ${c.issuer}`),
                  ...(c.link ? [run(' ('), linkRun(c.link), run(')')] : []),
                ],
                c.date,
              ),
            ),
          ]
        : [];
    case 'languages':
      return data.languages.length
        ? [heading(title), plain([run(data.languages.join(' · '))])]
        : [];
  }
}

export async function renderCvDocx(data: CvData): Promise<Buffer> {
  const contactRuns = data.contacts.flatMap((c, i) => [
    ...(i > 0 ? [run('  ·  ', { size: 19 })] : []),
    linkRun(c, 19),
  ]);

  const doc = new Document({
    title: data.title,
    creator: data.name,
    styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 680, bottom: 680, left: MARGIN, right: MARGIN },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [run(data.name, { bold: true, size: 42 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: contactRuns,
          }),
          ...data.order.flatMap((key) => sectionParagraphs(key, data)),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
