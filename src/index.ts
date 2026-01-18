/**
 * PPT 자동 생성기 - 메인 진입점
 *
 * 사용법:
 * ```typescript
 * // 병렬 파이프라인 (권장)
 * import { runParallelPipeline } from 'ppt-auto-generator';
 *
 * const result = await runParallelPipeline({
 *   topic: 'AI 기술 트렌드',
 *   tone: 'professional',
 *   audience: '기업 임원',
 *   slideCount: 10,
 * });
 *
 * // 기존 파이프라인
 * import { generatePPT, createSampleInput } from 'ppt-auto-generator';
 *
 * const input = createSampleInput();
 * const result = await generatePPT(input);
 * ```
 */

// ============================================
// Types
// ============================================

export type {
  DeckSpec,
  SlideSpec,
  ContentBlock,
  TextBlock,
  BulletListBlock,
  ChartBlock,
  TableBlock,
  ImageBlock,
  Theme,
  LayoutResult,
  LayoutedSlide,
  LayoutedBlock,
  BoundingBox,
  SlideType,
} from './types/slideSpec';

export type {
  UserInput,
  PipelineConfig,
  PipelineState,
  PipelineStage,
  OutlineAgentOutput,
  SlideOutline,
  PresentationTone,
} from './types/agents';

export type {
  LintViolation,
  LintResult,
  LintPatch,
  RuleSeverity,
  RuleCategory,
} from './types/lintRules';

// ============================================
// Schemas (Zod)
// ============================================

export {
  DeckSpecSchema,
  SlideSpecSchema,
  ThemeSchema,
  ContentBlockSchema,
} from './types/slideSpec';

export {
  LintViolationSchema,
  LintResultSchema,
  LINT_RULES,
  CONSTANTS,
} from './types/lintRules';

// ============================================
// Agents
// ============================================

// Outline Agent (MCP Sequential Thinking 연동)
export {
  OutlineAgent,
  generateOutline,
  createMCPExecutor,
  OUTLINE_THINKING_STEPS,
  type SequentialThinkingParams,
  type SequentialThinkingExecutor,
  type ThinkingStep,
  type OutlineAgentOptions,
  type GenerateOutlineOptions,
} from './agents/outlineAgent';

// Content Agent
export {
  ContentAgent,
  generateAllSlideContent,
  generateSlideContent,
  contentToBlocks,
  countChars,
  compressText,
  applyToneStyle,
  CHAR_LIMITS,
  TONE_STYLE_GUIDE,
  type ContentAgentInput,
  type ContentAgentOutput,
  type ContentGenerationInput,
  type ContentGenerator,
  type ContentAgentOptions,
  type GenerateContentOptions,
} from './agents/contentAgent';

// Design Agent
export {
  DesignAgent,
  generateAllSlideDesigns,
  generateSlideDesign,
  getRecommendedColorKey,
  layoutHintToRatio,
  estimateDensityFromHints,
  adjustDensityByTone,
  shouldUseAccentColor,
  determineBackgroundStyle,
  validateBrandingColor,
  darkenColor,
  RECOMMENDED_LAYOUTS,
  RECOMMENDED_DENSITY,
  RECOMMENDED_BACKGROUND,
  TONE_DESIGN_CHARACTERISTICS,
  DENSITY_THRESHOLDS,
  type DesignAgentInput,
  type DesignAgentOutput,
  type DesignGenerationInput,
  type DesignGenerator,
  type DesignAgentOptions,
  type GenerateDesignOptions,
  type LayoutHint,
  type Density,
  type BackgroundStyle,
  type ImagePriority,
  type ThemeColorKey,
  type SlideConstraints,
  type ThemeOverride,
  type BrandingInfo,
} from './agents/designAgent';

// Style Guardian (Review Agent)
export {
  StyleGuardian,
  runStyleGuardian,
  applyAutoFixes,
} from './agents/styleGuardian';

// Refactor Agent
export {
  RefactorAgent,
  runRefactorAgent,
  LAYERS,
  ComponentTemplates,
} from './agents/refactorAgent';

// ============================================
// Orchestrator
// ============================================

export {
  ParallelOrchestrator,
  runParallelPipeline,
  comparePipelineModes,
  testParallelPipeline,
  type ParallelPipelineOptions,
  type ProgressEvent,
} from './orchestrator/parallelOrchestrator';

// ============================================
// Engine
// ============================================

export {
  LayoutEngine,
  createLayoutEngine,
  calculateDeckLayout,
  GridSystem,
} from './engine/layout/layoutEngine';

// ============================================
// Renderer
// ============================================

export {
  PPTXRenderer,
  renderPresentation,
} from './renderer/pptxRenderer';

// ============================================
// Pipeline (Legacy)
// ============================================

export {
  PPTGenerationPipeline,
  generatePPT,
  createSampleInput,
  DEFAULT_THEME,
  DEFAULT_PIPELINE_CONFIG,
  type PipelineResult,
  type PipelineEvents,
} from './pipeline';

// ============================================
// Store
// ============================================

export { useDeckStore } from './store/deckStore';
