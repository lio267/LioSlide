/**
 * html2pptx 렌더러 테스트 스크립트
 *
 * 실행: npx tsx scripts/test-html2pptx.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { DeckSpec, Theme } from '../src/types/slideSpec';
import { renderDeckWithHtml2Pptx } from '../src/renderer/html2pptxRenderer';
import { generateHTMLSlides } from '../src/renderer/htmlSlideGenerator';

// 테스트용 테마
const testTheme: Theme = {
  name: 'test-blue',
  colors: {
    primary: '1791e8',
    primaryLight: '4ba8ed',
    primaryDark: '1273ba',
    secondary: 'f5f5f5',
    surface: 'ffffff',
    surfaceForeground: '1d1d1d',
    muted: 'f5f5f5',
    mutedForeground: '737373',
    accent: 'ff6b6b',
    border: 'c8c8c8',
  },
  fonts: {
    display: 'Arial',
    content: 'Arial',
    mono: 'Courier New',
  },
  fontSizes: {
    title: 44,
    sectionTitle: 34,
    body: 20,
    caption: 12,
    footnote: 10,
  },
  lineHeights: {
    title: 1.1,
    body: 1.3,
  },
  grid: {
    canvas: { width: 13.333, height: 7.5 },
    safeMargin: 0.5,
    readableMargin: 0.7,
    columns: 12,
    gutter: 0.2,
    baselineUnit: 8,
  },
};

// 테스트용 DeckSpec
const testDeckSpec: DeckSpec = {
  metadata: {
    title: 'AI 기술 트렌드 2025',
    subtitle: '기업 경영진을 위한 인사이트',
    author: 'PPT Generator',
    company: 'Tech Corp',
    date: '2025-01-15',
    version: '1.0.0',
    language: 'ko',
  },
  theme: testTheme,
  slides: [
    {
      id: uuidv4(),
      type: 'title',
      title: 'AI 기술 트렌드 2025',
      subtitle: '기업 경영진을 위한 인사이트',
      blocks: [],
      transition: 'fade',
    },
    {
      id: uuidv4(),
      type: 'agenda',
      title: '목차',
      blocks: [
        {
          type: 'bulletList',
          items: [
            { content: '생성형 AI의 진화', level: 0 },
            { content: '멀티모달 AI 시대', level: 0 },
            { content: 'AI 에이전트와 자동화', level: 0 },
            { content: '기업의 AI 거버넌스', level: 0 },
          ],
          importance: 3,
        },
      ],
      transition: 'fade',
    },
    {
      id: uuidv4(),
      type: 'sectionTitle',
      title: '1. 생성형 AI의 진화',
      blocks: [],
      transition: 'fade',
    },
    {
      id: uuidv4(),
      type: 'content',
      title: '생성형 AI 현황',
      blocks: [
        {
          type: 'bulletList',
          items: [
            { content: 'GPT-5, Claude 4 등 차세대 모델 등장', level: 0 },
            { content: '기업 업무 생산성 30% 이상 향상 보고', level: 0 },
            { content: '창작, 분석, 코딩 전 분야에서 활용 확대', level: 0 },
            { content: 'AI 어시스턴트 → AI 에이전트로 진화', level: 0 },
          ],
          importance: 3,
        },
      ],
      keyMessage: '생성형 AI는 이제 필수 업무 도구가 되었습니다.',
      transition: 'fade',
    },
    {
      id: uuidv4(),
      type: 'chart',
      title: 'AI 도입률 추이',
      blocks: [
        {
          type: 'text',
          content: '글로벌 기업의 AI 도입률이 급격히 증가하고 있습니다.',
          importance: 4,
        },
        {
          type: 'chart',
          chartType: 'bar',
          data: [
            {
              name: 'AI 도입률',
              labels: ['2022', '2023', '2024', '2025'],
              values: [35, 48, 67, 85],
            },
          ],
          options: {
            showLegend: false,
            showValues: true,
            xAxisTitle: '연도',
            yAxisTitle: '도입률 (%)',
          },
          importance: 5,
        },
      ],
      transition: 'fade',
    },
    {
      id: uuidv4(),
      type: 'comparison',
      title: 'AI 도입 전후 비교',
      blocks: [
        {
          type: 'text',
          content: 'Before: 기존 업무 방식',
          importance: 4,
        },
        {
          type: 'bulletList',
          items: [
            { content: '수동 데이터 처리', level: 0 },
            { content: '반복적인 문서 작업', level: 0 },
          ],
          importance: 3,
        },
        {
          type: 'text',
          content: 'After: AI 도입 후',
          importance: 4,
        },
        {
          type: 'bulletList',
          items: [
            { content: '자동화된 인사이트 추출', level: 0 },
            { content: 'AI 기반 의사결정 지원', level: 0 },
          ],
          importance: 3,
        },
      ],
      transition: 'fade',
    },
    {
      id: uuidv4(),
      type: 'summary',
      title: '핵심 요약',
      blocks: [
        {
          type: 'bulletList',
          items: [
            { content: '생성형 AI는 업무 필수 도구로 자리잡음', level: 0 },
            { content: '멀티모달 AI로 활용 범위 확대', level: 0 },
            { content: 'AI 에이전트가 복잡한 업무 자동화', level: 0 },
            { content: 'AI 거버넌스와 윤리가 핵심 과제', level: 0 },
          ],
          importance: 4,
        },
      ],
      transition: 'fade',
    },
    {
      id: uuidv4(),
      type: 'closing',
      title: '감사합니다',
      keyMessage: 'AI로 더 나은 미래를 함께 만들어갑니다',
      blocks: [],
      transition: 'fade',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function runTest() {
  console.log('🚀 html2pptx 렌더러 테스트 시작\n');

  const outputDir = path.join(process.cwd(), 'output');
  const debugDir = path.join(outputDir, 'debug');

  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  // 1. HTML 슬라이드 생성 테스트
  console.log('📄 HTML 슬라이드 생성 중...');
  const htmlSlides = generateHTMLSlides(testDeckSpec, debugDir);

  console.log(`✅ ${htmlSlides.length}개 HTML 슬라이드 생성 완료`);

  // HTML 파일 저장 (디버깅용)
  for (const slide of htmlSlides) {
    const filePath = path.join(debugDir, slide.filename);
    fs.writeFileSync(filePath, slide.html);
    console.log(`   - ${slide.filename} (${slide.slideType})`);
  }

  // 2. PPTX 렌더링 테스트
  console.log('\n🎨 PPTX 렌더링 중...');

  const outputPath = path.join(outputDir, 'test-html2pptx.pptx');

  const result = await renderDeckWithHtml2Pptx(testDeckSpec, {
    outputPath,
    debug: true,
    debugDir,
  });

  if (result.success) {
    console.log(`\n✅ PPTX 생성 성공!`);
    console.log(`📄 출력 파일: ${result.outputPath}`);
    console.log(`📊 슬라이드 수: ${result.slideCount}`);
    console.log(`⏱️ 소요 시간: ${result.duration}ms`);

    if (result.debugFiles) {
      console.log(`\n📁 디버그 파일:`);
      result.debugFiles.forEach(f => console.log(`   - ${f}`));
    }
  } else {
    console.error(`\n❌ PPTX 생성 실패: ${result.error}`);
  }

  console.log('\n✨ 테스트 완료');
}

runTest().catch(console.error);
