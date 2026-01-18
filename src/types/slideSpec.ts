/**
 * SlideSpec - PPT 자동 생성기의 단일 진실(Single Source of Truth)
 * 
 * 이 스키마는 에이전트 간의 계약(Contract)으로 작동합니다.
 * - Outline Agent: 슬라이드 목차와 핵심 메시지 생성
 * - SlideSpec Builder: 구조화된 JSON 스펙으로 변환
 * - Layout Engine: 실제 좌표/크기 배치 (오직 여기서만 좌표 결정)
 * - Renderer: pptxgenjs로 렌더링
 * - Style Guardian: 린트 및 수정안 생성
 */

import { z } from 'zod';

// ============================================
// 1. 기본 단위 및 색상 시스템
// ============================================

/** 색상 정의 (hex without #) */
export const ColorSchema = z.string().regex(/^[0-9A-Fa-f]{6}$/, 'Color must be 6-digit hex without #');

/** 테마 색상 참조 */
export const ThemeColorSchema = z.enum([
  'primary',
  'primary-light',
  'primary-dark',
  'secondary',
  'surface',
  'muted',
  'accent',
  'border',
]);

/** 색상 값 (직접 hex 또는 테마 참조) */
export const ColorValueSchema = z.union([
  z.object({ hex: ColorSchema }),
  z.object({ theme: ThemeColorSchema }),
]);

/** 폰트 패밀리 (web-safe만 허용) */
export const FontFamilySchema = z.enum([
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Tahoma',
]);

// ============================================
// 2. 타이포그래피 스케일
// ============================================

/** 폰트 크기 스케일 (pt 단위) */
export const FontSizeScaleSchema = z.object({
  title: z.number().min(40).max(48).default(44),
  sectionTitle: z.number().min(32).max(36).default(34),
  body: z.number().min(18).max(22).default(20),
  caption: z.number().min(12).max(14).default(12),
  footnote: z.number().min(10).max(12).default(10),
});

/** 행간 스케일 */
export const LineHeightScaleSchema = z.object({
  title: z.number().min(1.05).max(1.15).default(1.1),
  body: z.number().min(1.2).max(1.35).default(1.3),
});

// ============================================
// 3. 테마 정의
// ============================================

export const ThemeColorsSchema = z.object({
  primary: ColorSchema.default('1791e8'),
  primaryLight: ColorSchema.default('4ba8ed'),
  primaryDark: ColorSchema.default('1273ba'),
  secondary: ColorSchema.default('f5f5f5'),
  surface: ColorSchema.default('ffffff'),
  surfaceForeground: ColorSchema.default('1d1d1d'),
  muted: ColorSchema.default('f5f5f5'),
  mutedForeground: ColorSchema.default('737373'),
  accent: ColorSchema.default('f5f5f5'),
  border: ColorSchema.default('c8c8c8'),
});

export const ThemeFontsSchema = z.object({
  display: FontFamilySchema.default('Arial'),
  content: FontFamilySchema.default('Arial'),
  mono: z.literal('Courier New').default('Courier New'),
});

export const ThemeGridSchema = z.object({
  /** 캔버스 크기 (16:9 widescreen) */
  canvas: z.object({
    width: z.number().default(13.333), // inches
    height: z.number().default(7.5),   // inches
  }).default({ width: 13.333, height: 7.5 }),
  
  /** 안전 마진 */
  safeMargin: z.number().min(0.5).default(0.5), // inches
  
  /** 권장 마진 */
  readableMargin: z.number().min(0.5).default(0.7), // inches
  
  /** 12-column grid */
  columns: z.number().default(12),
  
  /** gutter */
  gutter: z.number().default(0.2), // inches
  
  /** baseline grid (pt 단위) */
  baselineUnit: z.number().default(8), // pt
});

export const ThemeSchema = z.object({
  name: z.string().default('default'),
  colors: ThemeColorsSchema.default({}),
  fonts: ThemeFontsSchema.default({}),
  fontSizes: FontSizeScaleSchema.default({}),
  lineHeights: LineHeightScaleSchema.default({}),
  grid: ThemeGridSchema.default({}),
});

// ============================================
// 4. 콘텐츠 블록 정의
// ============================================

/** 텍스트 스타일 */
export const TextStyleSchema = z.object({
  fontFamily: FontFamilySchema.optional(),
  fontSize: z.number().min(10).max(72).optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(),
  fontStyle: z.enum(['normal', 'italic']).optional(),
  color: ColorValueSchema.optional(),
  lineHeight: z.number().min(1).max(2).optional(),
  letterSpacing: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
});

/** 텍스트 블록 */
export const TextBlockSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
  style: TextStyleSchema.optional(),
  /** 중요도 (레이아웃 우선순위) */
  importance: z.number().min(1).max(5).default(3),
  /** 그룹 ID (함께 유지되어야 하는 요소) */
  groupId: z.string().optional(),
});

/** 불릿 리스트 블록 */
export const BulletListBlockSchema = z.object({
  type: z.literal('bulletList'),
  items: z.array(z.object({
    content: z.string(),
    level: z.number().min(0).max(3).default(0),
  })),
  style: TextStyleSchema.optional(),
  /** 최대 5줄 권장 */
  maxItems: z.number().max(5).optional(),
  importance: z.number().min(1).max(5).default(3),
  groupId: z.string().optional(),
});

/** 이미지 블록 */
export const ImageBlockSchema = z.object({
  type: z.literal('image'),
  src: z.string(), // URL 또는 base64
  alt: z.string().optional(),
  /** 이미지 피팅 방식 */
  fit: z.enum(['contain', 'cover', 'fill']).default('contain'),
  /** 보호 영역 (크롭 시 보존) */
  protectedArea: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  importance: z.number().min(1).max(5).default(3),
  groupId: z.string().optional(),
});

/** 차트 데이터 시리즈 */
export const ChartSeriesSchema = z.object({
  name: z.string(),
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

/** 차트 블록 */
export const ChartBlockSchema = z.object({
  type: z.literal('chart'),
  chartType: z.enum(['bar', 'line', 'pie', 'doughnut', 'area']),
  data: z.array(ChartSeriesSchema),
  options: z.object({
    showLegend: z.boolean().default(true),
    showValues: z.boolean().default(false),
    colors: z.array(ColorSchema).optional(),
    xAxisTitle: z.string().optional(),
    yAxisTitle: z.string().optional(),
  }).optional(),
  importance: z.number().min(1).max(5).default(4),
  groupId: z.string().optional(),
});

/** 테이블 셀 */
export const TableCellSchema = z.object({
  content: z.string(),
  colspan: z.number().min(1).optional(),
  rowspan: z.number().min(1).optional(),
  style: TextStyleSchema.optional(),
  isHeader: z.boolean().optional(),
});

/** 테이블 블록 */
export const TableBlockSchema = z.object({
  type: z.literal('table'),
  headers: z.array(z.string()).optional(),
  rows: z.array(z.array(z.union([z.string(), TableCellSchema]))),
  style: z.object({
    headerBgColor: ColorValueSchema.optional(),
    alternateRowColor: ColorValueSchema.optional(),
    borderColor: ColorValueSchema.optional(),
  }).optional(),
  importance: z.number().min(1).max(5).default(4),
  groupId: z.string().optional(),
});

/** 도형 블록 */
export const ShapeBlockSchema = z.object({
  type: z.literal('shape'),
  shapeType: z.enum(['rectangle', 'circle', 'line', 'arrow', 'callout']),
  fill: ColorValueSchema.optional(),
  stroke: z.object({
    color: ColorValueSchema,
    width: z.number().min(0).max(10),
  }).optional(),
  importance: z.number().min(1).max(5).default(2),
  groupId: z.string().optional(),
});

/** 플레이스홀더 (차트/이미지 영역 예약) */
export const PlaceholderBlockSchema = z.object({
  type: z.literal('placeholder'),
  placeholderType: z.enum(['chart', 'image', 'table', 'content']),
  label: z.string().optional(),
  aspectRatio: z.string().optional(), // e.g., "16/9", "4/3"
  importance: z.number().min(1).max(5).default(3),
  groupId: z.string().optional(),
});

/** 모든 블록 유니온 */
export const ContentBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  BulletListBlockSchema,
  ImageBlockSchema,
  ChartBlockSchema,
  TableBlockSchema,
  ShapeBlockSchema,
  PlaceholderBlockSchema,
]);

// ============================================
// 5. 슬라이드 타입 정의
// ============================================

export const SlideTypeSchema = z.enum([
  'title',           // 표지
  'sectionTitle',    // 섹션 구분
  'agenda',          // 목차
  'content',         // 일반 콘텐츠
  'twoColumn',       // 2단
  'threeColumn',     // 3단
  'comparison',      // 비교
  'chart',           // 차트 중심
  'imageHero',       // 이미지 강조
  'imageGallery',    // 이미지 갤러리
  'quote',           // 인용
  'timeline',        // 타임라인
  'process',         // 프로세스/흐름
  'summary',         // 요약
  'qna',             // Q&A
  'closing',         // 마무리
]);

// ============================================
// 6. 슬라이드 스펙
// ============================================

/** 슬라이드 제약 조건 (레이아웃 엔진에 전달) */
export const SlideConstraintsSchema = z.object({
  /** 레이아웃 힌트 */
  layoutHint: z.enum([
    'balanced',      // 균형 잡힌 배치
    'left-heavy',    // 왼쪽 강조
    'right-heavy',   // 오른쪽 강조
    'top-heavy',     // 상단 강조
    'bottom-heavy',  // 하단 강조
    'centered',      // 중앙 집중
  ]).optional(),
  
  /** 콘텐츠 밀도 */
  density: z.enum(['sparse', 'normal', 'dense']).default('normal'),
  
  /** 이미지 우선 영역 */
  imagePriority: z.enum(['left', 'right', 'top', 'bottom', 'background']).optional(),
  
  /** 강조색 사용 여부 */
  useAccentColor: z.boolean().default(false),
  
  /** 배경 스타일 */
  backgroundStyle: z.enum(['solid', 'gradient', 'image']).default('solid'),
}).optional();

/** 개별 슬라이드 스펙 */
export const SlideSpecSchema = z.object({
  /** 슬라이드 ID (고유) */
  id: z.string().uuid(),
  
  /** 슬라이드 타입 */
  type: SlideTypeSchema,
  
  /** 제목 */
  title: z.string().optional(),
  
  /** 부제목 */
  subtitle: z.string().optional(),
  
  /** 콘텐츠 블록들 */
  blocks: z.array(ContentBlockSchema).default([]),
  
  /** 발표자 노트 */
  notes: z.string().optional(),
  
  /** 레이아웃 제약 조건 */
  constraints: SlideConstraintsSchema,
  
  /** 슬라이드별 배경색 오버라이드 */
  backgroundColor: ColorValueSchema.optional(),
  
  /** 핵심 메시지 (Outline Agent가 생성) */
  keyMessage: z.string().optional(),
  
  /** 전환 효과 */
  transition: z.enum(['none', 'fade', 'slide', 'zoom']).default('none'),
});

// ============================================
// 7. 덱 스펙 (전체 프레젠테이션)
// ============================================

/** 프레젠테이션 메타데이터 */
export const DeckMetadataSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  company: z.string().optional(),
  date: z.string().optional(),
  version: z.string().default('1.0.0'),
  language: z.enum(['ko', 'en', 'ja', 'zh']).default('ko'),
});

/** 섹션 정의 (슬라이드 그룹) */
export const SectionSchema = z.object({
  name: z.string(),
  startSlideIndex: z.number().int().nonnegative(),
  endSlideIndex: z.number().int().nonnegative(),
});

/** 전체 덱 스펙 */
export const DeckSpecSchema = z.object({
  /** 메타데이터 */
  metadata: DeckMetadataSchema,

  /** 테마 */
  theme: ThemeSchema.default({}),

  /** 슬라이드 목록 */
  slides: z.array(SlideSpecSchema).min(1),

  /** 섹션 정보 (선택적) */
  sections: z.array(SectionSchema).optional(),

  /** 생성 타임스탬프 */
  createdAt: z.string().datetime().optional(),

  /** 수정 타임스탬프 */
  updatedAt: z.string().datetime().optional(),
});

// ============================================
// 8. 레이아웃 결과 (Layout Engine 출력)
// ============================================

/** 절대 좌표 박스 */
export const BoundingBoxSchema = z.object({
  x: z.number(), // inches from left
  y: z.number(), // inches from top
  width: z.number(), // inches
  height: z.number(), // inches
});

/** 레이아웃된 블록 */
export const LayoutedBlockSchema = z.object({
  /** 원본 블록 참조 */
  blockIndex: z.number(),
  
  /** 계산된 위치 */
  box: BoundingBoxSchema,
  
  /** 계산된 폰트 크기 (텍스트 블록용) */
  computedFontSize: z.number().optional(),
  
  /** 줄 수 (텍스트 블록용) */
  lineCount: z.number().optional(),
  
  /** 오버플로우 여부 */
  hasOverflow: z.boolean().default(false),
});

/** 레이아웃된 슬라이드 */
export const LayoutedSlideSchema = z.object({
  slideId: z.string().uuid(),
  titleBox: BoundingBoxSchema.optional(),
  subtitleBox: BoundingBoxSchema.optional(),
  blocks: z.array(LayoutedBlockSchema),
});

/** 전체 레이아웃 결과 */
export const LayoutResultSchema = z.object({
  slides: z.array(LayoutedSlideSchema),
  generatedAt: z.string().datetime(),
});

// ============================================
// 9. 타입 추출
// ============================================

export type Color = z.infer<typeof ColorSchema>;
export type ThemeColor = z.infer<typeof ThemeColorSchema>;
export type ColorValue = z.infer<typeof ColorValueSchema>;
export type FontFamily = z.infer<typeof FontFamilySchema>;
export type FontSizeScale = z.infer<typeof FontSizeScaleSchema>;
export type LineHeightScale = z.infer<typeof LineHeightScaleSchema>;
export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type ThemeFonts = z.infer<typeof ThemeFontsSchema>;
export type ThemeGrid = z.infer<typeof ThemeGridSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type TextStyle = z.infer<typeof TextStyleSchema>;
export type TextBlock = z.infer<typeof TextBlockSchema>;
export type BulletListBlock = z.infer<typeof BulletListBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type ChartSeries = z.infer<typeof ChartSeriesSchema>;
export type ChartBlock = z.infer<typeof ChartBlockSchema>;
export type TableCell = z.infer<typeof TableCellSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type ShapeBlock = z.infer<typeof ShapeBlockSchema>;
export type PlaceholderBlock = z.infer<typeof PlaceholderBlockSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type SlideType = z.infer<typeof SlideTypeSchema>;
export type SlideConstraints = z.infer<typeof SlideConstraintsSchema>;
export type SlideSpec = z.infer<typeof SlideSpecSchema>;
export type DeckMetadata = z.infer<typeof DeckMetadataSchema>;
export type DeckSpec = z.infer<typeof DeckSpecSchema>;
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
export type LayoutedBlock = z.infer<typeof LayoutedBlockSchema>;
export type LayoutedSlide = z.infer<typeof LayoutedSlideSchema>;
export type LayoutResult = z.infer<typeof LayoutResultSchema>;
