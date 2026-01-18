/**
 * HTML → PPTX 렌더러
 * html2pptx 라이브러리를 사용하여 HTML 슬라이드를 PPTX로 변환
 */

import * as fs from 'fs';
import * as path from 'path';
import { GeneratedSlide } from './htmlSlideGenerator';

export interface RenderOptions {
  outputPath: string;
  title?: string;
  author?: string;
  company?: string;
}

export interface RenderResult {
  success: boolean;
  outputPath?: string;
  slideCount: number;
  duration: number;
  error?: string;
}

/**
 * HTML 슬라이드들을 PPTX로 변환
 */
export async function renderToPptx(
  slides: GeneratedSlide[],
  options: RenderOptions
): Promise<RenderResult> {
  const startTime = Date.now();
  const tmpDir = process.env.TMPDIR || '/tmp';
  const workDir = path.join(tmpDir, `pptx-${Date.now()}`);

  try {
    // 작업 디렉토리 생성
    fs.mkdirSync(workDir, { recursive: true });

    // HTML 파일들 저장
    for (const slide of slides) {
      const filePath = path.join(workDir, slide.filename);
      fs.writeFileSync(filePath, slide.html, 'utf-8');
    }

    // html2pptx 라이브러리 복사
    const html2pptxSrc = path.join(process.cwd(), 'lib', 'html2pptx');
    const html2pptxDest = path.join(workDir, 'html2pptx');
    if (fs.existsSync(html2pptxSrc)) {
      fs.cpSync(html2pptxSrc, html2pptxDest, { recursive: true });
    }

    // 생성 스크립트 작성
    const scriptContent = generateScript(slides, options, workDir);
    const scriptPath = path.join(workDir, 'generate.js');
    fs.writeFileSync(scriptPath, scriptContent, 'utf-8');

    // 스크립트 실행
    const { execSync } = await import('child_process');
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');

    execSync(
      `NODE_PATH="${nodeModulesPath}" node "${scriptPath}" 2>&1`,
      {
        cwd: workDir,
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      }
    );

    // 정리
    fs.rmSync(workDir, { recursive: true, force: true });

    return {
      success: true,
      outputPath: options.outputPath,
      slideCount: slides.length,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    // 정리 시도
    try {
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
    } catch {}

    return {
      success: false,
      slideCount: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * PPTX 생성 스크립트 생성
 */
function generateScript(
  slides: GeneratedSlide[],
  options: RenderOptions,
  workDir: string
): string {
  const slideFilenames = slides.map(s => s.filename);
  const slidesWithPlaceholders = slides
    .filter(s => s.hasPlaceholder)
    .map(s => ({ index: s.index, filename: s.filename }));

  return `
const pptxgen = require("pptxgenjs");
const { html2pptx } = require("./html2pptx");
const path = require("path");

async function createPresentation() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = ${JSON.stringify(options.title || 'Presentation')};
  pptx.author = ${JSON.stringify(options.author || '')};
  pptx.company = ${JSON.stringify(options.company || '')};

  const workDir = ${JSON.stringify(workDir)};
  const slideFiles = ${JSON.stringify(slideFilenames)};
  const slidesWithPlaceholders = ${JSON.stringify(slidesWithPlaceholders)};

  // 모든 슬라이드 처리
  for (let i = 0; i < slideFiles.length; i++) {
    const htmlPath = path.join(workDir, slideFiles[i]);
    const hasPlaceholder = slidesWithPlaceholders.some(s => s.index === i);

    if (hasPlaceholder) {
      // 플레이스홀더가 있는 슬라이드
      const { slide, placeholders } = await html2pptx(htmlPath, pptx);

      // 차트 플레이스홀더에 샘플 차트 추가
      if (placeholders.length > 0) {
        const chartData = [
          {
            name: "데이터",
            labels: ["항목 1", "항목 2", "항목 3", "항목 4"],
            values: [45, 65, 80, 55],
          },
        ];

        slide.addChart(pptx.charts.BAR, chartData, {
          ...placeholders[0],
          showTitle: false,
          showLegend: false,
          chartColors: ["3B82F6"],
          barDir: "col",
          showCatAxisTitle: false,
          showValAxisTitle: false,
        });
      }
    } else {
      // 플레이스홀더 없는 슬라이드
      await html2pptx(htmlPath, pptx);
    }
  }

  // 저장
  await pptx.writeFile({ fileName: ${JSON.stringify(options.outputPath)} });
  console.log("PPTX created successfully");
}

createPresentation().catch(err => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
`;
}

/**
 * Buffer로 PPTX 생성 (API용)
 */
export async function renderToPptxBuffer(
  slides: GeneratedSlide[],
  options: Omit<RenderOptions, 'outputPath'>
): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
  const tmpDir = process.env.TMPDIR || '/tmp';
  const outputPath = path.join(tmpDir, `presentation-${Date.now()}.pptx`);

  const result = await renderToPptx(slides, { ...options, outputPath });

  if (result.success && fs.existsSync(outputPath)) {
    const buffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath);
    return { success: true, buffer };
  }

  return { success: false, error: result.error };
}
