/**
 * Style Guardian - PPT 스타일 린트 규칙
 * 
 * 이 파일은 Style Guardian 서브에이전트가 강제할 모든 규칙을 정의합니다.
 * 각 규칙은 고유 ID, 심각도, 검사 함수, 자동 수정 패치 생성 함수를 포함합니다.
 */

import { z } from 'zod';
import type {
  DeckSpec,
  SlideSpec,
  LayoutedSlide,
  LayoutedBlock,
  ContentBlock,
  BoundingBox,
  Theme,
} from './slideSpec';

// ============================================
// 1. 린트 규칙 타입 정의
// ============================================

export type RuleSeverity = 'error' | 'warning' | 'info';

export type RuleCategory =
  | 'margin'
  | 'typography'
  | 'density'
  | 'color'
  | 'overflow'
  | 'consistency'
  | 'accessibility';

export interface LintViolation {
  /** 규칙 ID */
  ruleId: string;
  
  /** 심각도 */
  severity: RuleSeverity;
  
  /** 카테고리 */
  category: RuleCategory;
  
  /** 슬라이드 인덱스 */
  slideIndex: number;
  
  /** 블록 인덱스 (해당되는 경우) */
  blockIndex?: number;
  
  /** 위반 메시지 */
  message: string;
  
  /** 상세 설명 */
  details?: string;
  
  /** 수정 제안 패치 */
  suggestedFix?: LintPatch;
}

export interface LintPatch {
  /** 패치 유형 */
  type: 'modify' | 'split' | 'remove' | 'rearrange';
  
  /** 패치 경로 (JSON Pointer 형식) */
  path: string;
  
  /** 패치 값 */
  value?: unknown;
  
  /** 패치 설명 */
  description: string;
}

export interface LintResult {
  /** 모든 위반 목록 */
  violations: LintViolation[];
  
  /** 에러 수 */
  errorCount: number;
  
  /** 경고 수 */
  warningCount: number;
  
  /** 정보 수 */
  infoCount: number;
  
  /** 린트 통과 여부 */
  passed: boolean;
  
  /** 린트 실행 시간 */
  executedAt: string;
}

// ============================================
// 2. 상수 정의 (규칙에서 사용)
// ============================================

export const CONSTANTS = {
  // 캔버스 크기 (16:9, inches)
  CANVAS_WIDTH: 13.333,
  CANVAS_HEIGHT: 7.5,
  
  // 마진 (inches)
  SAFE_MARGIN: 0.5,
  READABLE_MARGIN: 0.7,
  
  // 그리드
  GRID_COLUMNS: 12,
  GUTTER: 0.2,
  BASELINE_UNIT: 8, // pt
  
  // 폰트 크기 (pt)
  FONT_SIZE: {
    TITLE_MIN: 40,
    TITLE_MAX: 48,
    SECTION_TITLE_MIN: 32,
    SECTION_TITLE_MAX: 36,
    BODY_MIN: 18,
    BODY_MAX: 22,
    BODY_DEFAULT: 20,
    CAPTION_MIN: 12,
    CAPTION_MAX: 14,
    FOOTNOTE_MIN: 10,
    FOOTNOTE_MAX: 12,
    ABSOLUTE_MIN: 10, // 발표용 최소 폰트
  },
  
  // 행간
  LINE_HEIGHT: {
    TITLE_MIN: 1.05,
    TITLE_MAX: 1.15,
    BODY_MIN: 1.2,
    BODY_MAX: 1.35,
  },
  
  // 콘텐츠 밀도
  DENSITY: {
    MAX_BULLETS: 5,
    RECOMMENDED_BULLETS: 3,
    MAX_LINES_PER_BULLET: 1.5,
    LINE_LENGTH_MIN: 35,
    LINE_LENGTH_MAX: 60,
  },
  
  // 색상
  COLOR: {
    MAX_ACCENT_COLORS_PER_SLIDE: 2,
    MIN_CONTRAST_RATIO: 4.5, // WCAG AA 기준
  },
} as const;

// ============================================
// 3. 린트 규칙 정의
// ============================================

export const LINT_RULES = {
  // ==========================================
  // 마진 규칙 (MARGIN_*)
  // ==========================================
  
  MARGIN_SAFE_BOUNDARY: {
    id: 'MARGIN_SAFE_BOUNDARY',
    severity: 'error' as RuleSeverity,
    category: 'margin' as RuleCategory,
    description: '모든 콘텐츠는 안전 마진(0.5in) 내에 있어야 합니다',
    check: (block: LayoutedBlock, theme: Theme): boolean => {
      const safeMargin = theme.grid.safeMargin;
      const { x, y, width, height } = block.box;
      
      return (
        x >= safeMargin &&
        y >= safeMargin &&
        x + width <= CONSTANTS.CANVAS_WIDTH - safeMargin &&
        y + height <= CONSTANTS.CANVAS_HEIGHT - safeMargin
      );
    },
    fix: (block: LayoutedBlock, theme: Theme): LintPatch => {
      const safeMargin = theme.grid.safeMargin;
      const newBox = { ...block.box };
      
      if (newBox.x < safeMargin) newBox.x = safeMargin;
      if (newBox.y < safeMargin) newBox.y = safeMargin;
      if (newBox.x + newBox.width > CONSTANTS.CANVAS_WIDTH - safeMargin) {
        newBox.width = CONSTANTS.CANVAS_WIDTH - safeMargin - newBox.x;
      }
      if (newBox.y + newBox.height > CONSTANTS.CANVAS_HEIGHT - safeMargin) {
        newBox.height = CONSTANTS.CANVAS_HEIGHT - safeMargin - newBox.y;
      }
      
      return {
        type: 'modify',
        path: `/box`,
        value: newBox,
        description: '안전 마진 내로 요소 위치 조정',
      };
    },
  },
  
  MARGIN_READABLE_RECOMMENDED: {
    id: 'MARGIN_READABLE_RECOMMENDED',
    severity: 'warning' as RuleSeverity,
    category: 'margin' as RuleCategory,
    description: '가독성을 위해 0.7in 마진을 권장합니다',
    check: (block: LayoutedBlock, theme: Theme): boolean => {
      const margin = theme.grid.readableMargin;
      const { x, y, width, height } = block.box;
      
      return (
        x >= margin &&
        y >= margin &&
        x + width <= CONSTANTS.CANVAS_WIDTH - margin &&
        y + height <= CONSTANTS.CANVAS_HEIGHT - margin
      );
    },
    fix: (block: LayoutedBlock, theme: Theme): LintPatch => {
      const margin = theme.grid.readableMargin;
      const newBox = { ...block.box };
      
      if (newBox.x < margin) newBox.x = margin;
      if (newBox.y < margin) newBox.y = margin;
      if (newBox.x + newBox.width > CONSTANTS.CANVAS_WIDTH - margin) {
        newBox.width = CONSTANTS.CANVAS_WIDTH - margin - newBox.x;
      }
      if (newBox.y + newBox.height > CONSTANTS.CANVAS_HEIGHT - margin) {
        newBox.height = CONSTANTS.CANVAS_HEIGHT - margin - newBox.y;
      }
      
      return {
        type: 'modify',
        path: `/box`,
        value: newBox,
        description: '가독성 마진(0.7in) 내로 요소 위치 조정',
      };
    },
  },
  
  // ==========================================
  // 타이포그래피 규칙 (TYPO_*)
  // ==========================================
  
  TYPO_TITLE_SIZE: {
    id: 'TYPO_TITLE_SIZE',
    severity: 'error' as RuleSeverity,
    category: 'typography' as RuleCategory,
    description: '제목 폰트 크기는 40-48pt 범위여야 합니다',
    check: (fontSize: number): boolean => {
      return fontSize >= CONSTANTS.FONT_SIZE.TITLE_MIN &&
             fontSize <= CONSTANTS.FONT_SIZE.TITLE_MAX;
    },
    fix: (fontSize: number): LintPatch => ({
      type: 'modify',
      path: '/fontSize',
      value: Math.max(CONSTANTS.FONT_SIZE.TITLE_MIN, 
             Math.min(CONSTANTS.FONT_SIZE.TITLE_MAX, fontSize)),
      description: '제목 폰트 크기를 40-48pt 범위로 조정',
    }),
  },
  
  TYPO_SECTION_TITLE_SIZE: {
    id: 'TYPO_SECTION_TITLE_SIZE',
    severity: 'error' as RuleSeverity,
    category: 'typography' as RuleCategory,
    description: '섹션 제목 폰트 크기는 32-36pt 범위여야 합니다',
    check: (fontSize: number): boolean => {
      return fontSize >= CONSTANTS.FONT_SIZE.SECTION_TITLE_MIN &&
             fontSize <= CONSTANTS.FONT_SIZE.SECTION_TITLE_MAX;
    },
    fix: (fontSize: number): LintPatch => ({
      type: 'modify',
      path: '/fontSize',
      value: Math.max(CONSTANTS.FONT_SIZE.SECTION_TITLE_MIN,
             Math.min(CONSTANTS.FONT_SIZE.SECTION_TITLE_MAX, fontSize)),
      description: '섹션 제목 폰트 크기를 32-36pt 범위로 조정',
    }),
  },
  
  TYPO_BODY_SIZE: {
    id: 'TYPO_BODY_SIZE',
    severity: 'error' as RuleSeverity,
    category: 'typography' as RuleCategory,
    description: '본문 폰트 크기는 18-22pt 범위여야 합니다',
    check: (fontSize: number): boolean => {
      return fontSize >= CONSTANTS.FONT_SIZE.BODY_MIN &&
             fontSize <= CONSTANTS.FONT_SIZE.BODY_MAX;
    },
    fix: (fontSize: number): LintPatch => ({
      type: 'modify',
      path: '/fontSize',
      value: Math.max(CONSTANTS.FONT_SIZE.BODY_MIN,
             Math.min(CONSTANTS.FONT_SIZE.BODY_MAX, fontSize)),
      description: '본문 폰트 크기를 18-22pt 범위로 조정',
    }),
  },
  
  TYPO_MIN_FONT_SIZE: {
    id: 'TYPO_MIN_FONT_SIZE',
    severity: 'error' as RuleSeverity,
    category: 'typography' as RuleCategory,
    description: `발표용 최소 폰트 크기는 ${CONSTANTS.FONT_SIZE.ABSOLUTE_MIN}pt입니다`,
    check: (fontSize: number): boolean => {
      return fontSize >= CONSTANTS.FONT_SIZE.ABSOLUTE_MIN;
    },
    fix: (): LintPatch => ({
      type: 'modify',
      path: '/fontSize',
      value: CONSTANTS.FONT_SIZE.ABSOLUTE_MIN,
      description: `폰트 크기를 최소 ${CONSTANTS.FONT_SIZE.ABSOLUTE_MIN}pt로 조정`,
    }),
  },
  
  TYPO_LINE_HEIGHT_TITLE: {
    id: 'TYPO_LINE_HEIGHT_TITLE',
    severity: 'warning' as RuleSeverity,
    category: 'typography' as RuleCategory,
    description: '제목 행간은 1.05-1.15 범위를 권장합니다',
    check: (lineHeight: number): boolean => {
      return lineHeight >= CONSTANTS.LINE_HEIGHT.TITLE_MIN &&
             lineHeight <= CONSTANTS.LINE_HEIGHT.TITLE_MAX;
    },
    fix: (lineHeight: number): LintPatch => ({
      type: 'modify',
      path: '/lineHeight',
      value: Math.max(CONSTANTS.LINE_HEIGHT.TITLE_MIN,
             Math.min(CONSTANTS.LINE_HEIGHT.TITLE_MAX, lineHeight)),
      description: '제목 행간을 1.05-1.15 범위로 조정',
    }),
  },
  
  TYPO_LINE_HEIGHT_BODY: {
    id: 'TYPO_LINE_HEIGHT_BODY',
    severity: 'warning' as RuleSeverity,
    category: 'typography' as RuleCategory,
    description: '본문 행간은 1.2-1.35 범위를 권장합니다',
    check: (lineHeight: number): boolean => {
      return lineHeight >= CONSTANTS.LINE_HEIGHT.BODY_MIN &&
             lineHeight <= CONSTANTS.LINE_HEIGHT.BODY_MAX;
    },
    fix: (lineHeight: number): LintPatch => ({
      type: 'modify',
      path: '/lineHeight',
      value: Math.max(CONSTANTS.LINE_HEIGHT.BODY_MIN,
             Math.min(CONSTANTS.LINE_HEIGHT.BODY_MAX, lineHeight)),
      description: '본문 행간을 1.2-1.35 범위로 조정',
    }),
  },
  
  TYPO_LINE_LENGTH: {
    id: 'TYPO_LINE_LENGTH',
    severity: 'warning' as RuleSeverity,
    category: 'typography' as RuleCategory,
    description: '본문 한 줄 길이는 35-60자를 권장합니다',
    check: (charCount: number): boolean => {
      return charCount >= CONSTANTS.DENSITY.LINE_LENGTH_MIN &&
             charCount <= CONSTANTS.DENSITY.LINE_LENGTH_MAX;
    },
    fix: (charCount: number): LintPatch => {
      if (charCount > CONSTANTS.DENSITY.LINE_LENGTH_MAX) {
        return {
          type: 'modify',
          path: '/constraints/layoutHint',
          value: 'twoColumn',
          description: '너무 긴 줄은 2단 레이아웃으로 전환 권장',
        };
      }
      return {
        type: 'modify',
        path: '/box/width',
        value: null,
        description: '텍스트 박스 너비 조정 필요',
      };
    },
  },
  
  // ==========================================
  // 콘텐츠 밀도 규칙 (DENSITY_*)
  // ==========================================
  
  DENSITY_MAX_BULLETS: {
    id: 'DENSITY_MAX_BULLETS',
    severity: 'error' as RuleSeverity,
    category: 'density' as RuleCategory,
    description: `한 슬라이드에 불릿은 최대 ${CONSTANTS.DENSITY.MAX_BULLETS}개입니다`,
    check: (bulletCount: number): boolean => {
      return bulletCount <= CONSTANTS.DENSITY.MAX_BULLETS;
    },
    fix: (bulletCount: number, slide: SlideSpec): LintPatch => ({
      type: 'split',
      path: '',
      value: {
        splitAt: CONSTANTS.DENSITY.MAX_BULLETS,
        createNewSlide: true,
      },
      description: `${bulletCount}개 불릿을 ${Math.ceil(bulletCount / CONSTANTS.DENSITY.MAX_BULLETS)}개 슬라이드로 분할`,
    }),
  },
  
  DENSITY_RECOMMENDED_BULLETS: {
    id: 'DENSITY_RECOMMENDED_BULLETS',
    severity: 'warning' as RuleSeverity,
    category: 'density' as RuleCategory,
    description: `가독성을 위해 불릿 ${CONSTANTS.DENSITY.RECOMMENDED_BULLETS}개 이하를 권장합니다`,
    check: (bulletCount: number): boolean => {
      return bulletCount <= CONSTANTS.DENSITY.RECOMMENDED_BULLETS;
    },
    fix: (): LintPatch => ({
      type: 'split',
      path: '',
      value: null,
      description: '슬라이드 분할을 고려하세요',
    }),
  },
  
  DENSITY_BULLET_LENGTH: {
    id: 'DENSITY_BULLET_LENGTH',
    severity: 'warning' as RuleSeverity,
    category: 'density' as RuleCategory,
    description: '각 불릿은 1-1.5줄 이내를 권장합니다',
    check: (lineCount: number): boolean => {
      return lineCount <= CONSTANTS.DENSITY.MAX_LINES_PER_BULLET;
    },
    fix: (): LintPatch => ({
      type: 'modify',
      path: '/content',
      value: null,
      description: '불릿 내용을 간결하게 압축하세요',
    }),
  },
  
  DENSITY_SLIDE_OVERFLOW: {
    id: 'DENSITY_SLIDE_OVERFLOW',
    severity: 'error' as RuleSeverity,
    category: 'density' as RuleCategory,
    description: '콘텐츠가 슬라이드 영역을 초과하면 분할해야 합니다',
    check: (hasOverflow: boolean): boolean => !hasOverflow,
    fix: (): LintPatch => ({
      type: 'split',
      path: '',
      value: { strategy: 'auto' },
      description: '오버플로우 해결: 1) 문장 압축 → 2) 불릿 수 줄이기 → 3) 2단 레이아웃 → 4) 슬라이드 분할',
    }),
  },
  
  // ==========================================
  // 색상/대비 규칙 (COLOR_*)
  // ==========================================
  
  COLOR_CONTRAST: {
    id: 'COLOR_CONTRAST',
    severity: 'error' as RuleSeverity,
    category: 'color' as RuleCategory,
    description: `텍스트와 배경의 명도 대비는 ${CONSTANTS.COLOR.MIN_CONTRAST_RATIO}:1 이상이어야 합니다`,
    check: (contrastRatio: number): boolean => {
      return contrastRatio >= CONSTANTS.COLOR.MIN_CONTRAST_RATIO;
    },
    fix: (): LintPatch => ({
      type: 'modify',
      path: '/color',
      value: null,
      description: '텍스트 색상 또는 배경색 조정 필요',
    }),
  },
  
  COLOR_ACCENT_LIMIT: {
    id: 'COLOR_ACCENT_LIMIT',
    severity: 'warning' as RuleSeverity,
    category: 'color' as RuleCategory,
    description: `슬라이드당 강조색은 ${CONSTANTS.COLOR.MAX_ACCENT_COLORS_PER_SLIDE}개 이하를 권장합니다`,
    check: (accentColorCount: number): boolean => {
      return accentColorCount <= CONSTANTS.COLOR.MAX_ACCENT_COLORS_PER_SLIDE;
    },
    fix: (): LintPatch => ({
      type: 'modify',
      path: '/colors',
      value: null,
      description: '강조색을 테마 팔레트 내에서 통일하세요',
    }),
  },
  
  COLOR_THEME_PALETTE: {
    id: 'COLOR_THEME_PALETTE',
    severity: 'info' as RuleSeverity,
    category: 'color' as RuleCategory,
    description: '차트/도형 색상은 테마 팔레트에서 선택하세요',
    check: (color: string, themePalette: string[]): boolean => {
      return themePalette.includes(color.toLowerCase());
    },
    fix: (color: string, themePalette: string[]): LintPatch => ({
      type: 'modify',
      path: '/color',
      value: themePalette[0], // 기본 테마 색상으로 대체
      description: '테마 팔레트 색상으로 대체',
    }),
  },
  
  // ==========================================
  // 오버플로우 규칙 (OVERFLOW_*)
  // ==========================================
  
  OVERFLOW_TEXT_BOX: {
    id: 'OVERFLOW_TEXT_BOX',
    severity: 'error' as RuleSeverity,
    category: 'overflow' as RuleCategory,
    description: '텍스트가 박스 영역을 초과합니다',
    check: (hasOverflow: boolean): boolean => !hasOverflow,
    fix: (): LintPatch => ({
      type: 'modify',
      path: '',
      value: null,
      description: '오버플로우 해결 순서: 1) 문장 압축 → 2) 불릿 수 줄이기 → 3) 2단 레이아웃 전환 → 4) 슬라이드 분할 → 5) 폰트 축소(최후 수단)',
    }),
  },
  
  OVERFLOW_IMAGE_CROP: {
    id: 'OVERFLOW_IMAGE_CROP',
    severity: 'warning' as RuleSeverity,
    category: 'overflow' as RuleCategory,
    description: '이미지 크롭 시 보호 영역(얼굴/로고/중심 피사체)을 확인하세요',
    check: (cropInfo: { protectedAreaVisible: boolean }): boolean => {
      return cropInfo.protectedAreaVisible;
    },
    fix: (): LintPatch => ({
      type: 'modify',
      path: '/crop',
      value: null,
      description: '보호 영역이 보이도록 크롭 영역 조정',
    }),
  },
  
  // ==========================================
  // 일관성 규칙 (CONSISTENCY_*)
  // ==========================================
  
  CONSISTENCY_FONT_FAMILY: {
    id: 'CONSISTENCY_FONT_FAMILY',
    severity: 'warning' as RuleSeverity,
    category: 'consistency' as RuleCategory,
    description: '덱 전체에서 폰트 패밀리는 2-3개 이하로 유지하세요',
    check: (fontFamilyCount: number): boolean => fontFamilyCount <= 3,
    fix: (): LintPatch => ({
      type: 'modify',
      path: '/theme/fonts',
      value: null,
      description: '테마에 정의된 폰트만 사용하도록 통일',
    }),
  },
  
  CONSISTENCY_SPACING: {
    id: 'CONSISTENCY_SPACING',
    severity: 'info' as RuleSeverity,
    category: 'consistency' as RuleCategory,
    description: '간격은 4px 배수(4, 8, 12, 16, 20)로 통일하세요',
    check: (spacing: number): boolean => spacing % 4 === 0,
    fix: (spacing: number): LintPatch => ({
      type: 'modify',
      path: '/spacing',
      value: Math.round(spacing / 4) * 4,
      description: '간격을 4px 배수로 조정',
    }),
  },
  
  // ==========================================
  // 접근성 규칙 (A11Y_*)
  // ==========================================
  
  A11Y_ALT_TEXT: {
    id: 'A11Y_ALT_TEXT',
    severity: 'warning' as RuleSeverity,
    category: 'accessibility' as RuleCategory,
    description: '모든 이미지에 대체 텍스트(alt)를 제공하세요',
    check: (altText: string | undefined): boolean => {
      return !!altText && altText.trim().length > 0;
    },
    fix: (): LintPatch => ({
      type: 'modify',
      path: '/alt',
      value: '이미지 설명 필요',
      description: '이미지에 의미 있는 대체 텍스트 추가',
    }),
  },
  
  A11Y_HEADING_HIERARCHY: {
    id: 'A11Y_HEADING_HIERARCHY',
    severity: 'info' as RuleSeverity,
    category: 'accessibility' as RuleCategory,
    description: '제목 계층 구조를 유지하세요 (h1 → h2 → h3)',
    check: (headingLevels: number[]): boolean => {
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i - 1] > 1) {
          return false;
        }
      }
      return true;
    },
    fix: (): LintPatch => ({
      type: 'modify',
      path: '/headings',
      value: null,
      description: '제목 레벨을 순차적으로 조정',
    }),
  },
} as const;

// ============================================
// 4. 규칙 ID 타입
// ============================================

export type LintRuleId = keyof typeof LINT_RULES;

// ============================================
// 5. 린트 결과 스키마
// ============================================

export const LintViolationSchema = z.object({
  ruleId: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  category: z.enum(['margin', 'typography', 'density', 'color', 'overflow', 'consistency', 'accessibility']),
  slideIndex: z.number(),
  blockIndex: z.number().optional(),
  message: z.string(),
  details: z.string().optional(),
  suggestedFix: z.object({
    type: z.enum(['modify', 'split', 'remove', 'rearrange']),
    path: z.string(),
    value: z.unknown().optional(),
    description: z.string(),
  }).optional(),
});

export const LintResultSchema = z.object({
  violations: z.array(LintViolationSchema),
  errorCount: z.number(),
  warningCount: z.number(),
  infoCount: z.number(),
  passed: z.boolean(),
  executedAt: z.string().datetime(),
});

// ============================================
// 6. 규칙 우선순위 (오버플로우 해결 순서)
// ============================================

export const OVERFLOW_FIX_PRIORITY = [
  'COMPRESS_TEXT',      // 1. 문장 압축 (동의어/군더더기 제거)
  'REDUCE_BULLETS',     // 2. 불릿 수 줄이기
  'TWO_COLUMN_LAYOUT',  // 3. 2단 레이아웃 전환
  'SPLIT_SLIDE',        // 4. 슬라이드 분할
  'REDUCE_FONT_SIZE',   // 5. 폰트 축소 (최후 수단, 최소치까지만)
] as const;

export type OverflowFixStrategy = typeof OVERFLOW_FIX_PRIORITY[number];

// ============================================
// 7. 유틸리티 함수
// ============================================

/**
 * 대비 비율 계산 (WCAG 공식)
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 린트 결과 요약 생성
 */
export function summarizeLintResult(result: LintResult): string {
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';
  return `${status} | Errors: ${result.errorCount} | Warnings: ${result.warningCount} | Info: ${result.infoCount}`;
}
