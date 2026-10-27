import { fileURLToPath } from 'node:url';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import type { CvData } from './cv-data.js';
import { CV_TEMPLATE } from './cv-template.js';

export type RenderedCv = { pdf: Buffer; pages: number; density: number };

/** Binary-search steps over the spacing scale; 6 steps land within ~1.5%. */
const SEARCH_STEPS = 6;

// Source Sans 3 (OFL) ships with the api; New Computer Modern is embedded in Typst.
// Same path from src/cv and dist/cv: two levels up is the package root.
const FONTS_DIR = fileURLToPath(new URL('../../assets/fonts', import.meta.url));

// One compiler for the process: creating it loads the fonts.
let compiler: NodeCompiler | undefined;

function compile(data: CvData, density: number) {
  compiler ??= NodeCompiler.create({ fontArgs: [{ fontPaths: [FONTS_DIR] }] });
  const result = compiler.compile({
    mainFileContent: CV_TEMPLATE,
    inputs: { data: JSON.stringify(data), density: String(density) },
  });
  const doc = result.result;
  if (result.hasError() || !doc) {
    const error = result.takeError();
    throw new Error(
      `Typst compile failed: ${JSON.stringify(error?.shortDiagnostics ?? error)}`,
    );
  }
  return { compiler, doc };
}

/**
 * Compiles the CV to PDF with the airiest spacing that still fits on one page,
 * found by binary search (each compile takes a few ms). If even the most compact
 * spacing doesn't fit, the content really needs room, so it uses the airy
 * spacing over two pages instead of cramming.
 */
export function renderCvPdf(data: CvData): RenderedCv {
  const fits = (density: number) => compile(data, density).doc.numOfPages === 1;

  if (fits(0)) return finish(data, 0);
  if (!fits(1)) return finish(data, 0);

  let airy = 0; // known not to fit
  let compact = 1; // known to fit
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const middle = (airy + compact) / 2;
    if (fits(middle)) compact = middle;
    else airy = middle;
  }
  return finish(data, compact);
}

function finish(data: CvData, density: number): RenderedCv {
  const { compiler, doc } = compile(data, density);
  return { pdf: compiler.pdf(doc), pages: doc.numOfPages, density };
}
