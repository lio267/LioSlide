/**
 * 테마 시스템 테스트 스크립트
 * 7개 테마로 테스트 PPT 생성
 *
 * 실행: npx tsx scripts/test-themes.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  renderSlide,
  generateThemeCSSForName,
  type SlideData,
  type ThemeName,
} from '../src/generator/slideTemplates';

// 테스트할 테마
const TEST_THEME: ThemeName = 'corporate-blue';

// 테스트 슬라이드 데이터
const testSlides: SlideData[] = [
  {
    type: 'title',
    title: 'AI 기술 트렌드 2025',
    subtitle: '비즈니스 혁신을 위한 인사이트',
  },
  {
    type: 'agenda',
    title: '오늘의 목차',
    agendaItems: [
      { number: '01', title: '생성형 AI의 진화', description: 'GPT-5, Claude 4 등' },
      { number: '02', title: '멀티모달 AI', description: '텍스트, 이미지, 음성 통합' },
      { number: '03', title: 'AI 에이전트', description: '자율적 업무 수행' },
      { number: '04', title: 'AI 거버넌스', description: '윤리와 규제' },
    ],
  },
  {
    type: 'content',
    title: '생성형 AI 현황',
    content: [
      'GPT-5, Claude 4 등 차세대 모델 등장',
      '기업 업무 생산성 30% 이상 향상',
      '창작, 분석, 코딩 전 분야에서 활용',
      'AI 어시스턴트 → AI 에이전트로 진화',
    ],
    footnote: '출처: McKinsey Global AI Survey 2025',
  },
  {
    type: 'twoColumn',
    title: 'AI 도입 전후 비교',
    leftContent: [
      '수동 데이터 처리',
      '반복적인 문서 작업',
      '제한된 분석 범위',
      '느린 의사결정',
    ],
    rightContent: [
      '자동화된 데이터 분석',
      'AI 기반 문서 생성',
      '실시간 인사이트',
      '빠른 의사결정 지원',
    ],
  },
  {
    type: 'chart',
    title: 'AI 시장 성장 추이',
    content: [
      '2025년 5,000억 달러 규모',
      '연평균 성장률 37%',
      'Fortune 500 기업 90% 도입',
    ],
    chartPlaceholder: true,
  },
  {
    type: 'quote',
    quoteText: 'AI는 더 이상 미래의 기술이 아니라, 오늘의 필수 도구입니다.',
    quoteAuthor: 'Satya Nadella, Microsoft CEO',
  },
  {
    type: 'content',
    title: 'AI 도입 4단계 전략',
    content: [
      '1단계: 파일럿 프로젝트 시작',
      '2단계: 성공 사례 확대',
      '3단계: 전사 적용',
      '4단계: AI 문화 정착',
    ],
  },
  {
    type: 'closing',
    title: '감사합니다',
    subtitle: 'AI와 함께하는 미래, 지금 시작하세요',
  },
];

// 모든 테마 목록
const ALL_THEMES: ThemeName[] = [
  'corporate-blue',
  'dark-professional',
  'minimal-white',
  'creative-yellow',
  'soft-gradient',
  'modern-teal',
  'high-contrast',
];

async function generateTestPPT(themeName: ThemeName) {
  console.log(`\n🎨 테마: ${themeName}`);
  console.log('─'.repeat(40));

  const outputDir = path.join(process.cwd(), 'output', 'theme-test', themeName);

  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // CSS 생성
  const themeCSS = generateThemeCSSForName(themeName);

  // 각 슬라이드 HTML 생성
  for (let i = 0; i < testSlides.length; i++) {
    const slide = testSlides[i];
    const html = renderSlide(slide, themeCSS, themeName);
    const filename = `slide-${String(i + 1).padStart(2, '0')}-${slide.type}.html`;
    const filePath = path.join(outputDir, filename);

    fs.writeFileSync(filePath, html);
    console.log(`  ✅ ${filename}`);
  }

  console.log(`\n📁 저장 위치: ${outputDir}`);
  return outputDir;
}

async function generatePPTX(themeName: ThemeName, htmlDir: string) {
  console.log('\n📦 PPTX 변환 중...');

  const outputDir = path.join(process.cwd(), 'output');
  const pptxPath = path.join(outputDir, `test-${themeName}.pptx`);

  // html2pptx 라이브러리 경로
  const html2pptxPath = path.join(process.cwd(), 'html2pptx');

  // HTML 파일 목록
  const htmlFiles = fs.readdirSync(htmlDir)
    .filter(f => f.endsWith('.html'))
    .sort()
    .map(f => path.join(htmlDir, f));

  // PPTX 생성 스크립트
  const scriptContent = `
const pptxgen = require("pptxgenjs");
const { html2pptx } = require("${html2pptxPath.replace(/\\/g, '/')}");
const path = require("path");

async function createPPTX() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = "AI 기술 트렌드 2025";
  pptx.author = "Theme Test";

  const htmlFiles = ${JSON.stringify(htmlFiles)};

  for (const htmlPath of htmlFiles) {
    console.log("Processing:", path.basename(htmlPath));
    await html2pptx(htmlPath, pptx);
  }

  await pptx.writeFile({ fileName: "${pptxPath.replace(/\\/g, '/')}" });
  console.log("\\n✅ PPTX 생성 완료:", "${pptxPath.replace(/\\/g, '/')}");
}

createPPTX().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
`;

  const scriptPath = path.join(htmlDir, 'generate-pptx.cjs');
  fs.writeFileSync(scriptPath, scriptContent);

  // 스크립트 실행
  const { execSync } = await import('child_process');
  const projectNodeModules = path.resolve(process.cwd(), 'node_modules');

  try {
    const output = execSync(
      `NODE_PATH="${projectNodeModules}" node "${scriptPath}" 2>&1`,
      {
        cwd: htmlDir,
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
      }
    );
    console.log(output);
    return pptxPath;
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    console.error('PPTX 생성 실패:', err.message);
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    return null;
  }
}

async function main() {
  console.log('🚀 테마 시스템 테스트 시작\n');
  console.log('=' .repeat(50));

  // 선택한 테마로 테스트
  const selectedTheme = process.argv[2] as ThemeName || TEST_THEME;
  const generatePptx = process.argv.includes('--pptx');

  if (process.argv[2] === 'all') {
    // 모든 테마 생성
    console.log('📋 모든 테마(7개)로 슬라이드 생성');
    for (const theme of ALL_THEMES) {
      const htmlDir = await generateTestPPT(theme);
      if (generatePptx) {
        await generatePPTX(theme, htmlDir);
      }
    }
  } else {
    // 단일 테마 생성
    console.log(`📋 테마 '${selectedTheme}'로 ${testSlides.length}장 슬라이드 생성`);
    const htmlDir = await generateTestPPT(selectedTheme);
    if (generatePptx) {
      await generatePPTX(selectedTheme, htmlDir);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✨ 테스트 완료!');
  console.log('\n💡 사용법:');
  console.log('  npx tsx scripts/test-themes.ts                    # HTML만 생성');
  console.log('  npx tsx scripts/test-themes.ts --pptx             # HTML + PPTX');
  console.log('  npx tsx scripts/test-themes.ts dark-professional --pptx');
  console.log('  npx tsx scripts/test-themes.ts all --pptx         # 모든 테마 PPTX');
}

main().catch(console.error);
