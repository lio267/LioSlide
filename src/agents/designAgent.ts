/**
 * Design Agent - 슬라이드별 디자인 속성 결정
 *
 * 역할:
 * - Outline Agent의 출력을 받아 레이아웃/색상/밀도 등 시각적 요소 결정
 * - 테마 참조를 통한 색상 결정 (hex 직접 지정 금지)
 * - 슬라이드별 병렬 처리 지원
 *
 * ⚠️ 원칙: 이 에이전트는 절대 좌표를 계산하지 않습니다 (Layout Engine 담당)
 */

import type {
  SlideOutline,
  PresentationTone,
} from '../types/agents';
import type { SlideType } from '../types/slideSpec';

// ============================================
// 1. 타입 정의
// ============================================

/**
 * 레이아웃 힌트 타입
 */
export type LayoutHint =
  | 'balanced'      // 균형 잡힌 배치
  | 'left-heavy'    // 왼쪽 강조
  | 'right-heavy'   // 오른쪽 강조
  | 'top-heavy'     // 상단 강조
  | 'bottom-heavy'  // 하단 강조
  | 'centered';     // 중앙 집중

/**
 * 콘텐츠 밀도 타입
 */
export type Density = 'sparse' | 'normal' | 'dense';

/**
 * 배경 스타일 타입
 */
export type BackgroundStyle = 'solid' | 'gradient' | 'image';

/**
 * 이미지 우선 영역 타입
 */
export type ImagePriority = 'left' | 'right' | 'top' | 'bottom' | 'background' | null;

/**
 * 테마 색상 키 (hex 대신 사용)
 */
export type ThemeColorKey =
  | 'primary'
  | 'primary-dark'
  | 'primary-light'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'surface'
  | 'surfaceForeground';

/**
 * 슬라이드 제약 조건
 */
export interface SlideConstraints {
  layoutHint: LayoutHint;
  density: Density;
  imagePriority: ImagePriority;
  useAccentColor: boolean;
  backgroundStyle: BackgroundStyle;
}

/**
 * 테마 오버라이드 (브랜딩용)
 */
export interface ThemeOverride {
  colors?: {
    primary?: string;      // hex
    primaryDark?: string;  // hex
    secondary?: string;    // hex
  };
}

/**
 * 브랜딩 정보
 */
export interface BrandingInfo {
  companyName: string;
  primaryColor?: string;    // hex (6자리)
  secondaryColor?: string;  // hex (6자리)
  logoUrl?: string;
  fontPreference?: string;
}

/**
 * Design Agent 입력
 */
export interface DesignAgentInput {
  slideOutline: SlideOutline;
  userInput: {
    tone: PresentationTone;
    branding?: BrandingInfo;
  };
  slideIndex: number;
}

/**
 * Design Agent 출력
 */
export interface DesignAgentOutput {
  slideIndex: number;
  constraints: SlideConstraints;
  themeOverride?: ThemeOverride;
}

/**
 * 전체 슬라이드 디자인 생성 입력
 */
export interface DesignGenerationInput {
  outlines: SlideOutline[];
  userInput: {
    tone: PresentationTone;
    branding?: BrandingInfo;
  };
}

/**
 * LLM 디자인 생성기 타입
 */
export type DesignGenerator = (
  prompt: string,
  systemPrompt: string
) => Promise<string>;

/**
 * Design Agent 옵션
 */
export interface DesignAgentOptions {
  /** LLM 디자인 생성기 (외부 주입) */
  generator?: DesignGenerator;
  /** 디버그 모드 */
  debug?: boolean;
  /** 병렬 처리 동시성 제한 */
  concurrency?: number;
}

// ============================================
// 2. 상수 정의
// ============================================

/**
 * 슬라이드 타입별 권장 레이아웃
 */
export const RECOMMENDED_LAYOUTS: Record<SlideType, LayoutHint> = {
  title: 'centered',
  sectionTitle: 'centered',
  agenda: 'balanced',
  content: 'balanced',
  twoColumn: 'balanced',      // Layout Engine이 처리
  threeColumn: 'balanced',    // Layout Engine이 처리
  comparison: 'balanced',     // Layout Engine이 처리
  chart: 'centered',
  imageHero: 'left-heavy',    // 이미지 위치에 따라 변동
  imageGallery: 'balanced',
  quote: 'centered',
  timeline: 'balanced',
  process: 'balanced',
  summary: 'balanced',
  closing: 'centered',
  qna: 'centered',
};

/**
 * 슬라이드 타입별 권장 밀도
 */
export const RECOMMENDED_DENSITY: Record<SlideType, Density> = {
  title: 'sparse',
  sectionTitle: 'sparse',
  agenda: 'sparse',
  content: 'normal',
  twoColumn: 'normal',
  threeColumn: 'normal',
  comparison: 'normal',
  chart: 'normal',
  imageHero: 'sparse',
  imageGallery: 'sparse',
  quote: 'sparse',
  timeline: 'normal',
  process: 'normal',
  summary: 'normal',
  closing: 'sparse',
  qna: 'sparse',
};

/**
 * 슬라이드 타입별 권장 배경 스타일
 */
export const RECOMMENDED_BACKGROUND: Record<SlideType, BackgroundStyle> = {
  title: 'gradient',
  sectionTitle: 'gradient',
  agenda: 'solid',
  content: 'solid',
  twoColumn: 'solid',
  threeColumn: 'solid',
  comparison: 'solid',
  chart: 'solid',
  imageHero: 'image',
  imageGallery: 'solid',
  quote: 'gradient',
  timeline: 'solid',
  process: 'solid',
  summary: 'solid',
  closing: 'gradient',
  qna: 'solid',
};

/**
 * 톤별 디자인 특성
 */
export const TONE_DESIGN_CHARACTERISTICS: Record<PresentationTone, {
  preferGradient: boolean;
  accentFrequency: 'low' | 'medium' | 'high';
  densityBias: -1 | 0 | 1;  // sparse 방향(-1), 유지(0), dense 방향(1)
  description: string;
}> = {
  professional: {
    preferGradient: false,
    accentFrequency: 'low',
    densityBias: 0,
    description: '깔끔하고 절제된 디자인',
  },
  casual: {
    preferGradient: false,
    accentFrequency: 'medium',
    densityBias: 0,
    description: '친근하고 편안한 디자인',
  },
  academic: {
    preferGradient: false,
    accentFrequency: 'low',
    densityBias: 1,
    description: '정돈되고 체계적인 디자인',
  },
  creative: {
    preferGradient: true,
    accentFrequency: 'high',
    densityBias: -1,
    description: '창의적이고 시각적인 디자인',
  },
  minimal: {
    preferGradient: false,
    accentFrequency: 'low',
    densityBias: -1,
    description: '극도로 간결한 디자인',
  },
  energetic: {
    preferGradient: true,
    accentFrequency: 'high',
    densityBias: 0,
    description: '역동적이고 강렬한 디자인',
  },
  luxury: {
    preferGradient: true,
    accentFrequency: 'low',
    densityBias: -1,
    description: '고급스럽고 우아한 디자인',
  },
};

/**
 * 밀도별 블록/불릿 기준
 */
export const DENSITY_THRESHOLDS = {
  sparse: { maxBlocks: 1, maxBullets: 2 },
  normal: { maxBlocks: 2, maxBullets: 4 },
  dense: { maxBlocks: 3, maxBullets: 5 },
} as const;

// ============================================
// 3. 유틸리티 함수
// ============================================

/**
 * 콘텐츠 힌트 수에 따른 밀도 추정
 */
export function estimateDensityFromHints(
  contentHints: string[],
  estimatedDensity: Density
): Density {
  const hintCount = contentHints.length;

  // Outline Agent 추정치가 있으면 검증
  if (estimatedDensity === 'dense' && hintCount <= 2) {
    return 'normal';  // 실제 콘텐츠가 적으면 조정
  }

  if (estimatedDensity === 'sparse' && hintCount >= 4) {
    return 'normal';  // 실제 콘텐츠가 많으면 조정
  }

  // 힌트 수 기반 추정
  if (hintCount <= 2) return 'sparse';
  if (hintCount <= 4) return 'normal';
  return 'dense';
}

/**
 * 톤에 따른 밀도 조정
 */
export function adjustDensityByTone(
  density: Density,
  tone: PresentationTone
): Density {
  const bias = TONE_DESIGN_CHARACTERISTICS[tone].densityBias;

  if (bias === 0) return density;

  const densityOrder: Density[] = ['sparse', 'normal', 'dense'];
  const currentIndex = densityOrder.indexOf(density);
  const newIndex = Math.max(0, Math.min(2, currentIndex + bias));

  return densityOrder[newIndex];
}

/**
 * 강조색 사용 여부 결정
 */
export function shouldUseAccentColor(
  slideType: SlideType,
  hasKeyMessage: boolean,
  tone: PresentationTone
): boolean {
  const { accentFrequency } = TONE_DESIGN_CHARACTERISTICS[tone];

  // 특정 타입에서는 강조색 금지
  if (['title', 'closing', 'qna'].includes(slideType)) {
    return false;
  }

  // 핵심 메시지가 있을 때만 강조 고려
  if (!hasKeyMessage) {
    return false;
  }

  // 톤별 빈도에 따라 결정
  switch (accentFrequency) {
    case 'high':
      return true;
    case 'medium':
      return slideType === 'content' || slideType === 'summary';
    case 'low':
      return slideType === 'summary';
    default:
      return false;
  }
}

/**
 * 배경 스타일 결정
 */
export function determineBackgroundStyle(
  slideType: SlideType,
  tone: PresentationTone
): BackgroundStyle {
  const { preferGradient } = TONE_DESIGN_CHARACTERISTICS[tone];
  const recommended = RECOMMENDED_BACKGROUND[slideType];

  // 톤이 그라데이션을 선호하지 않으면 solid로 변환
  if (!preferGradient && recommended === 'gradient') {
    return 'solid';
  }

  return recommended;
}

/**
 * 이미지 우선 영역 결정
 */
export function determineImagePriority(
  slideType: SlideType,
  layoutHint: LayoutHint
): ImagePriority {
  // 이미지 관련 타입
  if (slideType === 'imageHero') {
    return layoutHint === 'left-heavy' ? 'left' : 'right';
  }

  if (slideType === 'imageGallery') {
    return 'background';
  }

  return null;
}

/**
 * 브랜딩 색상 검증 (대비 확인)
 */
export function validateBrandingColor(hex: string): boolean {
  // 기본 형식 검증
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return false;
  }

  // 흰 배경과의 대비 계산 (간단 버전)
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // 상대 밝기 계산
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // 너무 밝은 색상 (흰 배경에서 가독성 문제)
  return luminance < 0.85;
}

/**
 * 어두운 버전의 색상 생성 (브랜딩용)
 */
export function darkenColor(hex: string, amount: number = 0.2): string {
  const r = Math.max(0, Math.round(parseInt(hex.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(4, 6), 16) * (1 - amount)));

  return [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

// ============================================
// 4. 슬라이드 타입별 디자인 생성기
// ============================================

type SlideDesignGenerator = (
  outline: SlideOutline,
  tone: PresentationTone,
  branding?: BrandingInfo
) => DesignAgentOutput;

/**
 * 타이틀/표지 슬라이드 디자인
 */
function generateTitleDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'centered',
      density: 'sparse',
      imagePriority: null,
      useAccentColor: false,
      backgroundStyle: determineBackgroundStyle('title', tone),
    },
    themeOverride: branding?.primaryColor
      ? createThemeOverride(branding)
      : undefined,
  };
}

/**
 * 목차 슬라이드 디자인
 */
function generateAgendaDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'balanced',
      density: 'sparse',
      imagePriority: null,
      useAccentColor: false,
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 일반 콘텐츠 슬라이드 디자인
 */
function generateContentDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  const baseDensity = estimateDensityFromHints(
    outline.contentHints,
    outline.estimatedDensity
  );
  const density = adjustDensityByTone(baseDensity, tone);

  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: RECOMMENDED_LAYOUTS.content,
      density,
      imagePriority: null,
      useAccentColor: shouldUseAccentColor('content', !!outline.keyMessage, tone),
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 2단 레이아웃 슬라이드 디자인
 */
function generateTwoColumnDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  const baseDensity = estimateDensityFromHints(
    outline.contentHints,
    outline.estimatedDensity
  );
  const density = adjustDensityByTone(baseDensity, tone);

  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'balanced',  // Layout Engine이 2단 처리
      density,
      imagePriority: 'right',  // 이미지가 있으면 우측 우선
      useAccentColor: shouldUseAccentColor('twoColumn', !!outline.keyMessage, tone),
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 비교 슬라이드 디자인
 */
function generateComparisonDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'balanced',
      density: 'normal',
      imagePriority: null,
      useAccentColor: true,  // 비교 시 강조색 유용
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 차트 슬라이드 디자인
 */
function generateChartDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'centered',
      density: 'normal',
      imagePriority: null,
      useAccentColor: shouldUseAccentColor('chart', !!outline.keyMessage, tone),
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 이미지 히어로 슬라이드 디자인
 */
function generateImageHeroDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  // 콘텐츠 양에 따라 레이아웃 결정
  const layoutHint: LayoutHint =
    outline.contentHints.length > 2 ? 'left-heavy' : 'right-heavy';

  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint,
      density: 'sparse',
      imagePriority: layoutHint === 'left-heavy' ? 'left' : 'right',
      useAccentColor: false,
      backgroundStyle: 'image',
    },
  };
}

/**
 * 인용 슬라이드 디자인
 */
function generateQuoteDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'centered',
      density: 'sparse',
      imagePriority: null,
      useAccentColor: false,
      backgroundStyle: determineBackgroundStyle('quote', tone),
    },
  };
}

/**
 * 타임라인 슬라이드 디자인
 */
function generateTimelineDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  const density = outline.contentHints.length > 4 ? 'dense' : 'normal';

  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'balanced',
      density: adjustDensityByTone(density, tone),
      imagePriority: null,
      useAccentColor: true,  // 타임라인 포인트 강조
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 프로세스 슬라이드 디자인
 */
function generateProcessDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'balanced',
      density: 'normal',
      imagePriority: null,
      useAccentColor: true,  // 단계 강조
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 요약 슬라이드 디자인
 */
function generateSummaryDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'balanced',
      density: 'normal',
      imagePriority: null,
      useAccentColor: shouldUseAccentColor('summary', !!outline.keyMessage, tone),
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 마무리 슬라이드 디자인
 */
function generateClosingDesign(
  outline: SlideOutline,
  tone: PresentationTone,
  branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'centered',
      density: 'sparse',
      imagePriority: null,
      useAccentColor: false,
      backgroundStyle: determineBackgroundStyle('closing', tone),
    },
    themeOverride: branding?.primaryColor
      ? createThemeOverride(branding)
      : undefined,
  };
}

/**
 * Q&A 슬라이드 디자인
 */
function generateQnADesign(
  outline: SlideOutline,
  tone: PresentationTone,
  _branding?: BrandingInfo
): DesignAgentOutput {
  return {
    slideIndex: outline.order - 1,
    constraints: {
      layoutHint: 'centered',
      density: 'sparse',
      imagePriority: null,
      useAccentColor: false,
      backgroundStyle: 'solid',
    },
  };
}

/**
 * 브랜딩 기반 테마 오버라이드 생성
 */
function createThemeOverride(branding: BrandingInfo): ThemeOverride | undefined {
  if (!branding.primaryColor) return undefined;

  const primaryColor = branding.primaryColor.replace('#', '');

  if (!validateBrandingColor(primaryColor)) {
    return undefined;  // 유효하지 않은 색상
  }

  return {
    colors: {
      primary: primaryColor,
      primaryDark: darkenColor(primaryColor, 0.25),
      secondary: branding.secondaryColor?.replace('#', ''),
    },
  };
}

/**
 * 슬라이드 타입별 생성기 매핑
 */
const DESIGN_GENERATORS: Record<SlideType, SlideDesignGenerator> = {
  title: generateTitleDesign,
  sectionTitle: generateTitleDesign,
  agenda: generateAgendaDesign,
  content: generateContentDesign,
  twoColumn: generateTwoColumnDesign,
  threeColumn: generateTwoColumnDesign,
  comparison: generateComparisonDesign,
  chart: generateChartDesign,
  imageHero: generateImageHeroDesign,
  imageGallery: generateImageHeroDesign,
  quote: generateQuoteDesign,
  timeline: generateTimelineDesign,
  process: generateProcessDesign,
  summary: generateSummaryDesign,
  closing: generateClosingDesign,
  qna: generateQnADesign,
};

// ============================================
// 5. Design Agent 클래스
// ============================================

export class DesignAgent {
  private options: DesignAgentOptions;
  private logs: string[] = [];

  constructor(options: DesignAgentOptions = {}) {
    this.options = {
      concurrency: 5,
      debug: false,
      ...options,
    };
  }

  /**
   * 단일 슬라이드 디자인 결정
   */
  async generateSlideDesign(input: DesignAgentInput): Promise<DesignAgentOutput> {
    const { slideOutline, userInput, slideIndex } = input;
    const { tone, branding } = userInput;

    this.log(`🎨 슬라이드 ${slideIndex + 1} (${slideOutline.type}) 디자인 결정 시작`);

    // LLM 생성기가 있으면 사용
    if (this.options.generator) {
      try {
        return await this.generateWithLLM(input);
      } catch (error) {
        this.log(`⚠️ LLM 생성 실패, 로컬 생성으로 폴백: ${error}`, 'warn');
      }
    }

    // 로컬 생성 (타입별 생성기 사용)
    const generator = DESIGN_GENERATORS[slideOutline.type] || generateContentDesign;
    const result = generator(slideOutline, tone, branding);

    this.log(`✅ 슬라이드 ${slideIndex + 1} 디자인 결정 완료: ${result.constraints.layoutHint}, ${result.constraints.density}`);

    return result;
  }

  /**
   * LLM을 사용한 디자인 결정
   */
  private async generateWithLLM(input: DesignAgentInput): Promise<DesignAgentOutput> {
    const { slideOutline, userInput, slideIndex } = input;
    const { tone, branding } = userInput;
    const toneCharacteristics = TONE_DESIGN_CHARACTERISTICS[tone];

    const systemPrompt = `당신은 프레젠테이션 디자인 전문가입니다.

적용할 톤 스타일:
- 톤: ${tone}
- 특징: ${toneCharacteristics.description}
- 그라데이션 선호: ${toneCharacteristics.preferGradient ? '예' : '아니오'}
- 강조색 빈도: ${toneCharacteristics.accentFrequency}

디자인 원칙:
1. 레이아웃 힌트만 결정 (절대 좌표 금지)
2. 색상은 테마 키 참조 (hex 직접 지정 금지)
3. 텍스트-배경 대비 4.5:1 이상 유지
4. 강조색은 슬라이드당 최대 2개 요소만

가능한 layoutHint 값: balanced, left-heavy, right-heavy, top-heavy, bottom-heavy, centered
가능한 density 값: sparse, normal, dense
가능한 backgroundStyle 값: solid, gradient, image`;

    const userPrompt = `다음 슬라이드의 디자인 속성을 JSON 형식으로 결정하세요:

슬라이드 타입: ${slideOutline.type}
제목: ${slideOutline.title}
핵심 메시지: ${slideOutline.keyMessage}
콘텐츠 힌트 수: ${slideOutline.contentHints.length}개
추정 밀도: ${slideOutline.estimatedDensity}
${branding ? `브랜딩: ${branding.companyName}` : ''}

JSON 형식:
{
  "layoutHint": "balanced",
  "density": "normal",
  "backgroundStyle": "solid",
  "useAccentColor": false,
  "imagePriority": null
}`;

    const response = await this.options.generator!(userPrompt, systemPrompt);

    // JSON 파싱
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          slideIndex,
          constraints: this.validateConstraints(parsed),
          themeOverride: branding?.primaryColor
            ? createThemeOverride(branding)
            : undefined,
        };
      }
    } catch (parseError) {
      this.log(`⚠️ JSON 파싱 실패: ${parseError}`, 'warn');
    }

    // 파싱 실패 시 로컬 생성으로 폴백
    const generator = DESIGN_GENERATORS[slideOutline.type] || generateContentDesign;
    return generator(slideOutline, tone, branding);
  }

  /**
   * 제약 조건 유효성 검사 및 정규화
   */
  private validateConstraints(parsed: Record<string, unknown>): SlideConstraints {
    const validLayoutHints: LayoutHint[] = [
      'balanced', 'left-heavy', 'right-heavy', 'top-heavy', 'bottom-heavy', 'centered'
    ];
    const validDensities: Density[] = ['sparse', 'normal', 'dense'];
    const validBackgroundStyles: BackgroundStyle[] = ['solid', 'gradient', 'image'];
    const validImagePriorities: ImagePriority[] = ['left', 'right', 'top', 'bottom', 'background', null];

    return {
      layoutHint: validLayoutHints.includes(parsed.layoutHint as LayoutHint)
        ? (parsed.layoutHint as LayoutHint)
        : 'balanced',
      density: validDensities.includes(parsed.density as Density)
        ? (parsed.density as Density)
        : 'normal',
      backgroundStyle: validBackgroundStyles.includes(parsed.backgroundStyle as BackgroundStyle)
        ? (parsed.backgroundStyle as BackgroundStyle)
        : 'solid',
      useAccentColor: typeof parsed.useAccentColor === 'boolean'
        ? parsed.useAccentColor
        : false,
      imagePriority: validImagePriorities.includes(parsed.imagePriority as ImagePriority)
        ? (parsed.imagePriority as ImagePriority)
        : null,
    };
  }

  /**
   * 모든 슬라이드 디자인 병렬 생성
   */
  async generateAllDesigns(
    input: DesignGenerationInput
  ): Promise<DesignAgentOutput[]> {
    const { outlines, userInput } = input;

    this.log(`🚀 ${outlines.length}개 슬라이드 디자인 병렬 결정 시작`);

    // 동시성 제한을 위한 청크 분할
    const chunkSize = this.options.concurrency || 5;
    const results: DesignAgentOutput[] = [];

    for (let i = 0; i < outlines.length; i += chunkSize) {
      const chunk = outlines.slice(i, i + chunkSize);

      const chunkResults = await Promise.all(
        chunk.map((outline, index) =>
          this.generateSlideDesign({
            slideOutline: outline,
            userInput,
            slideIndex: i + index,
          })
        )
      );

      results.push(...chunkResults);

      this.log(`✅ 청크 ${Math.ceil((i + chunkSize) / chunkSize)}/${Math.ceil(outlines.length / chunkSize)} 완료`);
    }

    this.log(`🎉 전체 ${results.length}개 슬라이드 디자인 결정 완료`);

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
 * 디자인 생성 옵션
 */
export interface GenerateDesignOptions {
  /** LLM 생성기 */
  generator?: DesignGenerator;
  /** 병렬 처리 동시성 */
  concurrency?: number;
  /** 디버그 모드 */
  debug?: boolean;
}

/**
 * 모든 슬라이드 디자인 생성 (메인 진입점)
 *
 * @example
 * // 1. 기본 사용 (로컬 생성)
 * const designs = await generateAllSlideDesigns({
 *   outlines: outlineResult.outline,
 *   userInput: { tone: 'professional' }
 * });
 *
 * @example
 * // 2. 브랜딩 적용
 * const designs = await generateAllSlideDesigns({
 *   outlines,
 *   userInput: {
 *     tone: 'luxury',
 *     branding: {
 *       companyName: 'ACME Corp',
 *       primaryColor: '1a5fb4'
 *     }
 *   }
 * });
 *
 * @example
 * // 3. LLM 사용
 * const designs = await generateAllSlideDesigns(
 *   { outlines, userInput },
 *   {
 *     generator: async (prompt, system) => {
 *       return await callClaude(prompt, system);
 *     }
 *   }
 * );
 */
export async function generateAllSlideDesigns(
  input: DesignGenerationInput,
  options: GenerateDesignOptions = {}
): Promise<DesignAgentOutput[]> {
  const agent = new DesignAgent(options);
  return agent.generateAllDesigns(input);
}

/**
 * 단일 슬라이드 디자인 생성
 */
export async function generateSlideDesign(
  input: DesignAgentInput,
  options: GenerateDesignOptions = {}
): Promise<DesignAgentOutput> {
  const agent = new DesignAgent(options);
  return agent.generateSlideDesign(input);
}

/**
 * 디자인 출력에서 테마 색상 키 추출
 */
export function getRecommendedColorKey(
  constraints: SlideConstraints,
  element: 'text' | 'accent' | 'background'
): ThemeColorKey {
  if (element === 'background') {
    return 'surface';
  }

  if (element === 'accent' && constraints.useAccentColor) {
    return 'accent';
  }

  // 텍스트 색상: primary-dark 권장 (대비 확보)
  return 'primary-dark';
}

/**
 * 레이아웃 힌트를 Layout Engine 영역 비율로 변환
 */
export function layoutHintToRatio(hint: LayoutHint): { left: number; right: number } {
  switch (hint) {
    case 'left-heavy':
      return { left: 60, right: 40 };
    case 'right-heavy':
      return { left: 40, right: 60 };
    case 'centered':
    case 'balanced':
    default:
      return { left: 50, right: 50 };
  }
}
