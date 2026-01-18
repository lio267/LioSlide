/**
 * Content Agent - 슬라이드별 텍스트 콘텐츠 생성
 *
 * 역할:
 * - Outline Agent의 출력을 받아 실제 텍스트 콘텐츠 작성
 * - 톤/청중에 맞는 문체 적용
 * - 글자 수 제한 자동 준수
 *
 * ⚠️ 원칙: 이 에이전트는 좌표를 결정하지 않습니다
 */

import type {
  SlideOutline,
  PresentationTone,
} from '../types/agents';
import type {
  SlideType,
  TextBlock,
  BulletListBlock,
  ContentBlock,
} from '../types/slideSpec';
import {
  parseSourceContent,
  extractBulletPoints,
  extractKeyPoints,
  ParsedContent,
} from '../utils/contentParser';

// ============================================
// 1. 타입 정의
// ============================================

/**
 * Content Agent 입력
 */
export interface ContentAgentInput {
  slideOutline: SlideOutline;
  userInput: {
    tone: PresentationTone;
    audience: string;
    sourceContent?: string;
    additionalInstructions?: string;
  };
  slideIndex: number;
}

/**
 * Content Agent 출력
 */
export interface ContentAgentOutput {
  slideIndex: number;
  blocks: ContentBlock[];
  notes?: string;
}

/**
 * 전체 슬라이드 콘텐츠 생성 입력
 */
export interface ContentGenerationInput {
  outlines: SlideOutline[];
  userInput: {
    tone: PresentationTone;
    audience: string;
    sourceContent?: string;
    additionalInstructions?: string;
  };
}

/**
 * LLM 콘텐츠 생성기 타입
 */
export type ContentGenerator = (
  prompt: string,
  systemPrompt: string
) => Promise<string>;

/**
 * Content Agent 옵션
 */
export interface ContentAgentOptions {
  /** LLM 콘텐츠 생성기 (외부 주입) */
  generator?: ContentGenerator;
  /** 디버그 모드 */
  debug?: boolean;
  /** 병렬 처리 동시성 제한 */
  concurrency?: number;
}

// ============================================
// 2. 상수 정의
// ============================================

/** 글자 수 제한 */
export const CHAR_LIMITS = {
  TITLE_MAX: 40,
  BULLET_ITEM_MAX: 60,
  BULLET_COUNT_MAX: 5,
  BULLET_COUNT_RECOMMENDED: 3,
  NOTES_MAX: 300,
  NOTES_RECOMMENDED: 100,
} as const;

/** 톤별 문체 가이드 */
export const TONE_STYLE_GUIDE: Record<PresentationTone, {
  description: string;
  sentenceStyle: string;
  vocabulary: string;
  example: string;
  endings: string[];  // 문장 끝 패턴
}> = {
  professional: {
    description: '명확, 객관적, 데이터 중심',
    sentenceStyle: '간결한 서술형',
    vocabulary: '업계 용어 사용 가능',
    example: 'AI 도입으로 업무 효율성이 30% 향상되었습니다.',
    endings: ['습니다', '입니다', '됩니다', '합니다'],
  },
  casual: {
    description: '친근, 대화체, 쉬운 표현',
    sentenceStyle: '짧은 문장, 질문형 활용',
    vocabulary: '일상 용어 위주',
    example: 'AI가 뭘 할 수 있을까요? 생각보다 많습니다!',
    endings: ['해요', '죠?', '어요', '네요'],
  },
  academic: {
    description: '정확, 근거 제시, 논리적',
    sentenceStyle: '복문 가능, 인용 포함',
    vocabulary: '학술 용어, 출처 명시',
    example: 'Smith(2024)에 따르면, 생성형 AI의 생산성 향상 효과는...',
    endings: ['다', '한다', '된다', '이다'],
  },
  creative: {
    description: '감성적, 스토리텔링, 은유 활용',
    sentenceStyle: '다양한 길이, 리듬감',
    vocabulary: '비유적 표현, 감각적 단어',
    example: 'AI는 새로운 시대의 문을 열고 있습니다.',
    endings: ['습니다', '고 있습니다', '입니다'],
  },
  minimal: {
    description: '극도로 간결, 키워드 중심',
    sentenceStyle: '명사형 종결, 단어 위주',
    vocabulary: '핵심 단어만',
    example: 'AI 도입 → 효율 30% ↑',
    endings: ['', '↑', '↓', '%'],
  },
  energetic: {
    description: '열정적, 행동 유도, 감탄사',
    sentenceStyle: '짧고 강렬, 명령형',
    vocabulary: '동적 동사, 강조 표현',
    example: '지금 바로 시작하세요! 변화는 이미 시작됐습니다!',
    endings: ['하세요!', '입니다!', '합니다!', '!'],
  },
  luxury: {
    description: '우아, 절제, 품격',
    sentenceStyle: '여유 있는 호흡, 간접 표현',
    vocabulary: '고급 어휘, 은은한 표현',
    example: '탁월한 성과를 향한 여정이 시작됩니다.',
    endings: ['습니다', '합니다', '됩니다'],
  },
};

// ============================================
// 3. 유틸리티 함수
// ============================================

/**
 * 글자 수 계산 (한글 기준, 영문은 0.5 가중치)
 */
export function countChars(text: string): number {
  let count = 0;
  for (const char of text) {
    // 한글 범위: 가-힣, ㄱ-ㅎ, ㅏ-ㅣ
    count += /[\uAC00-\uD7A3\u3131-\u318E]/.test(char) ? 1 : 0.5;
  }
  return Math.ceil(count);
}

/**
 * 텍스트 압축 (글자 수 제한 초과 시)
 */
export function compressText(text: string, maxChars: number): string {
  if (countChars(text) <= maxChars) {
    return text;
  }

  // 1단계: 군더더기 제거
  let compressed = text
    .replace(/의 경우에는?/g, '')
    .replace(/에 대해서?/g, '')
    .replace(/을 통해서?/g, '로')
    .replace(/으로 인하여/g, '로')
    .replace(/가 있습니다/g, '있음')
    .replace(/를 할 수 있습니다/g, ' 가능')
    .replace(/것으로 보입니다/g, '')
    .replace(/라고 할 수 있습니다/g, '');

  if (countChars(compressed) <= maxChars) {
    return compressed;
  }

  // 2단계: 강제 자르기
  let result = '';
  let currentCount = 0;
  for (const char of compressed) {
    const charWeight = /[\uAC00-\uD7A3\u3131-\u318E]/.test(char) ? 1 : 0.5;
    if (currentCount + charWeight > maxChars - 3) {
      return result + '...';
    }
    result += char;
    currentCount += charWeight;
  }

  return result;
}

/**
 * 톤에 맞게 문장 스타일 적용
 */
export function applyToneStyle(text: string, tone: PresentationTone): string {
  const guide = TONE_STYLE_GUIDE[tone];

  switch (tone) {
    case 'minimal':
      // 미니멀: 불필요한 조사/어미 제거
      return text
        .replace(/이?가 /g, ' ')
        .replace(/을|를 /g, ' ')
        .replace(/입니다\.?/g, '')
        .replace(/합니다\.?/g, '')
        .replace(/됩니다\.?/g, '')
        .trim();

    case 'energetic':
      // 활기찬: 느낌표 추가
      if (!text.endsWith('!') && !text.endsWith('?')) {
        return text.replace(/[.。]?$/, '!');
      }
      return text;

    case 'casual':
      // 캐주얼: ~요 스타일로 변환
      return text
        .replace(/합니다\.?$/g, '해요')
        .replace(/입니다\.?$/g, '예요')
        .replace(/됩니다\.?$/g, '돼요');

    default:
      return text;
  }
}

// ============================================
// 4. 슬라이드 타입별 콘텐츠 생성기
// ============================================

type SlideContentGenerator = (
  outline: SlideOutline,
  tone: PresentationTone,
  audience: string
) => ContentAgentOutput;

/**
 * 타이틀 슬라이드 콘텐츠
 */
function generateTitleContent(
  outline: SlideOutline,
  tone: PresentationTone,
  audience: string
): ContentAgentOutput {
  const blocks: ContentBlock[] = [];

  // 부제목 또는 태그라인
  if (outline.contentHints.length > 0) {
    const subtitle = applyToneStyle(outline.contentHints[0], tone);
    blocks.push({
      type: 'text',
      content: compressText(subtitle, CHAR_LIMITS.BULLET_ITEM_MAX),
      importance: 3,
    } as TextBlock);
  }

  return {
    slideIndex: outline.order - 1,
    blocks,
    notes: `${audience}을 위한 발표입니다. ${outline.keyMessage}`,
  };
}

/**
 * 목차 슬라이드 콘텐츠
 */
function generateAgendaContent(
  outline: SlideOutline,
  tone: PresentationTone,
  _audience: string
): ContentAgentOutput {
  const items = outline.contentHints.map((hint, i) => ({
    content: applyToneStyle(`${i + 1}. ${hint}`, tone),
    level: 0 as const,
  }));

  // 불릿 수 제한
  const limitedItems = items.slice(0, CHAR_LIMITS.BULLET_COUNT_MAX);

  return {
    slideIndex: outline.order - 1,
    blocks: [
      {
        type: 'bulletList',
        items: limitedItems,
        importance: 4,
      } as BulletListBlock,
    ],
    notes: `각 섹션을 간략히 소개합니다. ${outline.keyMessage}`,
  };
}

/**
 * 일반 콘텐츠 슬라이드
 */
function generateContentSlide(
  outline: SlideOutline,
  tone: PresentationTone,
  _audience: string
): ContentAgentOutput {
  const blocks: ContentBlock[] = [];

  // 핵심 메시지 (강조)
  if (outline.keyMessage) {
    blocks.push({
      type: 'text',
      content: applyToneStyle(
        compressText(outline.keyMessage, CHAR_LIMITS.BULLET_ITEM_MAX),
        tone
      ),
      importance: 5,
    } as TextBlock);
  }

  // 콘텐츠 힌트를 불릿으로
  if (outline.contentHints.length > 0) {
    const items = outline.contentHints
      .slice(0, CHAR_LIMITS.BULLET_COUNT_MAX)
      .map((hint) => ({
        content: applyToneStyle(
          compressText(hint, CHAR_LIMITS.BULLET_ITEM_MAX),
          tone
        ),
        level: 0 as const,
      }));

    blocks.push({
      type: 'bulletList',
      items,
      importance: 3,
    } as BulletListBlock);
  }

  return {
    slideIndex: outline.order - 1,
    blocks,
    notes: compressText(
      `${outline.keyMessage}에 대해 설명합니다. 각 포인트의 세부 내용을 추가로 설명해주세요.`,
      CHAR_LIMITS.NOTES_MAX
    ),
  };
}

/**
 * 2단 비교 슬라이드
 */
function generateTwoColumnContent(
  outline: SlideOutline,
  tone: PresentationTone,
  _audience: string
): ContentAgentOutput {
  const blocks: ContentBlock[] = [];
  const midPoint = Math.ceil(outline.contentHints.length / 2);

  // 좌측 컬럼
  const leftHints = outline.contentHints.slice(0, midPoint);
  if (leftHints.length > 0) {
    blocks.push({
      type: 'text',
      content: applyToneStyle(leftHints[0], tone),
      importance: 4,
      groupId: 'left',
    } as TextBlock);

    if (leftHints.length > 1) {
      blocks.push({
        type: 'bulletList',
        items: leftHints.slice(1).map((hint) => ({
          content: applyToneStyle(compressText(hint, CHAR_LIMITS.BULLET_ITEM_MAX), tone),
          level: 0 as const,
        })),
        importance: 3,
        groupId: 'left',
      } as BulletListBlock);
    }
  }

  // 우측 컬럼
  const rightHints = outline.contentHints.slice(midPoint);
  if (rightHints.length > 0) {
    blocks.push({
      type: 'text',
      content: applyToneStyle(rightHints[0], tone),
      importance: 4,
      groupId: 'right',
    } as TextBlock);

    if (rightHints.length > 1) {
      blocks.push({
        type: 'bulletList',
        items: rightHints.slice(1).map((hint) => ({
          content: applyToneStyle(compressText(hint, CHAR_LIMITS.BULLET_ITEM_MAX), tone),
          level: 0 as const,
        })),
        importance: 3,
        groupId: 'right',
      } as BulletListBlock);
    }
  }

  return {
    slideIndex: outline.order - 1,
    blocks,
    notes: `좌우를 비교하며 설명합니다. ${outline.keyMessage}`,
  };
}

/**
 * 요약 슬라이드
 */
function generateSummaryContent(
  outline: SlideOutline,
  tone: PresentationTone,
  _audience: string
): ContentAgentOutput {
  const items = outline.contentHints
    .slice(0, CHAR_LIMITS.BULLET_COUNT_MAX)
    .map((hint) => ({
      content: applyToneStyle(compressText(hint, CHAR_LIMITS.BULLET_ITEM_MAX), tone),
      level: 0 as const,
    }));

  return {
    slideIndex: outline.order - 1,
    blocks: [
      {
        type: 'bulletList',
        items,
        importance: 5,
      } as BulletListBlock,
    ],
    notes: `전체 발표의 핵심을 요약합니다. ${outline.keyMessage}을 다시 한번 강조합니다.`,
  };
}

/**
 * 마무리 슬라이드
 */
function generateClosingContent(
  outline: SlideOutline,
  tone: PresentationTone,
  audience: string
): ContentAgentOutput {
  const blocks: ContentBlock[] = [];

  // CTA 또는 감사 메시지
  let closingMessage = outline.keyMessage || '감사합니다';
  if (tone === 'energetic') {
    closingMessage = closingMessage.replace(/[.。]?$/, '!');
  }

  blocks.push({
    type: 'text',
    content: applyToneStyle(closingMessage, tone),
    importance: 5,
  } as TextBlock);

  // 연락처/Q&A 힌트
  if (outline.contentHints.length > 0) {
    blocks.push({
      type: 'bulletList',
      items: outline.contentHints.slice(0, 3).map((hint) => ({
        content: hint,
        level: 0 as const,
      })),
      importance: 2,
    } as BulletListBlock);
  }

  return {
    slideIndex: outline.order - 1,
    blocks,
    notes: `${audience}에게 마무리 인사를 합니다. Q&A 시간을 안내해주세요.`,
  };
}

/**
 * 인용 슬라이드
 */
function generateQuoteContent(
  outline: SlideOutline,
  tone: PresentationTone,
  _audience: string
): ContentAgentOutput {
  const quoteText = outline.keyMessage || outline.contentHints[0] || '';

  return {
    slideIndex: outline.order - 1,
    blocks: [
      {
        type: 'text',
        content: `"${quoteText}"`,
        importance: 5,
      } as TextBlock,
    ],
    notes: `인용문의 맥락과 의미를 설명합니다.`,
  };
}

/**
 * 차트 슬라이드 (텍스트 부분만)
 */
function generateChartContent(
  outline: SlideOutline,
  tone: PresentationTone,
  _audience: string
): ContentAgentOutput {
  const blocks: ContentBlock[] = [];

  // 차트 설명 텍스트
  if (outline.keyMessage) {
    blocks.push({
      type: 'text',
      content: applyToneStyle(outline.keyMessage, tone),
      importance: 4,
    } as TextBlock);
  }

  // 주요 데이터 포인트
  if (outline.contentHints.length > 0) {
    blocks.push({
      type: 'bulletList',
      items: outline.contentHints.slice(0, 3).map((hint) => ({
        content: applyToneStyle(compressText(hint, CHAR_LIMITS.BULLET_ITEM_MAX), tone),
        level: 0 as const,
      })),
      importance: 3,
    } as BulletListBlock);
  }

  return {
    slideIndex: outline.order - 1,
    blocks,
    notes: `차트의 핵심 인사이트를 설명합니다. 데이터 출처를 언급해주세요.`,
  };
}

/**
 * 슬라이드 타입별 생성기 매핑
 */
const CONTENT_GENERATORS: Partial<Record<SlideType, SlideContentGenerator>> = {
  title: generateTitleContent,
  agenda: generateAgendaContent,
  content: generateContentSlide,
  twoColumn: generateTwoColumnContent,
  threeColumn: generateTwoColumnContent, // 2단과 동일하게 처리
  comparison: generateTwoColumnContent,
  summary: generateSummaryContent,
  closing: generateClosingContent,
  qna: generateClosingContent,
  quote: generateQuoteContent,
  chart: generateChartContent,
  imageHero: generateContentSlide,
  imageGallery: generateContentSlide,
  timeline: generateContentSlide,
  process: generateContentSlide,
  sectionTitle: generateTitleContent,
};

// ============================================
// 5. Content Agent 클래스
// ============================================

export class ContentAgent {
  private options: ContentAgentOptions;
  private logs: string[] = [];
  private parsedContent: ParsedContent | null = null;
  private distributedPoints: string[][] = [];

  constructor(options: ContentAgentOptions = {}) {
    this.options = {
      concurrency: 5,
      debug: false,
      ...options,
    };
  }

  /**
   * 원문 콘텐츠 파싱 및 저장
   */
  private parseSource(sourceContent: string | undefined, slideCount: number): void {
    if (!sourceContent || this.parsedContent) return;

    this.parsedContent = parseSourceContent(sourceContent);
    this.log(`📄 원문 파싱 완료: ${this.parsedContent.allKeyPoints.length}개 포인트, ${this.parsedContent.sections.length}개 섹션`);

    // 디버그: 추출된 키포인트 출력
    if (this.options.debug && this.parsedContent.allKeyPoints.length > 0) {
      this.log(`📋 추출된 키포인트:`);
      this.parsedContent.allKeyPoints.forEach((kp, i) => {
        this.log(`   ${i + 1}. ${kp}`);
      });
    }

    // 슬라이드별 콘텐츠 분배
    const contentSlideCount = Math.max(1, slideCount - 3); // 타이틀, 목차, 마무리 제외
    const pointsPerSlide = Math.max(2, Math.ceil(this.parsedContent.allKeyPoints.length / contentSlideCount));

    for (let i = 0; i < slideCount; i++) {
      const startIdx = Math.max(0, (i - 2)) * pointsPerSlide; // 타이틀, 목차 건너뛰기
      const endIdx = startIdx + pointsPerSlide;

      if (i < 2) {
        // 타이틀, 목차
        this.distributedPoints.push([]);
      } else if (startIdx < this.parsedContent.allKeyPoints.length) {
        this.distributedPoints.push(this.parsedContent.allKeyPoints.slice(startIdx, endIdx));
      } else {
        this.distributedPoints.push([]);
      }
    }
  }

  /**
   * 슬라이드별 분배된 콘텐츠 가져오기
   */
  private getDistributedContent(slideIndex: number): string[] {
    if (slideIndex < this.distributedPoints.length) {
      return this.distributedPoints[slideIndex];
    }
    return [];
  }

  /**
   * 단일 슬라이드 콘텐츠 생성
   */
  async generateSlideContent(input: ContentAgentInput): Promise<ContentAgentOutput> {
    const { slideOutline, userInput, slideIndex } = input;
    const { tone, audience, sourceContent } = userInput;

    this.log(`📝 슬라이드 ${slideIndex + 1} (${slideOutline.type}) 콘텐츠 생성 시작`);

    // LLM 생성기가 있으면 사용
    if (this.options.generator) {
      try {
        return await this.generateWithLLM(input);
      } catch (error) {
        this.log(`⚠️ LLM 생성 실패, 로컬 생성으로 폴백: ${error}`, 'warn');
      }
    }

    // 원문에서 분배된 콘텐츠 가져오기
    const distributedContent = this.getDistributedContent(slideIndex);

    // 원문 기반 콘텐츠가 있으면 사용
    if (distributedContent.length > 0) {
      const result = this.generateFromSourceContent(
        slideOutline,
        distributedContent,
        tone,
        audience
      );
      this.log(`✅ 슬라이드 ${slideIndex + 1} 콘텐츠 생성 완료 (원문 기반: ${distributedContent.length}개 포인트)`);
      return result;
    }

    // 로컬 생성 (타입별 생성기 사용) - 원문이 없는 경우
    const generator = CONTENT_GENERATORS[slideOutline.type] || generateContentSlide;
    const result = generator(slideOutline, tone, audience);

    this.log(`✅ 슬라이드 ${slideIndex + 1} 콘텐츠 생성 완료`);

    return result;
  }

  /**
   * 원문 기반 콘텐츠 생성
   */
  private generateFromSourceContent(
    outline: SlideOutline,
    distributedContent: string[],
    tone: PresentationTone,
    audience: string
  ): ContentAgentOutput {
    const blocks: ContentBlock[] = [];

    // 슬라이드 타입별 처리
    switch (outline.type) {
      case 'title':
      case 'sectionTitle':
        // 타이틀: 부제목만
        if (outline.contentHints.length > 0) {
          blocks.push({
            type: 'text',
            content: applyToneStyle(outline.contentHints[0], tone),
            importance: 3,
          } as TextBlock);
        }
        break;

      case 'agenda':
        // 목차: 섹션 제목들
        if (this.parsedContent && this.parsedContent.sections.length > 0) {
          const items = this.parsedContent.sections
            .filter(s => s.title)
            .slice(0, CHAR_LIMITS.BULLET_COUNT_MAX)
            .map((s, i) => ({
              content: applyToneStyle(`${i + 1}. ${s.title}`, tone),
              level: 0 as const,
            }));

          if (items.length > 0) {
            blocks.push({
              type: 'bulletList',
              items,
              importance: 4,
            } as BulletListBlock);
          }
        } else if (outline.contentHints.length > 0) {
          // 폴백: outline hints 사용
          const items = outline.contentHints.map((hint, i) => ({
            content: applyToneStyle(`${i + 1}. ${hint}`, tone),
            level: 0 as const,
          }));
          blocks.push({
            type: 'bulletList',
            items: items.slice(0, CHAR_LIMITS.BULLET_COUNT_MAX),
            importance: 4,
          } as BulletListBlock);
        }
        break;

      case 'closing':
      case 'qna':
        // 마무리: 감사 메시지 + 연락처
        let closingMessage = outline.keyMessage || '감사합니다';
        if (tone === 'energetic') {
          closingMessage = closingMessage.replace(/[.。]?$/, '!');
        }
        blocks.push({
          type: 'text',
          content: applyToneStyle(closingMessage, tone),
          importance: 5,
        } as TextBlock);
        break;

      case 'summary':
        // 요약: 전체 핵심 포인트
        if (this.parsedContent && this.parsedContent.allKeyPoints.length > 0) {
          const items = this.parsedContent.allKeyPoints
            .slice(0, CHAR_LIMITS.BULLET_COUNT_MAX)
            .map(point => ({
              content: applyToneStyle(compressText(point, CHAR_LIMITS.BULLET_ITEM_MAX), tone),
              level: 0 as const,
            }));
          blocks.push({
            type: 'bulletList',
            items,
            importance: 5,
          } as BulletListBlock);
        }
        break;

      default:
        // 일반 콘텐츠: 분배된 포인트 사용
        if (outline.keyMessage && distributedContent.length > 0) {
          // 핵심 메시지
          blocks.push({
            type: 'text',
            content: applyToneStyle(
              compressText(outline.keyMessage, CHAR_LIMITS.BULLET_ITEM_MAX),
              tone
            ),
            importance: 5,
          } as TextBlock);
        }

        // 불릿 포인트
        if (distributedContent.length > 0) {
          const items = distributedContent
            .slice(0, CHAR_LIMITS.BULLET_COUNT_MAX)
            .map(point => ({
              content: applyToneStyle(
                compressText(point, CHAR_LIMITS.BULLET_ITEM_MAX),
                tone
              ),
              level: 0 as const,
            }));

          blocks.push({
            type: 'bulletList',
            items,
            importance: 3,
          } as BulletListBlock);
        } else if (outline.contentHints.length > 0) {
          // 폴백: outline hints
          const items = outline.contentHints
            .slice(0, CHAR_LIMITS.BULLET_COUNT_MAX)
            .map(hint => ({
              content: applyToneStyle(
                compressText(hint, CHAR_LIMITS.BULLET_ITEM_MAX),
                tone
              ),
              level: 0 as const,
            }));
          blocks.push({
            type: 'bulletList',
            items,
            importance: 3,
          } as BulletListBlock);
        }
    }

    return {
      slideIndex: outline.order - 1,
      blocks,
      notes: compressText(
        `${outline.keyMessage || outline.title}에 대해 설명합니다.`,
        CHAR_LIMITS.NOTES_MAX
      ),
    };
  }

  /**
   * LLM을 사용한 콘텐츠 생성
   */
  private async generateWithLLM(input: ContentAgentInput): Promise<ContentAgentOutput> {
    const { slideOutline, userInput, slideIndex } = input;
    const { tone, audience } = userInput;
    const guide = TONE_STYLE_GUIDE[tone];

    const systemPrompt = `당신은 프레젠테이션 콘텐츠 작성 전문가입니다.
다음 톤/스타일을 적용하세요:
- 톤: ${tone}
- 특징: ${guide.description}
- 문장 스타일: ${guide.sentenceStyle}
- 어휘: ${guide.vocabulary}
- 예시: ${guide.example}

청중: ${audience}

제약 조건:
- 불릿 항목당 최대 ${CHAR_LIMITS.BULLET_ITEM_MAX}자
- 불릿 최대 ${CHAR_LIMITS.BULLET_COUNT_MAX}개
- 발표자 노트 최대 ${CHAR_LIMITS.NOTES_MAX}자`;

    const userPrompt = `다음 슬라이드의 콘텐츠를 JSON 형식으로 작성하세요:

슬라이드 타입: ${slideOutline.type}
제목: ${slideOutline.title}
핵심 메시지: ${slideOutline.keyMessage}
콘텐츠 힌트: ${slideOutline.contentHints.join(', ')}
밀도: ${slideOutline.estimatedDensity}

JSON 형식:
{
  "blocks": [
    { "type": "text", "content": "...", "importance": 5 },
    { "type": "bulletList", "items": [{ "content": "...", "level": 0 }], "importance": 3 }
  ],
  "notes": "발표자 노트..."
}`;

    const response = await this.options.generator!(userPrompt, systemPrompt);

    // JSON 파싱
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          slideIndex,
          blocks: this.validateBlocks(parsed.blocks || []),
          notes: compressText(parsed.notes || '', CHAR_LIMITS.NOTES_MAX),
        };
      }
    } catch (parseError) {
      this.log(`⚠️ JSON 파싱 실패: ${parseError}`, 'warn');
    }

    // 파싱 실패 시 로컬 생성으로 폴백
    const generator = CONTENT_GENERATORS[slideOutline.type] || generateContentSlide;
    return generator(slideOutline, tone, audience);
  }

  /**
   * 블록 유효성 검사 및 정규화
   */
  private validateBlocks(blocks: unknown[]): ContentBlock[] {
    return blocks
      .filter((block): block is Record<string, unknown> =>
        typeof block === 'object' && block !== null
      )
      .map((block) => {
        if (block.type === 'text') {
          return {
            type: 'text',
            content: compressText(String(block.content || ''), CHAR_LIMITS.BULLET_ITEM_MAX),
            importance: Math.min(5, Math.max(1, Number(block.importance) || 3)),
            groupId: block.groupId ? String(block.groupId) : undefined,
          } as TextBlock;
        }

        if (block.type === 'bulletList') {
          const items = Array.isArray(block.items) ? block.items : [];
          return {
            type: 'bulletList',
            items: items
              .slice(0, CHAR_LIMITS.BULLET_COUNT_MAX)
              .map((item: unknown) => {
                if (typeof item === 'object' && item !== null) {
                  const itemObj = item as Record<string, unknown>;
                  return {
                    content: compressText(
                      String(itemObj.content || ''),
                      CHAR_LIMITS.BULLET_ITEM_MAX
                    ),
                    level: Math.min(3, Math.max(0, Number(itemObj.level) || 0)) as 0 | 1 | 2 | 3,
                  };
                }
                return { content: String(item), level: 0 as const };
              }),
            importance: Math.min(5, Math.max(1, Number(block.importance) || 3)),
            groupId: block.groupId ? String(block.groupId) : undefined,
          } as BulletListBlock;
        }

        // 기본: 텍스트 블록으로 변환
        return {
          type: 'text',
          content: String(block.content || block),
          importance: 3,
        } as TextBlock;
      });
  }

  /**
   * 모든 슬라이드 콘텐츠 병렬 생성
   */
  async generateAllContent(
    input: ContentGenerationInput
  ): Promise<ContentAgentOutput[]> {
    const { outlines, userInput } = input;

    this.log(`🚀 ${outlines.length}개 슬라이드 콘텐츠 병렬 생성 시작`);

    // 원문이 있으면 먼저 파싱
    if (userInput.sourceContent) {
      this.parseSource(userInput.sourceContent, outlines.length);
    }

    // 동시성 제한을 위한 청크 분할
    const chunkSize = this.options.concurrency || 5;
    const results: ContentAgentOutput[] = [];

    for (let i = 0; i < outlines.length; i += chunkSize) {
      const chunk = outlines.slice(i, i + chunkSize);

      const chunkResults = await Promise.all(
        chunk.map((outline, index) =>
          this.generateSlideContent({
            slideOutline: outline,
            userInput,
            slideIndex: i + index,
          })
        )
      );

      results.push(...chunkResults);

      this.log(`✅ 청크 ${Math.ceil((i + chunkSize) / chunkSize)}/${Math.ceil(outlines.length / chunkSize)} 완료`);
    }

    this.log(`🎉 전체 ${results.length}개 슬라이드 콘텐츠 생성 완료`);

    return results;
  }

  /**
   * 로그 기록
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '[ERROR]' : level === 'warn' ? '[WARN]' : '[INFO]';
    const logMessage = `[${timestamp}] ${prefix} ${message}`;

    this.logs.push(logMessage);

    if (this.options.debug) {
      console.log(logMessage);
    }
  }

  /**
   * 로그 조회
   */
  getLogs(): string[] {
    return [...this.logs];
  }
}

// ============================================
// 6. 편의 함수
// ============================================

/**
 * 콘텐츠 생성 옵션
 */
export interface GenerateContentOptions {
  /** LLM 생성기 */
  generator?: ContentGenerator;
  /** 병렬 처리 동시성 */
  concurrency?: number;
  /** 디버그 모드 */
  debug?: boolean;
}

/**
 * 모든 슬라이드 콘텐츠 생성 (메인 진입점)
 *
 * @example
 * // 1. 기본 사용 (로컬 생성)
 * const contents = await generateAllSlideContent({
 *   outlines: outlineResult.outline,
 *   userInput: { tone: 'professional', audience: '기업 임원' }
 * });
 *
 * @example
 * // 2. LLM 사용
 * const contents = await generateAllSlideContent(
 *   { outlines, userInput },
 *   {
 *     generator: async (prompt, system) => {
 *       // Claude API 호출
 *       return await callClaude(prompt, system);
 *     }
 *   }
 * );
 */
export async function generateAllSlideContent(
  input: ContentGenerationInput,
  options: GenerateContentOptions = {}
): Promise<ContentAgentOutput[]> {
  const agent = new ContentAgent(options);
  return agent.generateAllContent(input);
}

/**
 * 단일 슬라이드 콘텐츠 생성
 */
export async function generateSlideContent(
  input: ContentAgentInput,
  options: GenerateContentOptions = {}
): Promise<ContentAgentOutput> {
  const agent = new ContentAgent(options);
  return agent.generateSlideContent(input);
}

/**
 * 콘텐츠 출력을 SlideSpec blocks로 변환
 */
export function contentToBlocks(
  content: ContentAgentOutput,
  slideType: SlideType,
  keyMessage?: string
): ContentBlock[] {
  const blocks = [...content.blocks];

  // title/closing 이외의 슬라이드에서 keyMessage가 없으면 추가
  if (
    keyMessage &&
    slideType !== 'title' &&
    slideType !== 'closing' &&
    !blocks.some((b) => b.type === 'text' && (b as TextBlock).importance === 5)
  ) {
    blocks.unshift({
      type: 'text',
      content: keyMessage,
      importance: 5,
    } as TextBlock);
  }

  return blocks;
}
