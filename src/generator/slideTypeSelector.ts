/**
 * 슬라이드 타입 자동 선택기
 * 콘텐츠 특성에 따라 최적의 슬라이드 레이아웃을 자동 선택
 */

import type {
  ParsedSection,
  ParsedContent,
  BulletItem,
  StatItem,
  QuoteItem,
  SummarizedContent,
} from '../parser/contentSummarizer';

// ============================================
// 타입 정의
// ============================================

export type SlideLayoutType =
  | 'title'           // 표지
  | 'agenda'          // 목차
  | 'content'         // 일반 불릿
  | 'twoColumn'       // 2단 비교
  | 'timeline'        // 타임라인/프로세스
  | 'stats'           // 숫자/통계 강조
  | 'quote'           // 인용문
  | 'imageText'       // 이미지 + 텍스트
  | 'summary'         // 요약
  | 'closing';        // 마무리

export interface SlideSpec {
  type: SlideLayoutType;
  title: string;
  subtitle?: string;
  content: SlideContent;
  sectionIndex?: number;
  keyMessage?: string;
}

export interface SlideContent {
  bullets?: BulletItem[];
  leftBullets?: BulletItem[];
  rightBullets?: BulletItem[];
  stats?: StatItem[];
  quote?: QuoteItem;
  agendaItems?: AgendaItem[];
  summaryPoints?: string[];
  timelineItems?: TimelineItem[];
  paragraphs?: string[];
  imagePlaceholder?: boolean;
}

export interface AgendaItem {
  number: number;
  title: string;
  active?: boolean;
}

export interface TimelineItem {
  label: string;
  title: string;
  description?: string;
}

export interface SlideGenerationResult {
  slides: SlideSpec[];
  metadata: {
    totalSlides: number;
    hasAgenda: boolean;
    hasSummary: boolean;
    sectionCount: number;
  };
}

// ============================================
// 메인 함수
// ============================================

/**
 * 파싱된 콘텐츠로부터 슬라이드 스펙 생성
 */
export function generateSlideSpecs(content: SummarizedContent): SlideGenerationResult {
  const slides: SlideSpec[] = [];

  // 1. 타이틀 슬라이드
  slides.push(createTitleSlide(content));

  // 2. 목차 슬라이드 (섹션이 2개 이상일 때)
  const hasAgenda = content.agendaItems.length >= 2;
  if (hasAgenda) {
    slides.push(createAgendaSlide(content.agendaItems));
  }

  // 3. 콘텐츠 슬라이드들
  content.sections.forEach((section, index) => {
    const sectionSlides = createSectionSlides(section, index);
    slides.push(...sectionSlides);
  });

  // 4. 요약 슬라이드 (섹션이 2개 이상이고 요약 포인트가 있을 때)
  const hasSummary = content.summaryPoints.length >= 2;
  if (hasSummary) {
    slides.push(createSummarySlide(content.summaryPoints));
  }

  // 5. 클로징 슬라이드
  slides.push(createClosingSlide());

  return {
    slides,
    metadata: {
      totalSlides: slides.length,
      hasAgenda,
      hasSummary,
      sectionCount: content.sections.length,
    },
  };
}

// ============================================
// 슬라이드 타입 자동 선택
// ============================================

/**
 * 섹션 콘텐츠에 따라 최적 슬라이드 타입 선택
 */
export function selectSlideType(content: ParsedContent): SlideLayoutType {
  // 1. 인용문이 있으면 quote
  if (content.quotes.length > 0) {
    return 'quote';
  }

  // 2. 통계가 3개 이상이면 stats
  if (content.stats.length >= 3) {
    return 'stats';
  }

  // 3. 비교 콘텐츠면 twoColumn
  if (content.hasComparison) {
    return 'twoColumn';
  }

  // 4. 타임라인/프로세스면 timeline
  if (content.hasTimeline || content.hasProcess) {
    return 'timeline';
  }

  // 5. 불릿이 6개 이상이면 twoColumn으로 분할
  if (content.bullets.length > 5) {
    return 'twoColumn';
  }

  // 6. 문단만 있고 불릿이 없으면 imageText (이미지 placeholder)
  if (content.bullets.length === 0 && content.paragraphs.length > 0) {
    return 'imageText';
  }

  // 7. 기본값
  return 'content';
}

// ============================================
// 슬라이드 생성 함수들
// ============================================

/**
 * 타이틀 슬라이드 생성
 */
function createTitleSlide(content: SummarizedContent): SlideSpec {
  return {
    type: 'title',
    title: content.title,
    subtitle: content.subtitle,
    content: {},
  };
}

/**
 * 목차 슬라이드 생성
 */
function createAgendaSlide(items: string[]): SlideSpec {
  const agendaItems: AgendaItem[] = items.map((title, index) => ({
    number: index + 1,
    title,
    active: false,
  }));

  return {
    type: 'agenda',
    title: '목차',
    content: {
      agendaItems,
    },
  };
}

/**
 * 섹션 슬라이드들 생성
 */
function createSectionSlides(section: ParsedSection, sectionIndex: number): SlideSpec[] {
  const slides: SlideSpec[] = [];
  const slideType = selectSlideType(section.content);

  switch (slideType) {
    case 'quote':
      slides.push(createQuoteSlide(section));
      // 인용문 외 다른 콘텐츠가 있으면 추가 슬라이드
      if (section.content.bullets.length > 0) {
        slides.push(createContentSlide(section, sectionIndex));
      }
      break;

    case 'stats':
      slides.push(createStatsSlide(section, sectionIndex));
      break;

    case 'twoColumn':
      slides.push(createTwoColumnSlide(section, sectionIndex));
      break;

    case 'timeline':
      slides.push(createTimelineSlide(section, sectionIndex));
      break;

    case 'imageText':
      slides.push(createImageTextSlide(section, sectionIndex));
      break;

    default:
      // 불릿이 많으면 여러 슬라이드로 분할
      const bulletSlides = splitBulletsIntoSlides(section, sectionIndex);
      slides.push(...bulletSlides);
  }

  return slides;
}

/**
 * 일반 콘텐츠 슬라이드 생성
 */
function createContentSlide(section: ParsedSection, sectionIndex: number): SlideSpec {
  return {
    type: 'content',
    title: section.title,
    content: {
      bullets: section.content.bullets.slice(0, 5),
      paragraphs: section.content.paragraphs,
    },
    sectionIndex,
    keyMessage: section.keyMessage,
  };
}

/**
 * 불릿을 여러 슬라이드로 분할
 */
function splitBulletsIntoSlides(section: ParsedSection, sectionIndex: number): SlideSpec[] {
  const slides: SlideSpec[] = [];
  const bullets = section.content.bullets;
  const maxPerSlide = 5;

  if (bullets.length <= maxPerSlide) {
    slides.push(createContentSlide(section, sectionIndex));
  } else {
    // 여러 슬라이드로 분할
    for (let i = 0; i < bullets.length; i += maxPerSlide) {
      const slideBullets = bullets.slice(i, i + maxPerSlide);
      const slideNumber = Math.floor(i / maxPerSlide) + 1;
      const totalSlides = Math.ceil(bullets.length / maxPerSlide);

      slides.push({
        type: 'content',
        title: totalSlides > 1 ? `${section.title} (${slideNumber}/${totalSlides})` : section.title,
        content: {
          bullets: slideBullets,
        },
        sectionIndex,
        keyMessage: i === 0 ? section.keyMessage : undefined,
      });
    }
  }

  return slides;
}

/**
 * 2단 비교 슬라이드 생성
 */
function createTwoColumnSlide(section: ParsedSection, sectionIndex: number): SlideSpec {
  const bullets = section.content.bullets;
  const midPoint = Math.ceil(bullets.length / 2);

  // 비교 키워드로 분할 시도
  const comparisonSplit = splitByComparison(bullets);

  if (comparisonSplit) {
    return {
      type: 'twoColumn',
      title: section.title,
      content: {
        leftBullets: comparisonSplit.left,
        rightBullets: comparisonSplit.right,
      },
      sectionIndex,
      keyMessage: section.keyMessage,
    };
  }

  // 단순 분할
  return {
    type: 'twoColumn',
    title: section.title,
    content: {
      leftBullets: bullets.slice(0, midPoint),
      rightBullets: bullets.slice(midPoint),
    },
    sectionIndex,
    keyMessage: section.keyMessage,
  };
}

/**
 * 비교 키워드 기반 분할
 */
function splitByComparison(bullets: BulletItem[]): { left: BulletItem[]; right: BulletItem[] } | null {
  const leftKeywords = ['장점', '전', '이전', 'Before', '과거', '기존'];
  const rightKeywords = ['단점', '후', '이후', 'After', '현재', '미래', '개선'];

  const left: BulletItem[] = [];
  const right: BulletItem[] = [];

  for (const bullet of bullets) {
    const text = bullet.text;
    if (leftKeywords.some(kw => text.includes(kw))) {
      left.push(bullet);
    } else if (rightKeywords.some(kw => text.includes(kw))) {
      right.push(bullet);
    }
  }

  // 양쪽 모두 항목이 있어야 함
  if (left.length > 0 && right.length > 0) {
    return { left, right };
  }

  return null;
}

/**
 * 타임라인 슬라이드 생성
 */
function createTimelineSlide(section: ParsedSection, sectionIndex: number): SlideSpec {
  const timelineItems: TimelineItem[] = [];

  // 불릿에서 타임라인 아이템 추출
  for (const bullet of section.content.bullets) {
    // 연도 패턴 추출
    const yearMatch = bullet.text.match(/\b(19|20)\d{2}년?\b/);
    // 단계 패턴 추출
    const stepMatch = bullet.text.match(/(\d+단계|Phase\s*\d+|Step\s*\d+)/i);

    if (yearMatch) {
      timelineItems.push({
        label: yearMatch[0],
        title: bullet.text.replace(yearMatch[0], '').trim(),
      });
    } else if (stepMatch) {
      timelineItems.push({
        label: stepMatch[1],
        title: bullet.text.replace(stepMatch[0], '').trim(),
      });
    } else if (bullet.isNumbered) {
      timelineItems.push({
        label: `${bullet.number}`,
        title: bullet.text,
      });
    }
  }

  // 타임라인 아이템이 충분하지 않으면 content로 폴백
  if (timelineItems.length < 2) {
    return createContentSlide(section, sectionIndex);
  }

  return {
    type: 'timeline',
    title: section.title,
    content: {
      timelineItems,
    },
    sectionIndex,
    keyMessage: section.keyMessage,
  };
}

/**
 * 통계 슬라이드 생성
 */
function createStatsSlide(section: ParsedSection, sectionIndex: number): SlideSpec {
  return {
    type: 'stats',
    title: section.title,
    content: {
      stats: section.content.stats.slice(0, 4), // 최대 4개
      bullets: section.content.bullets.slice(0, 2), // 보조 불릿
    },
    sectionIndex,
    keyMessage: section.keyMessage,
  };
}

/**
 * 인용문 슬라이드 생성
 */
function createQuoteSlide(section: ParsedSection): SlideSpec {
  const quote = section.content.quotes[0];

  return {
    type: 'quote',
    title: section.title,
    content: {
      quote,
    },
  };
}

/**
 * 이미지+텍스트 슬라이드 생성
 */
function createImageTextSlide(section: ParsedSection, sectionIndex: number): SlideSpec {
  return {
    type: 'imageText',
    title: section.title,
    content: {
      paragraphs: section.content.paragraphs,
      imagePlaceholder: true,
    },
    sectionIndex,
    keyMessage: section.keyMessage,
  };
}

/**
 * 요약 슬라이드 생성
 */
function createSummarySlide(summaryPoints: string[]): SlideSpec {
  return {
    type: 'summary',
    title: '핵심 요약',
    content: {
      summaryPoints: summaryPoints.slice(0, 5),
    },
  };
}

/**
 * 클로징 슬라이드 생성
 */
function createClosingSlide(): SlideSpec {
  return {
    type: 'closing',
    title: '감사합니다',
    subtitle: 'Thank You',
    content: {},
  };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 슬라이드 타입 한글명 반환
 */
export function getSlideTypeName(type: SlideLayoutType): string {
  const names: Record<SlideLayoutType, string> = {
    title: '표지',
    agenda: '목차',
    content: '콘텐츠',
    twoColumn: '2단 비교',
    timeline: '타임라인',
    stats: '통계',
    quote: '인용문',
    imageText: '이미지+텍스트',
    summary: '요약',
    closing: '마무리',
  };
  return names[type] || type;
}

/**
 * 슬라이드 타입 아이콘 반환 (이모지)
 */
export function getSlideTypeIcon(type: SlideLayoutType): string {
  const icons: Record<SlideLayoutType, string> = {
    title: '📋',
    agenda: '📑',
    content: '📝',
    twoColumn: '⚖️',
    timeline: '📅',
    stats: '📊',
    quote: '💬',
    imageText: '🖼️',
    summary: '📌',
    closing: '🎬',
  };
  return icons[type] || '📄';
}

/**
 * 슬라이드 스펙 검증
 */
export function validateSlideSpec(spec: SlideSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!spec.title && spec.type !== 'closing') {
    errors.push('제목이 없습니다');
  }

  if (spec.type === 'content' && (!spec.content.bullets || spec.content.bullets.length === 0)) {
    if (!spec.content.paragraphs || spec.content.paragraphs.length === 0) {
      errors.push('콘텐츠가 없습니다');
    }
  }

  if (spec.type === 'twoColumn') {
    if (!spec.content.leftBullets || !spec.content.rightBullets) {
      errors.push('2단 콘텐츠가 불완전합니다');
    }
  }

  if (spec.type === 'quote' && !spec.content.quote) {
    errors.push('인용문이 없습니다');
  }

  if (spec.type === 'stats' && (!spec.content.stats || spec.content.stats.length === 0)) {
    errors.push('통계 데이터가 없습니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
