/**
 * HTML to PPTX Renderer - html2pptx 라이브러리 기반
 *
 * 워크플로우:
 * 1. DeckSpec → HTML 슬라이드 생성 (960×540px)
 * 2. html2pptx 라이브러리로 HTML → PPTX 변환
 * 3. 차트/테이블은 PptxGenJS API로 플레이스홀더에 추가
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DeckSpec, ChartBlock, TableBlock, Theme } from '../types/slideSpec';
import { generateHTMLSlides, type HTMLSlideOutput, type PlaceholderInfo, type HTMLSlideOptions } from './htmlSlideGenerator';

// ============================================
// 1. 타입 정의
// ============================================

export interface Html2PptxOptions {
  outputPath: string;
  debug?: boolean;
  debugDir?: string;
  tmpDir?: string;
  /** 슬라이드 크기 (인치 단위) */
  slideSize?: { width: number; height: number };
  /** 화면 비율 */
  aspectRatio?: string;
}

export interface Html2PptxResult {
  success: boolean;
  outputPath?: string;
  slideCount: number;
  duration: number;
  debugFiles?: string[];
  error?: string;
}

// ============================================
// 2. 메인 렌더러
// ============================================

/**
 * DeckSpec을 html2pptx 라이브러리로 PPTX 변환
 */
export async function renderDeckWithHtml2Pptx(
  deckSpec: DeckSpec,
  options: Html2PptxOptions
): Promise<Html2PptxResult> {
  const startTime = Date.now();
  const debugFiles: string[] = [];
  const tmpDir = options.tmpDir || process.env.TMPDIR || '/tmp';

  try {
    // 임시 디렉토리 생성
    const workDir = path.join(tmpDir, `pptx-${Date.now()}`);
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }

    // HTML 슬라이드 생성 (slideSize 전달)
    const htmlSlides = generateHTMLSlides(deckSpec, workDir, {
      slideSize: options.slideSize,
    });

    // 디버그 디렉토리 생성
    if (options.debug && options.debugDir && !fs.existsSync(options.debugDir)) {
      fs.mkdirSync(options.debugDir, { recursive: true });
    }

    // HTML 파일들을 디스크에 저장
    for (const slide of htmlSlides) {
      const filePath = path.join(workDir, slide.filename);
      fs.writeFileSync(filePath, slide.html);

      if (options.debug && options.debugDir) {
        const debugPath = path.join(options.debugDir, slide.filename);
        fs.writeFileSync(debugPath, slide.html);
        debugFiles.push(debugPath);
      }
    }

    // PPTX 생성 스크립트 작성
    const scriptPath = path.join(workDir, 'generate-pptx.js');
    const scriptContent = generatePptxScript(
      htmlSlides,
      deckSpec,
      workDir,
      options.outputPath,
      options.slideSize
    );
    fs.writeFileSync(scriptPath, scriptContent);

    // html2pptx 라이브러리를 작업 디렉토리로 복사
    const html2pptxSrcPath = path.resolve(process.cwd(), 'html2pptx');
    const html2pptxDestPath = path.join(workDir, 'html2pptx');
    if (fs.existsSync(html2pptxSrcPath)) {
      fs.cpSync(html2pptxSrcPath, html2pptxDestPath, { recursive: true });
    }

    // 스크립트 실행
    const { execSync } = await import('child_process');

    // 프로젝트 node_modules 경로
    const projectNodeModules = path.resolve(process.cwd(), 'node_modules');
    const globalNodeModules = '$(npm root -g)';

    try {
      const output = execSync(
        `NODE_PATH="${projectNodeModules}:${globalNodeModules}" node "${scriptPath}" 2>&1`,
        {
          cwd: workDir,
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024,
        }
      );
      console.log('Script output:', output);
    } catch (execError: unknown) {
      const err = execError as { stdout?: string; stderr?: string; message?: string };
      console.error('Script error stdout:', err.stdout);
      console.error('Script error stderr:', err.stderr);
      throw new Error(`Script execution failed: ${err.message}`);
    }

    // 정리
    if (!options.debug) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      outputPath: options.outputPath,
      slideCount: deckSpec.slides.length,
      duration,
      debugFiles: options.debug ? debugFiles : undefined,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      slideCount: 0,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================
// 3. PPTX 생성 스크립트 생성
// ============================================

/**
 * Node.js 스크립트 생성 (html2pptx 라이브러리 사용)
 */
function generatePptxScript(
  slides: HTMLSlideOutput[],
  deckSpec: DeckSpec,
  workDir: string,
  outputPath: string,
  slideSize?: { width: number; height: number }
): string {
  const slidesWithData = slides.map(s => ({
    filename: s.filename,
    hasPlaceholder: s.hasPlaceholder,
    placeholders: s.placeholderData || [],
  }));

  const chartDataMap = generateChartDataMap(slides);
  const tableDataMap = generateTableDataMap(slides);

  // 슬라이드 레이아웃 설정 코드 생성
  const layoutCode = slideSize
    ? `pptx.defineLayout({ name: "CUSTOM", width: ${slideSize.width}, height: ${slideSize.height} });
  pptx.layout = "CUSTOM";`
    : `pptx.layout = "LAYOUT_16x9";`;

  return `
const pptxgen = require("pptxgenjs");
const { html2pptx } = require("./html2pptx");
const path = require("path");

async function createPresentation() {
  const pptx = new pptxgen();
  ${layoutCode}
  pptx.title = ${JSON.stringify(deckSpec.metadata.title || 'Presentation')};
  pptx.author = ${JSON.stringify(deckSpec.metadata.author || '')};
  pptx.company = ${JSON.stringify(deckSpec.metadata.company || '')};

  const workDir = ${JSON.stringify(workDir)};
  const slides = ${JSON.stringify(slidesWithData)};
  const chartData = ${JSON.stringify(chartDataMap)};
  const tableData = ${JSON.stringify(tableDataMap)};

  for (const slideInfo of slides) {
    const htmlPath = path.join(workDir, slideInfo.filename);

    if (slideInfo.hasPlaceholder && slideInfo.placeholders.length > 0) {
      // 플레이스홀더가 있는 슬라이드
      const { slide, placeholders } = await html2pptx(htmlPath, pptx);

      for (const ph of slideInfo.placeholders) {
        const phPos = placeholders.find(p => p.id === ph.id);
        if (!phPos) continue;

        if (ph.type === 'chart' && chartData[ph.id]) {
          const cData = chartData[ph.id];
          slide.addChart(pptx.charts[cData.chartType.toUpperCase()] || pptx.charts.BAR, cData.data, {
            ...phPos,
            showTitle: false,
            showLegend: cData.options?.showLegend ?? true,
            chartColors: cData.options?.colors || ['4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5'],
            showCatAxisTitle: !!cData.options?.xAxisTitle,
            catAxisTitle: cData.options?.xAxisTitle || '',
            showValAxisTitle: !!cData.options?.yAxisTitle,
            valAxisTitle: cData.options?.yAxisTitle || '',
          });
        }

        if (ph.type === 'table' && tableData[ph.id]) {
          const tData = tableData[ph.id];
          slide.addTable(tData.rows, {
            ...phPos,
            border: { pt: 1, color: 'CCCCCC' },
            fontFace: 'Arial',
            fontSize: 11,
          });
        }
      }
    } else {
      // 플레이스홀더 없는 슬라이드
      await html2pptx(htmlPath, pptx);
    }
  }

  // 저장
  await pptx.writeFile({ fileName: ${JSON.stringify(outputPath)} });
  console.log('PPTX created successfully:', ${JSON.stringify(outputPath)});
}

createPresentation().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
`;
}

/**
 * 차트 데이터 맵 생성
 */
function generateChartDataMap(
  slides: HTMLSlideOutput[]
): Record<string, { chartType: string; data: unknown[]; options?: Record<string, unknown> }> {
  const map: Record<string, { chartType: string; data: unknown[]; options?: Record<string, unknown> }> = {};

  for (const slide of slides) {
    if (!slide.placeholderData) continue;

    for (const ph of slide.placeholderData) {
      if (ph.type === 'chart' && ph.data) {
        const chartBlock = ph.data as ChartBlock;
        map[ph.id] = {
          chartType: chartBlock.chartType,
          data: chartBlock.data.map(series => ({
            name: series.name,
            labels: series.labels,
            values: series.values,
          })),
          options: chartBlock.options,
        };
      }
    }
  }

  return map;
}

/**
 * 테이블 데이터 맵 생성
 */
function generateTableDataMap(
  slides: HTMLSlideOutput[]
): Record<string, { rows: unknown[][] }> {
  const map: Record<string, { rows: unknown[][] }> = {};

  for (const slide of slides) {
    if (!slide.placeholderData) continue;

    for (const ph of slide.placeholderData) {
      if (ph.type === 'table' && ph.data) {
        const tableBlock = ph.data as TableBlock;
        const rows: unknown[][] = [];

        // 헤더 추가
        if (tableBlock.headers) {
          rows.push(
            tableBlock.headers.map(h => ({
              text: h,
              options: { bold: true, fill: { color: '4472C4' }, color: 'FFFFFF' },
            }))
          );
        }

        // 데이터 행 추가
        for (const row of tableBlock.rows) {
          rows.push(
            row.map(cell => {
              if (typeof cell === 'string') {
                return { text: cell };
              }
              return {
                text: cell.content,
                options: {
                  bold: cell.isHeader,
                  colspan: cell.colspan,
                  rowspan: cell.rowspan,
                },
              };
            })
          );
        }

        map[ph.id] = { rows };
      }
    }
  }

  return map;
}

// ============================================
// 4. 유틸리티
// ============================================

/**
 * 디버그 디렉토리 정리
 */
export function cleanupDebugDir(debugDir: string): void {
  if (fs.existsSync(debugDir)) {
    fs.rmSync(debugDir, { recursive: true, force: true });
  }
}

/**
 * HTML 미리보기 생성
 */
export function createPreviewHTML(deckSpec: DeckSpec): string {
  const slides = generateHTMLSlides(deckSpec, '');

  const slideContents = slides
    .map(
      (s, i) => `
    <div class="slide-container" data-slide="${i}">
      <iframe srcdoc="${escapeAttr(s.html)}" width="960" height="540"></iframe>
      <div class="slide-label">Slide ${i + 1}: ${s.slideType}</div>
    </div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Preview: ${deckSpec.metadata.title || 'Presentation'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #1a1a1a;
      padding: 20px;
      margin: 0;
    }
    .slide-container {
      margin-bottom: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    iframe {
      border: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      background: white;
    }
    .slide-label {
      color: #888;
      margin-top: 10px;
      font-size: 14px;
    }
  </style>
</head>
<body>
${slideContents}
</body>
</html>`;
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
