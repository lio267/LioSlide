/**
 * Outline Agent - 프레젠테이션 아웃라인 생성
 *
 * MCP 연동: Sequential Thinking
 * 역할: "슬라이드별 한 문장 핵심 메시지"를 먼저 뽑아 품질 향상
 *
 * ⚠️ 원칙: 이 에이전트는 좌표를 결정하지 않습니다
 */

import type {
  UserInput,
  OutlineAgentInput,
  OutlineAgentOutput,
  SlideOutline,
  PresentationTone,
} from '../types/agents';
import type { SlideType, Theme } from '../types/slideSpec';

// ============================================
// 0. Sequential Thinking MCP 인터페이스
// ============================================

/**
 * Sequential Thinking MCP 호출 파라미터
 * @see mcp__sequential-thinking__sequentialthinking
 */
export interface SequentialThinkingParams {
  thought: string;
  nextThoughtNeeded: boolean;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
}

/**
 * Sequential Thinking 단계별 결과
 */
export interface ThinkingStep {
  stepNumber: number;
  stepName: string;
  thought: string;
  result: unknown;
  timestamp: string;
}

/**
 * MCP Sequential Thinking 호출 함수 타입
 * 외부에서 주입받아 실제 MCP 연동
 */
export type SequentialThinkingExecutor = (
  params: SequentialThinkingParams
) => Promise<{ success: boolean; thought: string }>;

/**
 * 아웃라인 생성을 위한 사고 단계 정의
 */
export const OUTLINE_THINKING_STEPS = [
  {
    name: 'extractKeyPoints',
    description: '원문에서 핵심 포인트 추출',
    promptTemplate: (input: UserInput, _prevResult?: string) => `
주어진 콘텐츠에서 프레젠테이션에 포함할 핵심 포인트를 추출합니다.

[주제] ${input.topic}
[청중] ${input.audience}
[톤] ${input.tone}
[원문]
${input.sourceContent || '(원문 없음 - 주제 기반 생성)'}

핵심 포인트를 우선순위 순으로 나열하세요. 각 포인트는 한 문장으로 표현합니다.
`,
  },
  {
    name: 'analyzeAudience',
    description: '청중 분석 및 메시지 레벨 결정',
    promptTemplate: (input: UserInput, prevResult: string) => `
추출된 핵심 포인트를 청중에 맞게 조정합니다.

[청중] ${input.audience}
[톤] ${input.tone}
[추출된 포인트]
${prevResult}

청중의 지식 수준, 관심사, 기대를 고려하여:
1. 각 포인트의 설명 깊이를 결정하세요
2. 청중에게 불필요한 포인트는 제외하세요
3. 추가로 필요한 배경 설명이 있다면 추가하세요
`,
  },
  {
    name: 'designFlow',
    description: '논리적 흐름 설계',
    promptTemplate: (input: UserInput, prevResult: string) => `
포인트들을 논리적인 프레젠테이션 흐름으로 구성합니다.

[조정된 포인트]
${prevResult}

[목표 슬라이드 수] 약 ${input.slideCount}장

다음을 고려하여 순서를 결정하세요:
1. 도입 → 본론 → 결론 구조
2. 각 포인트 간의 자연스러운 전환
3. 클라이맥스 배치 (가장 중요한 메시지의 위치)
4. 슬라이드 분할이 필요한 경우 표시
`,
  },
  {
    name: 'assignSlideTypes',
    description: '슬라이드 타입 결정',
    promptTemplate: (input: UserInput, prevResult: string) => `
각 슬라이드에 적합한 타입을 결정합니다.

[흐름 구조]
${prevResult}

[톤] ${input.tone}

사용 가능한 슬라이드 타입:
- title: 표지
- sectionTitle: 섹션 구분
- agenda: 목차
- content: 일반 콘텐츠
- twoColumn: 2단 비교/병렬
- chart: 차트/데이터 중심
- imageHero: 이미지 강조
- quote: 인용
- summary: 요약
- qna: Q&A
- closing: 마무리

각 슬라이드에 가장 적합한 타입을 선택하고, 선택 이유를 설명하세요.
`,
  },
  {
    name: 'estimateDensity',
    description: '콘텐츠 밀도 결정',
    promptTemplate: (input: UserInput, prevResult: string) => `
각 슬라이드의 콘텐츠 밀도를 결정합니다.

[슬라이드 구조]
${prevResult}

밀도 옵션:
- sparse: 여백 많음, 핵심만 (1-2개 요소)
- normal: 균형잡힌 구성 (3-4개 요소)
- dense: 정보 밀집 (5개 이상 요소)

각 슬라이드의 적절한 밀도를 결정하세요.
주의: 발표용 PPT는 sparse~normal이 권장됩니다.
`,
  },
] as const;

// ============================================
// 1. 프롬프트 템플릿
// ============================================

const OUTLINE_SYSTEM_PROMPT = `당신은 프레젠테이션 구조 전문가입니다.
주어진 콘텐츠를 분석하여 효과적인 슬라이드 구조를 설계합니다.

핵심 원칙:
1. 각 슬라이드는 하나의 명확한 핵심 메시지만 전달
2. 메시지는 청중이 기억해야 할 것
3. 흐름이 논리적으로 연결되어야 함
4. 정보가 많으면 슬라이드를 분할 (압축 금지)

슬라이드 타입:
- title: 표지
- sectionTitle: 섹션 구분
- agenda: 목차
- content: 일반 콘텐츠
- twoColumn: 2단 비교/병렬
- chart: 차트 중심
- imageHero: 이미지 강조
- quote: 인용
- summary: 요약
- qna: Q&A
- closing: 마무리`;

const OUTLINE_USER_PROMPT = (input: UserInput) => `
# 프레젠테이션 요청

## 주제
${input.topic}

## 대상 청중
${input.audience}

## 톤/스타일
${input.tone}

## 원하는 슬라이드 수
약 ${input.slideCount}장

## 원문/소스 자료
${input.sourceContent || '(없음)'}

## 추가 지시사항
${input.additionalInstructions || '(없음)'}

---

다음 JSON 형식으로 슬라이드 아웃라인을 생성해주세요:

\`\`\`json
{
  "outline": [
    {
      "order": 1,
      "type": "슬라이드 타입",
      "title": "슬라이드 제목",
      "keyMessage": "한 문장 핵심 메시지",
      "contentHints": ["포함될 내용 1", "포함될 내용 2"],
      "estimatedDensity": "sparse | normal | dense"
    }
  ],
  "sections": [
    {
      "name": "섹션명",
      "startIndex": 0,
      "endIndex": 3
    }
  ]
}
\`\`\`
`;

// ============================================
// 2. 톤별 슬라이드 구조 가이드
// ============================================

const TONE_GUIDELINES: Record<PresentationTone, {
  structureHint: string;
  recommendedTypes: SlideType[];
  densityPreference: 'sparse' | 'normal' | 'dense';
}> = {
  professional: {
    structureHint: '논리적 흐름, 데이터 기반, 명확한 결론',
    recommendedTypes: ['title', 'agenda', 'content', 'chart', 'summary'],
    densityPreference: 'normal',
  },
  casual: {
    structureHint: '대화체, 스토리텔링, 공감 요소',
    recommendedTypes: ['title', 'content', 'imageHero', 'quote', 'closing'],
    densityPreference: 'sparse',
  },
  academic: {
    structureHint: '체계적 구조, 인용, 연구 결과',
    recommendedTypes: ['title', 'agenda', 'content', 'chart', 'twoColumn', 'summary'],
    densityPreference: 'dense',
  },
  creative: {
    structureHint: '시각적 임팩트, 독특한 레이아웃, 감성',
    recommendedTypes: ['title', 'imageHero', 'quote', 'twoColumn', 'closing'],
    densityPreference: 'sparse',
  },
  minimal: {
    structureHint: '핵심만, 여백 활용, 간결함',
    recommendedTypes: ['title', 'content', 'summary', 'closing'],
    densityPreference: 'sparse',
  },
  energetic: {
    structureHint: '동적 요소, 강조, 액션 유도',
    recommendedTypes: ['title', 'content', 'imageHero', 'chart', 'qna'],
    densityPreference: 'normal',
  },
  luxury: {
    structureHint: '고급스러운 여백, 정제된 표현, 품격',
    recommendedTypes: ['title', 'imageHero', 'content', 'quote', 'closing'],
    densityPreference: 'sparse',
  },
};

// ============================================
// 3. 슬라이드 타입 추천 로직
// ============================================

function recommendSlideType(
  contentHints: string[],
  position: 'start' | 'middle' | 'end',
  tone: PresentationTone
): SlideType {
  const guidelines = TONE_GUIDELINES[tone];
  
  // 위치 기반 기본 타입
  if (position === 'start') return 'title';
  if (position === 'end') return 'closing';
  
  // 콘텐츠 힌트 기반 추천
  const hints = contentHints.join(' ').toLowerCase();
  
  if (hints.includes('chart') || hints.includes('graph') || hints.includes('data')) {
    return 'chart';
  }
  if (hints.includes('image') || hints.includes('photo') || hints.includes('visual')) {
    return 'imageHero';
  }
  if (hints.includes('compare') || hints.includes('vs') || hints.includes('versus')) {
    return 'twoColumn';
  }
  if (hints.includes('quote') || hints.includes('"')) {
    return 'quote';
  }
  if (hints.includes('summary') || hints.includes('conclusion')) {
    return 'summary';
  }
  
  // 톤 기본 권장 타입
  return guidelines.recommendedTypes.includes('content') ? 'content' : guidelines.recommendedTypes[1];
}

// ============================================
// 4. 밀도 추정 로직
// ============================================

function estimateDensity(
  contentHints: string[],
  tone: PresentationTone
): 'sparse' | 'normal' | 'dense' {
  const guidelines = TONE_GUIDELINES[tone];
  const hintCount = contentHints.length;
  const totalLength = contentHints.join('').length;
  
  // 힌트 수와 길이 기반 추정
  if (hintCount <= 2 && totalLength < 100) {
    return 'sparse';
  }
  if (hintCount >= 5 || totalLength > 300) {
    return 'dense';
  }
  
  return guidelines.densityPreference;
}

// ============================================
// 5. Outline Agent 클래스
// ============================================

/**
 * OutlineAgent 설정 옵션
 */
export interface OutlineAgentOptions {
  /** Sequential Thinking MCP 실행 함수 (외부 주입) */
  mcpExecutor?: SequentialThinkingExecutor;
  /** 디버그 모드 */
  debug?: boolean;
}

export class OutlineAgent {
  private input: OutlineAgentInput;
  private thinkingLog: string[] = [];
  private thinkingSteps: ThinkingStep[] = [];
  private options: OutlineAgentOptions;

  constructor(input: OutlineAgentInput, options: OutlineAgentOptions = {}) {
    this.input = input;
    this.options = options;
  }

  /**
   * MCP Sequential Thinking을 사용한 아웃라인 생성
   * 5단계 사고 과정을 통해 고품질 아웃라인 생성
   */
  async generateWithMCP(
    executor?: SequentialThinkingExecutor
  ): Promise<OutlineAgentOutput> {
    const mcpExecutor = executor || this.options.mcpExecutor;

    if (!mcpExecutor) {
      this.log('⚠️ MCP Executor 없음 - 시뮬레이션 모드로 실행');
      return this.generateWithMCPSimulated();
    }

    this.log('🧠 Sequential Thinking MCP 시작...');
    const { userInput } = this.input;
    const totalSteps = OUTLINE_THINKING_STEPS.length;
    let previousResult = '';

    // 각 단계별 Sequential Thinking 실행
    for (let i = 0; i < totalSteps; i++) {
      const step = OUTLINE_THINKING_STEPS[i];
      const stepNumber = i + 1;
      const isLastStep = i === totalSteps - 1;

      this.log(`📋 Step ${stepNumber}/${totalSteps}: ${step.description}`);

      // 프롬프트 생성
      const thought = step.promptTemplate(userInput, previousResult);

      // MCP Sequential Thinking 호출
      const mcpParams: SequentialThinkingParams = {
        thought,
        nextThoughtNeeded: !isLastStep,
        thoughtNumber: stepNumber,
        totalThoughts: totalSteps,
        needsMoreThoughts: false,
      };

      try {
        const result = await mcpExecutor(mcpParams);

        if (!result.success) {
          this.log(`❌ Step ${stepNumber} 실패`, 'error');
          throw new Error(`Sequential Thinking Step ${stepNumber} failed`);
        }

        // 결과 저장
        this.thinkingSteps.push({
          stepNumber,
          stepName: step.name,
          thought: mcpParams.thought,
          result: result.thought,
          timestamp: new Date().toISOString(),
        });

        previousResult = result.thought;
        this.log(`✅ Step ${stepNumber} 완료`);
      } catch (error) {
        this.log(
          `❌ MCP 호출 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error'
        );
        // 폴백: 시뮬레이션 모드로 전환
        this.log('🔄 폴백: 시뮬레이션 모드로 전환');
        return this.generateWithMCPSimulated();
      }
    }

    // 최종 결과 파싱 및 아웃라인 생성
    this.log('🔧 Sequential Thinking 결과를 아웃라인으로 변환...');
    const outline = this.parseThinkingResultToOutline(previousResult);
    const sections = this.groupSections(outline);

    this.log('✅ Outline 생성 완료');

    return {
      outline,
      totalSlides: outline.length,
      sections,
      thinkingLog: this.formatThinkingLog(),
    };
  }

  /**
   * MCP 시뮬레이션 모드 (MCP 없이 로컬 로직으로 실행)
   */
  private async generateWithMCPSimulated(): Promise<OutlineAgentOutput> {
    this.log('🧠 Sequential Thinking 시뮬레이션 시작...');

    // Step 1: 핵심 메시지 추출
    this.log('📋 Step 1: 핵심 메시지 추출');
    const keyPoints = this.extractKeyPoints();
    this.recordSimulatedStep(1, 'extractKeyPoints', keyPoints);

    // Step 2: 청중 분석
    this.log('👥 Step 2: 청중 분석');
    const adjustedPoints = this.analyzeAudienceAndAdjust(keyPoints);
    this.recordSimulatedStep(2, 'analyzeAudience', adjustedPoints);

    // Step 3: 흐름 최적화
    this.log('🔄 Step 3: 논리적 흐름 최적화');
    const optimizedFlow = this.optimizeFlow(adjustedPoints);
    this.recordSimulatedStep(3, 'designFlow', optimizedFlow);

    // Step 4: 슬라이드 구조화
    this.log('📊 Step 4: 슬라이드 타입 결정');
    const outline = this.structureSlides(optimizedFlow);
    this.recordSimulatedStep(4, 'assignSlideTypes', outline);

    // Step 5: 밀도 조정
    this.log('📐 Step 5: 콘텐츠 밀도 결정');
    const adjustedOutline = this.adjustDensity(outline);
    this.recordSimulatedStep(5, 'estimateDensity', adjustedOutline);

    // 섹션 그룹화
    this.log('📁 섹션 그룹화');
    const sections = this.groupSections(adjustedOutline);

    this.log('✅ Outline 생성 완료 (시뮬레이션)');

    return {
      outline: adjustedOutline,
      totalSlides: adjustedOutline.length,
      sections,
      thinkingLog: this.formatThinkingLog(),
    };
  }

  /**
   * Sequential Thinking 결과 파싱
   */
  private parseThinkingResultToOutline(thinkingResult: string): SlideOutline[] {
    const { userInput } = this.input;
    const outline: SlideOutline[] = [];

    // JSON 형식으로 파싱 시도
    try {
      const jsonMatch = thinkingResult.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed.slides || parsed.outline || parsed)) {
          const slides = parsed.slides || parsed.outline || parsed;
          return slides.map((slide: Record<string, unknown>, i: number) => ({
            order: i + 1,
            type: (slide.type as SlideType) || 'content',
            title: (slide.title as string) || `슬라이드 ${i + 1}`,
            keyMessage: (slide.keyMessage as string) || (slide.message as string) || '',
            contentHints: (slide.contentHints as string[]) ||
              (slide.hints as string[]) ||
              (slide.content as string[]) || [],
            estimatedDensity:
              (slide.density as 'sparse' | 'normal' | 'dense') || 'normal',
          }));
        }
      }
    } catch {
      this.log('⚠️ JSON 파싱 실패 - 텍스트 기반 파싱으로 전환');
    }

    // 텍스트 기반 파싱 (폴백)
    const lines = thinkingResult.split('\n').filter((l) => l.trim());
    let currentSlide = 0;

    for (const line of lines) {
      // 슬라이드 구분 패턴 감지
      const slideMatch = line.match(
        /(?:슬라이드|slide)\s*(\d+)|^(\d+)\.\s+/i
      );
      if (slideMatch) {
        currentSlide++;
        const title = line.replace(/^[\d.\s-]+/, '').trim();
        outline.push({
          order: currentSlide,
          type: this.inferSlideType(title, currentSlide, userInput.slideCount),
          title: title || `슬라이드 ${currentSlide}`,
          keyMessage: title,
          contentHints: [],
          estimatedDensity: 'normal',
        });
      } else if (outline.length > 0 && line.startsWith('-')) {
        // 불릿 포인트를 콘텐츠 힌트로 추가
        outline[outline.length - 1].contentHints.push(
          line.replace(/^-\s*/, '').trim()
        );
      }
    }

    // 최소 구조 보장
    if (outline.length === 0) {
      return this.generateSimple().outline;
    }

    return outline;
  }

  /**
   * 슬라이드 타입 추론
   */
  private inferSlideType(
    title: string,
    position: number,
    totalSlides: number
  ): SlideType {
    const lowerTitle = title.toLowerCase();

    if (position === 1) return 'title';
    if (position === totalSlides) return 'closing';
    if (lowerTitle.includes('목차') || lowerTitle.includes('agenda'))
      return 'agenda';
    if (lowerTitle.includes('요약') || lowerTitle.includes('summary'))
      return 'summary';
    if (
      lowerTitle.includes('비교') ||
      lowerTitle.includes('vs') ||
      lowerTitle.includes('차이')
    )
      return 'twoColumn';
    if (
      lowerTitle.includes('차트') ||
      lowerTitle.includes('데이터') ||
      lowerTitle.includes('통계')
    )
      return 'chart';
    if (
      lowerTitle.includes('인용') ||
      lowerTitle.includes('"') ||
      lowerTitle.includes('"')
    )
      return 'quote';

    return 'content';
  }

  /**
   * 시뮬레이션 단계 기록
   */
  private recordSimulatedStep(
    stepNumber: number,
    stepName: string,
    result: unknown
  ): void {
    this.thinkingSteps.push({
      stepNumber,
      stepName,
      thought: `[시뮬레이션] ${stepName}`,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 청중 분석 및 포인트 조정
   */
  private analyzeAudienceAndAdjust(points: string[]): string[] {
    const { audience, tone } = this.input.userInput;
    const guidelines = TONE_GUIDELINES[tone];

    // 청중에 따른 필터링 및 조정
    return points.map((point) => {
      // 전문적 청중에게는 상세 정보 유지
      if (
        audience.includes('임원') ||
        audience.includes('전문가') ||
        audience.includes('expert')
      ) {
        return point;
      }
      // 일반 청중에게는 간결하게
      if (point.length > 50) {
        return point.substring(0, 50) + '...';
      }
      return point;
    });
  }

  /**
   * 밀도 조정
   */
  private adjustDensity(outline: SlideOutline[]): SlideOutline[] {
    const { tone } = this.input.userInput;
    const guidelines = TONE_GUIDELINES[tone];

    return outline.map((slide) => ({
      ...slide,
      estimatedDensity:
        slide.estimatedDensity ||
        estimateDensity(slide.contentHints, tone),
    }));
  }

  /**
   * 사고 로그 포맷팅
   */
  private formatThinkingLog(): string {
    const header = '=== Sequential Thinking Log ===\n';
    const steps = this.thinkingSteps
      .map(
        (step) =>
          `[Step ${step.stepNumber}] ${step.stepName}\n` +
          `  Time: ${step.timestamp}\n` +
          `  Result: ${typeof step.result === 'string' ? step.result.substring(0, 200) : JSON.stringify(step.result).substring(0, 200)}...`
      )
      .join('\n\n');
    const footer = '\n=== End Log ===';

    return header + steps + footer + '\n\n' + this.thinkingLog.join('\n');
  }
  
  /**
   * 간단한 아웃라인 생성 (MCP 없이)
   */
  generateSimple(): OutlineAgentOutput {
    const { userInput, theme } = this.input;
    const outline: SlideOutline[] = [];
    const topic = userInput.topic;

    // 주제 기반 의미있는 콘텐츠 생성
    const topicBasedSections = this.generateTopicBasedSections(topic, userInput.audience, userInput.slideCount);

    // 1. 타이틀 슬라이드
    outline.push({
      order: 1,
      type: 'title',
      title: topic,
      keyMessage: `${topic}에 대한 프레젠테이션`,
      contentHints: [`${userInput.audience}을 위한 발표`],
      estimatedDensity: 'sparse',
    });

    // 2. 목차 (슬라이드 5장 이상일 때)
    if (userInput.slideCount >= 5) {
      const agendaItems = topicBasedSections.map(s => s.title);
      outline.push({
        order: 2,
        type: 'agenda',
        title: '목차',
        keyMessage: '오늘 다룰 내용',
        contentHints: agendaItems.slice(0, 5),
        estimatedDensity: 'sparse',
      });
    }

    // 3. 본문 슬라이드 (주제 기반)
    topicBasedSections.forEach((section, i) => {
      outline.push({
        order: outline.length + 1,
        type: section.type || 'content',
        title: section.title,
        keyMessage: section.keyMessage,
        contentHints: section.bullets,
        estimatedDensity: estimateDensity(section.bullets, userInput.tone),
      });
    });

    // 4. 요약 슬라이드
    const summaryPoints = topicBasedSections.slice(0, 3).map(s => s.keyMessage);
    outline.push({
      order: outline.length + 1,
      type: 'summary',
      title: '요약',
      keyMessage: `${topic}의 핵심 정리`,
      contentHints: summaryPoints,
      estimatedDensity: 'normal',
    });

    // 5. 마무리
    outline.push({
      order: outline.length + 1,
      type: 'closing',
      title: '감사합니다',
      keyMessage: '질문 및 토론',
      contentHints: [],
      estimatedDensity: 'sparse',
    });

    return {
      outline,
      totalSlides: outline.length,
      sections: [{
        name: '전체',
        startIndex: 0,
        endIndex: outline.length - 1,
      }],
    };
  }

  /**
   * 주제 기반 섹션 콘텐츠 생성
   */
  private generateTopicBasedSections(
    topic: string,
    audience: string,
    slideCount: number
  ): Array<{
    title: string;
    keyMessage: string;
    bullets: string[];
    type?: SlideType;
  }> {
    const contentSlideCount = Math.max(3, slideCount - 4); // 타이틀, 목차, 요약, 마무리 제외
    const sections: Array<{
      title: string;
      keyMessage: string;
      bullets: string[];
      type?: SlideType;
    }> = [];

    // 주제 기반 템플릿
    const templates = [
      {
        title: `${topic} 개요`,
        keyMessage: `${topic}의 핵심 개념과 중요성`,
        bullets: [
          `${topic}의 정의와 배경`,
          `현재 시장/업계 동향`,
          `${audience}에게 미치는 영향`,
        ],
      },
      {
        title: `${topic}의 주요 특징`,
        keyMessage: `${topic}을 이해하는 핵심 포인트`,
        bullets: [
          `핵심 특징 및 차별점`,
          `기존 방식 대비 장점`,
          `실제 적용 사례`,
        ],
      },
      {
        title: `${topic} 도입 효과`,
        keyMessage: `${topic} 도입 시 기대되는 성과`,
        bullets: [
          `효율성 및 생산성 향상`,
          `비용 절감 효과`,
          `경쟁력 강화`,
        ],
      },
      {
        title: `${topic} 구현 전략`,
        keyMessage: `성공적인 ${topic} 도입 방안`,
        bullets: [
          `단계별 도입 계획`,
          `필요 자원 및 준비사항`,
          `예상 리스크 및 대응방안`,
        ],
      },
      {
        title: `${topic} 성공 사례`,
        keyMessage: `${topic}을 통한 실제 성과`,
        bullets: [
          `국내외 성공 사례`,
          `도입 기업의 성과 지표`,
          `베스트 프랙티스`,
        ],
      },
      {
        title: `${topic}의 미래 전망`,
        keyMessage: `${topic} 발전 방향과 기회`,
        bullets: [
          `향후 발전 트렌드`,
          `새로운 기회와 가능성`,
          `${audience}를 위한 액션 아이템`,
        ],
      },
      {
        title: `${topic} 실행 로드맵`,
        keyMessage: `구체적인 실행 계획`,
        bullets: [
          `1단계: 현황 분석 및 목표 설정`,
          `2단계: 파일럿 도입 및 검증`,
          `3단계: 본격 확산 및 최적화`,
        ],
      },
      {
        title: `${topic} Q&A`,
        keyMessage: `자주 묻는 질문`,
        bullets: [
          `도입 시 고려사항`,
          `일반적인 우려사항`,
          `추가 정보 및 자료`,
        ],
      },
    ];

    // 필요한 만큼 섹션 선택
    for (let i = 0; i < contentSlideCount && i < templates.length; i++) {
      sections.push(templates[i]);
    }

    // 섹션이 부족하면 추가 생성
    while (sections.length < contentSlideCount) {
      const idx = sections.length % templates.length;
      const base = templates[idx];
      sections.push({
        ...base,
        title: `${base.title} (${Math.floor(sections.length / templates.length) + 1})`,
      });
    }

    return sections;
  }
  
  // ==========================================
  // 내부 헬퍼 메서드
  // ==========================================
  
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = level === 'error' ? '[ERROR]' : level === 'warn' ? '[WARN]' : '[INFO]';
    this.thinkingLog.push(`[${new Date().toISOString()}] ${prefix} ${message}`);
  }
  
  private extractKeyPoints(): string[] {
    const { sourceContent } = this.input.userInput;
    if (!sourceContent) return [];
    
    // 간단한 문장 분리
    const sentences = sourceContent
      .split(/[.!?]\s+/)
      .filter(s => s.length > 10)
      .slice(0, this.input.userInput.slideCount * 2);
    
    return sentences;
  }
  
  private optimizeFlow(points: string[]): string[] {
    // TODO: 실제 MCP에서는 논리적 순서 재배열
    return points;
  }
  
  private structureSlides(points: string[]): SlideOutline[] {
    const { userInput } = this.input;
    const outline: SlideOutline[] = [];
    
    // 타이틀
    outline.push({
      order: 1,
      type: 'title',
      title: userInput.topic,
      keyMessage: points[0] || userInput.topic,
      contentHints: [],
      estimatedDensity: 'sparse',
    });
    
    // 본문
    points.slice(1).forEach((point, i) => {
      outline.push({
        order: i + 2,
        type: 'content',
        title: `${i + 1}. ${point.substring(0, 30)}...`,
        keyMessage: point,
        contentHints: [point],
        estimatedDensity: estimateDensity([point], userInput.tone),
      });
    });
    
    // 마무리
    outline.push({
      order: outline.length + 1,
      type: 'closing',
      title: '감사합니다',
      keyMessage: '마무리',
      contentHints: [],
      estimatedDensity: 'sparse',
    });
    
    return outline;
  }
  
  private groupSections(outline: SlideOutline[]): { name: string; startIndex: number; endIndex: number }[] {
    // 간단한 섹션 그룹화: 시작, 본문, 끝
    const sections = [];
    
    if (outline.length > 3) {
      sections.push({ name: '도입', startIndex: 0, endIndex: 1 });
      sections.push({ name: '본론', startIndex: 2, endIndex: outline.length - 2 });
      sections.push({ name: '결론', startIndex: outline.length - 1, endIndex: outline.length - 1 });
    } else {
      sections.push({ name: '전체', startIndex: 0, endIndex: outline.length - 1 });
    }
    
    return sections;
  }
}

// ============================================
// 6. 편의 함수
// ============================================

/**
 * 아웃라인 생성 옵션
 */
export interface GenerateOutlineOptions {
  /** MCP Sequential Thinking 사용 여부 */
  useMCP?: boolean;
  /** MCP 실행 함수 (useMCP=true일 때 필수) */
  mcpExecutor?: SequentialThinkingExecutor;
  /** 디버그 모드 */
  debug?: boolean;
}

/**
 * 아웃라인 생성 (메인 진입점)
 *
 * @example
 * // 1. 기본 사용 (MCP 없이)
 * const outline = await generateOutline({ userInput, theme });
 *
 * @example
 * // 2. MCP Sequential Thinking 사용
 * const outline = await generateOutline(
 *   { userInput, theme },
 *   {
 *     useMCP: true,
 *     mcpExecutor: async (params) => {
 *       // 실제 MCP 호출
 *       const result = await mcp_sequential_thinking(params);
 *       return { success: true, thought: result };
 *     }
 *   }
 * );
 */
export async function generateOutline(
  input: OutlineAgentInput,
  options: GenerateOutlineOptions = {}
): Promise<OutlineAgentOutput> {
  const { useMCP = false, mcpExecutor, debug = false } = options;

  const agent = new OutlineAgent(input, {
    mcpExecutor,
    debug,
  });

  if (useMCP) {
    return agent.generateWithMCP(mcpExecutor);
  }

  return agent.generateSimple();
}

/**
 * MCP Sequential Thinking Executor 생성 헬퍼
 * Claude Code 환경에서 실제 MCP 도구와 연동할 때 사용
 *
 * @example
 * // Claude Code에서 사용 시
 * const executor = createMCPExecutor(async (params) => {
 *   return await mcp__sequential_thinking__sequentialthinking(params);
 * });
 */
export function createMCPExecutor(
  mcpCall: (params: SequentialThinkingParams) => Promise<unknown>
): SequentialThinkingExecutor {
  return async (params: SequentialThinkingParams) => {
    try {
      const result = await mcpCall(params);
      return {
        success: true,
        thought: typeof result === 'string' ? result : JSON.stringify(result),
      };
    } catch (error) {
      console.error('MCP 호출 실패:', error);
      return {
        success: false,
        thought: '',
      };
    }
  };
}
