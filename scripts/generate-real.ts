/**
 * 실제 콘텐츠로 PPT 생성 스크립트
 */

import { v4 as uuidv4 } from 'uuid';
import { DeckSpecSchema } from '../src/types/slideSpec';
import { LayoutEngine } from '../src/engine/layout/layoutEngine';
import { runStyleGuardian, applyAutoFixes } from '../src/agents/styleGuardian';
import { renderPresentation } from '../src/renderer/pptxRenderer';
import { DEFAULT_THEME } from '../src/pipeline';
import type { DeckSpec, SlideSpec, ContentBlock, TextBlock, BulletListBlock } from '../src/types/slideSpec';

// MCP Sequential Thinking으로 생성된 실제 아웃라인
const realOutline = [
  {
    order: 1,
    type: "title" as const,
    title: "AI 기술 트렌드 2025",
    keyMessage: "기업 경쟁력을 위한 AI 전략",
    contentHints: ["기업 임원을 위한 AI 인사이트"],
    estimatedDensity: "sparse" as const
  },
  {
    order: 2,
    type: "agenda" as const,
    title: "오늘의 핵심 아젠다",
    keyMessage: "5가지 AI 트렌드를 통해 미래를 준비합니다",
    contentHints: ["AI 시장 현황", "생성형 AI", "멀티모달 AI", "AI 에이전트", "AI 거버넌스"],
    estimatedDensity: "sparse" as const
  },
  {
    order: 3,
    type: "content" as const,
    title: "AI 시장 현황 2025",
    keyMessage: "AI는 더 이상 선택이 아닌 필수입니다",
    contentHints: ["글로벌 AI 시장 5,000억 달러 규모", "연평균 성장률 37%", "Fortune 500 기업 90% AI 도입"],
    estimatedDensity: "normal" as const
  },
  {
    order: 4,
    type: "content" as const,
    title: "생성형 AI의 업무 혁신",
    keyMessage: "업무 생산성 30% 이상 향상이 가능합니다",
    contentHints: ["문서 작성 자동화", "코드 생성 및 리뷰", "고객 서비스 자동 응답", "데이터 분석 리포트 생성"],
    estimatedDensity: "normal" as const
  },
  {
    order: 5,
    type: "twoColumn" as const,
    title: "멀티모달 AI의 시대",
    keyMessage: "단일 AI가 모든 형태의 데이터를 이해합니다",
    contentHints: ["텍스트 분석", "이미지 인식", "음성 처리", "영상 이해"],
    estimatedDensity: "normal" as const
  },
  {
    order: 6,
    type: "content" as const,
    title: "AI 에이전트의 부상",
    keyMessage: "복잡한 업무 프로세스를 자동화합니다",
    contentHints: ["자율적 의사결정", "다단계 작업 수행", "시스템 간 연동", "24/7 무중단 운영"],
    estimatedDensity: "normal" as const
  },
  {
    order: 7,
    type: "content" as const,
    title: "AI 거버넌스와 윤리",
    keyMessage: "신뢰할 수 있는 AI가 진정한 경쟁력입니다",
    contentHints: ["EU AI Act 등 규제 동향", "편향성 관리", "데이터 프라이버시", "설명 가능한 AI"],
    estimatedDensity: "normal" as const
  },
  {
    order: 8,
    type: "content" as const,
    title: "기업 AI 도입 전략",
    keyMessage: "작게 시작하고 빠르게 확장하세요",
    contentHints: ["1단계: 파일럿 프로젝트", "2단계: 성공 사례 확대", "3단계: 전사 적용", "4단계: AI 문화 정착"],
    estimatedDensity: "normal" as const
  },
  {
    order: 9,
    type: "summary" as const,
    title: "핵심 요약",
    keyMessage: "지금 바로 AI 전략을 수립하세요",
    contentHints: ["생성형 AI로 생산성 향상", "멀티모달 AI로 통합 처리", "AI 에이전트로 자동화", "거버넌스로 신뢰 확보", "단계별 도입 전략"],
    estimatedDensity: "normal" as const
  },
  {
    order: 10,
    type: "closing" as const,
    title: "감사합니다",
    keyMessage: "AI와 함께하는 미래, 지금 시작하세요",
    contentHints: ["Q&A", "연락처"],
    estimatedDensity: "sparse" as const
  }
];

// 아웃라인을 DeckSpec으로 변환
function buildDeckSpec(): DeckSpec {
  const slides: SlideSpec[] = realOutline.map(item => {
    const blocks: ContentBlock[] = [];

    if (item.contentHints.length > 0) {
      if (item.contentHints.length === 1) {
        blocks.push({
          type: 'text',
          content: item.contentHints[0],
          importance: 3,
        } as TextBlock);
      } else {
        blocks.push({
          type: 'bulletList',
          items: item.contentHints.map((hint) => ({
            content: hint,
            level: 0,
          })),
          importance: 3,
        } as BulletListBlock);
      }
    }

    // 핵심 메시지를 별도 텍스트 블록으로 추가
    // COLOR_CONTRAST 에러 수정: primary(#1791e8) 대신 primary-dark(#1273ba) 사용
    if (item.keyMessage && item.type !== 'title' && item.type !== 'closing') {
      blocks.unshift({
        type: 'text',
        content: item.keyMessage,
        importance: 5,
        style: {
          fontSize: 22,
          bold: true,
          color: { theme: 'primary-dark' as const },
        },
      } as TextBlock);
    }

    return {
      id: uuidv4(),
      type: item.type,
      title: item.title,
      subtitle: item.type === 'title' ? item.keyMessage : undefined,
      blocks,
      notes: item.keyMessage,
      constraints: {
        density: item.estimatedDensity,
        useAccentColor: false,
        backgroundStyle: 'solid' as const,
      },
      keyMessage: item.keyMessage,
      transition: 'fade' as const,
    };
  });

  return {
    metadata: {
      title: 'AI 기술 트렌드 2025',
      subtitle: '기업 경쟁력을 위한 AI 전략',
      author: 'PPT Auto Generator',
      company: 'AI Company',
      date: new Date().toISOString().split('T')[0],
      version: '1.0.0',
      language: 'ko',
    },
    theme: DEFAULT_THEME,
    slides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  console.log('🚀 실제 콘텐츠로 PPT 생성 시작\n');

  // 1. DeckSpec 생성
  console.log('📋 DeckSpec 생성 중...');
  let deckSpec = buildDeckSpec();
  deckSpec = DeckSpecSchema.parse(deckSpec);
  console.log(`✅ ${deckSpec.slides.length}개 슬라이드 생성\n`);

  // 2. 레이아웃 계산
  console.log('📐 레이아웃 계산 중...');
  const layoutEngine = new LayoutEngine(DEFAULT_THEME);
  let layoutResult = layoutEngine.calculateLayout(deckSpec);
  console.log('✅ 레이아웃 계산 완료\n');

  // 3. 린트 (1회만)
  console.log('🔍 Style Guardian 검사 중...');
  const guardianResult = runStyleGuardian({
    deckSpec,
    layoutResult,
    theme: DEFAULT_THEME,
  });
  console.log(`   에러: ${guardianResult.lintResult.errorCount}, 경고: ${guardianResult.lintResult.warningCount}\n`);

  // 4. 렌더링
  console.log('🎨 PPT 렌더링 중...');
  const outputPath = './output/AI_기술_트렌드_2025_실제.pptx';

  const renderResult = await renderPresentation(
    deckSpec,
    layoutResult,
    DEFAULT_THEME,
    outputPath
  );

  console.log(`\n✅ PPT 생성 완료!`);
  console.log(`📄 출력 파일: ${renderResult.filePath}`);
  console.log(`📊 슬라이드 수: ${deckSpec.slides.length}장`);
}

main().catch(console.error);
