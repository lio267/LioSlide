/**
 * Parallel Orchestrator - 병렬 에이전트 파이프라인
 *
 * 흐름:
 * 1. Outline Agent (순차)
 * 2. Content Agent + Design Agent (병렬)
 * 3. 결과 병합 → DeckSpec 생성
 * 4. Layout Engine (순차)
 * 5. Style Guardian / Review Agent (순차)
 * 6. Renderer (순차)
 *
 * 참고: docs/SHARED_RULES.md
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  UserInput,
  PipelineConfig,
  PipelineStage,
  SlideOutline,
  OutlineAgentOutput,
} from '../types/agents';
import type {
  DeckSpec,
  SlideSpec,
  Theme,
  LayoutResult,
  ContentBlock,
} from '../types/slideSpec';
import { DeckSpecSchema, ThemeSchema } from '../types/slideSpec';
import {
  OutlineAgent,
  generateOutline,
  SequentialThinkingExecutor,
} from '../agents/outlineAgent';
import {
  ContentAgent,
  ContentAgentOutput,
  generateAllSlideContent,
  ContentGenerator,
} from '../agents/contentAgent';
import {
  DesignAgent,
  DesignAgentOutput,
  generateAllSlideDesigns,
  DesignGenerator,
  SlideConstraints,
  ThemeOverride,
} from '../agents/designAgent';
import { LayoutEngine, calculateDeckLayout } from '../engine/layout/layoutEngine';
import { StyleGuardian, runStyleGuardian, applyAutoFixes } from '../agents/styleGuardian';
import { PPTXRenderer, renderPresentation } from '../renderer/pptxRenderer';
import { renderDeckWithHtml2Pptx } from '../renderer/html2pptxRenderer';
import { DEFAULT_THEME, DEFAULT_PIPELINE_CONFIG, PipelineResult } from '../pipeline';

// ============================================
// 1. 타입 정의
// ============================================

/**
 * 병렬 파이프라인 옵션
 */
export interface ParallelPipelineOptions {
  /** 테마 오버라이드 */
  theme?: Partial<Theme>;
  /** 파이프라인 설정 */
  config?: Partial<PipelineConfig>;
  /** 병렬 실행 여부 (false면 순차 실행) */
  parallel?: boolean;
  /** 진행 상황 콜백 */
  onProgress?: (event: ProgressEvent) => void;
  /** LLM 콘텐츠 생성기 */
  contentGenerator?: ContentGenerator;
  /** LLM 디자인 생성기 */
  designGenerator?: DesignGenerator;
  /** MCP Sequential Thinking 실행기 (아웃라인 생성용) */
  mcpExecutor?: SequentialThinkingExecutor;
  /** MCP Sequential Thinking 사용 여부 */
  useMCP?: boolean;
  /** 디버그 모드 */
  debug?: boolean;
  /** 에이전트 병렬 동시성 */
  concurrency?: number;
  /** HTML 기반 렌더러 사용 여부 (html2pptx) */
  useHtmlRenderer?: boolean;
  /** 디버그 출력 디렉토리 (HTML/스크린샷 저장) */
  debugDir?: string;
}

/**
 * 진행 상황 이벤트
 */
export interface ProgressEvent {
  stage: PipelineStage;
  step: number;
  totalSteps: number;
  progress: number;  // 0-100
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 병렬 실행 결과
 */
interface ParallelAgentResults {
  content: ContentAgentOutput[] | null;
  design: DesignAgentOutput[] | null;
  contentError?: Error;
  designError?: Error;
}

/**
 * 단계별 타이밍
 */
interface StepTiming {
  step: string;
  duration: number;
  startedAt: string;
  completedAt: string;
}

// ============================================
// 2. 상수 정의
// ============================================

const PIPELINE_STEPS = [
  { name: 'outline', label: '아웃라인 생성', progress: 15 },
  { name: 'parallel', label: '콘텐츠/디자인 병렬 생성', progress: 45 },
  { name: 'merge', label: 'DeckSpec 병합', progress: 55 },
  { name: 'layout', label: '레이아웃 계산', progress: 70 },
  { name: 'lint', label: '스타일 검증', progress: 85 },
  { name: 'render', label: 'PPT 렌더링', progress: 100 },
] as const;

// ============================================
// 3. ParallelOrchestrator 클래스
// ============================================

export class ParallelOrchestrator {
  private options: Required<Omit<ParallelPipelineOptions, 'contentGenerator' | 'designGenerator' | 'onProgress' | 'mcpExecutor' | 'debugDir'>> & {
    contentGenerator?: ContentGenerator;
    designGenerator?: DesignGenerator;
    onProgress?: (event: ProgressEvent) => void;
    mcpExecutor?: SequentialThinkingExecutor;
    debugDir?: string;
  };
  private theme: Theme;
  private config: PipelineConfig;
  private logs: string[] = [];
  private timings: StepTiming[] = [];

  constructor(options: ParallelPipelineOptions = {}) {
    this.options = {
      theme: options.theme || {},
      config: options.config || {},
      parallel: options.parallel !== false,  // 기본값: true
      useMCP: options.useMCP || false,
      debug: options.debug || false,
      concurrency: options.concurrency || 5,
      useHtmlRenderer: options.useHtmlRenderer !== false,  // 기본값: true (html2pptx 사용)
      debugDir: options.debugDir,
      contentGenerator: options.contentGenerator,
      designGenerator: options.designGenerator,
      mcpExecutor: options.mcpExecutor,
      onProgress: options.onProgress,
    };

    // 테마 병합: config.theme가 있으면 템플릿 JSON의 colors 적용
    const themeOverride = this.buildThemeFromConfig(options.config?.theme);
    this.theme = ThemeSchema.parse({
      ...DEFAULT_THEME,
      ...themeOverride,
      ...this.options.theme,
    });
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...this.options.config };

    if (this.options.debug) {
      console.log(`[Orchestrator] 테마 색상 적용: primary=${this.theme.colors.primary}`);
    }
  }

  /**
   * config.theme (템플릿 JSON)에서 Theme 객체 구성
   */
  private buildThemeFromConfig(templateTheme: unknown): Partial<Theme> {
    if (!templateTheme || typeof templateTheme !== 'object') {
      return {};
    }

    const t = templateTheme as Record<string, unknown>;

    // 템플릿 JSON의 colors 필드 추출
    const templateColors = t.colors as Record<string, string> | undefined;
    if (!templateColors) {
      return {};
    }

    // hex 색상에서 # 제거
    const cleanHex = (hex: string): string => hex?.replace('#', '') || '';

    return {
      name: (t.name as string) || 'custom',
      colors: {
        primary: cleanHex(templateColors.primary) || DEFAULT_THEME.colors.primary,
        primaryLight: cleanHex(templateColors.primaryLight || templateColors.secondary) || DEFAULT_THEME.colors.primaryLight,
        primaryDark: cleanHex(templateColors.primaryDark) || DEFAULT_THEME.colors.primaryDark,
        secondary: cleanHex(templateColors.secondary || templateColors.backgroundAlt) || DEFAULT_THEME.colors.secondary,
        surface: cleanHex(templateColors.background) || DEFAULT_THEME.colors.surface,
        surfaceForeground: cleanHex(templateColors.text) || DEFAULT_THEME.colors.surfaceForeground,
        muted: cleanHex(templateColors.backgroundAlt) || DEFAULT_THEME.colors.muted,
        mutedForeground: cleanHex(templateColors.textSecondary) || DEFAULT_THEME.colors.mutedForeground,
        accent: cleanHex(templateColors.accent) || DEFAULT_THEME.colors.accent,
        border: cleanHex(templateColors.textLight) || DEFAULT_THEME.colors.border,
      },
    };
  }

  /**
   * 파이프라인 실행 (메인 진입점)
   */
  async run(userInput: UserInput): Promise<PipelineResult> {
    const startTime = Date.now();
    let currentStep = 0;

    try {
      // ==========================================
      // Step 1: Outline Agent (순차)
      // ==========================================
      currentStep = 0;
      const useMCP = this.options.useMCP && !!this.options.mcpExecutor;
      this.emitProgress(
        currentStep,
        useMCP ? '📋 아웃라인 생성 시작 (MCP Sequential Thinking)...' : '📋 아웃라인 생성 시작...'
      );
      const outlineStart = Date.now();

      const outlineResult = await generateOutline(
        {
          userInput,
          theme: this.theme,
        },
        {
          useMCP,
          mcpExecutor: this.options.mcpExecutor,
          debug: this.options.debug,
        }
      );

      this.recordTiming('outline', outlineStart);
      this.log(`✅ ${outlineResult.totalSlides}개 슬라이드 아웃라인 생성 완료${useMCP ? ' (MCP)' : ''}`);

      // ==========================================
      // Step 2: Content + Design Agent (병렬)
      // ==========================================
      currentStep = 1;
      this.emitProgress(currentStep, '🔄 콘텐츠/디자인 병렬 생성 시작...');
      const parallelStart = Date.now();

      const parallelResults = await this.runParallelAgents(
        outlineResult,
        userInput
      );

      this.recordTiming('parallel', parallelStart);
      this.logParallelResults(parallelResults);

      // ==========================================
      // Step 3: 결과 병합 → DeckSpec 생성
      // ==========================================
      currentStep = 2;
      this.emitProgress(currentStep, '🔧 DeckSpec 병합 중...');
      const mergeStart = Date.now();

      let deckSpec = this.mergeToDeckSpec(
        outlineResult,
        parallelResults,
        userInput
      );
      deckSpec = DeckSpecSchema.parse(deckSpec);

      this.recordTiming('merge', mergeStart);
      this.log('✅ DeckSpec 병합 완료');

      // ==========================================
      // Step 4: Layout Engine (순차)
      // ==========================================
      currentStep = 3;
      this.emitProgress(currentStep, '📐 레이아웃 계산 중...');
      const layoutStart = Date.now();

      const layoutEngine = new LayoutEngine(this.theme);
      let layoutResult = layoutEngine.calculateLayout(deckSpec);

      // 오버플로우 검사
      const overflows = layoutEngine.detectOverflows(layoutResult);
      if (overflows.length > 0) {
        this.log(`⚠️ ${overflows.length}개 슬라이드에서 오버플로우 감지`, 'warn');
      }

      this.recordTiming('layout', layoutStart);
      this.log('✅ 레이아웃 계산 완료');

      // ==========================================
      // Step 5: Style Guardian / Review (순차)
      // ==========================================
      currentStep = 4;
      this.emitProgress(currentStep, '🔍 스타일 검증 중...');
      const lintStart = Date.now();

      let lintPassed = false;
      let iterations = 0;

      while (iterations < this.config.maxLintIterations) {
        iterations++;

        const guardianResult = runStyleGuardian({
          deckSpec,
          layoutResult,
          theme: this.theme,
        });

        this.log(
          `린트 결과 (${iterations}회차): ` +
          `에러 ${guardianResult.lintResult.errorCount}, ` +
          `경고 ${guardianResult.lintResult.warningCount}`
        );

        if (guardianResult.lintResult.passed) {
          lintPassed = true;
          this.log('✅ 린트 통과');
          break;
        }

        if (!this.config.autoFix) {
          this.log('⚠️ 자동 수정 비활성화됨', 'warn');
          break;
        }

        // 자동 수정 적용
        this.log('🔧 자동 수정 적용 중...');
        deckSpec = applyAutoFixes(deckSpec, guardianResult);
        layoutResult = layoutEngine.calculateLayout(deckSpec);
      }

      this.recordTiming('lint', lintStart);

      if (!lintPassed && this.config.stopOnLintError) {
        throw new Error('Style Guardian 린트 실패 - export 중단');
      }

      // ==========================================
      // Step 6: Renderer (순차)
      // ==========================================
      currentStep = 5;
      const renderStart = Date.now();
      const outputPath = `${this.config.outputDir}/${this.sanitizeFilename(userInput.topic)}.pptx`;
      let finalOutputPath: string;

      // 커스텀 화면 비율이면 pptxgenjs 렌더러 사용 (html2pptx는 16:9만 지원)
      const useHtmlRenderer = this.options.useHtmlRenderer &&
        (!this.config.aspectRatio || this.config.aspectRatio === '16:9');

      if (useHtmlRenderer) {
        // HTML 기반 렌더러 사용 (html2pptx)
        this.emitProgress(currentStep, '🎨 HTML 기반 PPT 렌더링 중...');
        this.log('📄 HTML → 스크린샷 → PPTX 변환 시작');

        const debugDir = this.options.debugDir || (this.options.debug
          ? `${this.config.outputDir}/debug_${Date.now()}`
          : undefined);

        const html2pptxResult = await renderDeckWithHtml2Pptx(deckSpec, {
          outputPath,
          debug: this.options.debug,
          debugDir,
          slideSize: this.config.slideSize,
          aspectRatio: this.config.aspectRatio,
        });

        if (!html2pptxResult.success) {
          throw new Error(`HTML 렌더링 실패: ${html2pptxResult.error}`);
        }

        finalOutputPath = html2pptxResult.outputPath || outputPath;
        this.log(`✅ HTML 기반 PPT 생성 완료: ${finalOutputPath}`);
        this.log(`   슬라이드 수: ${html2pptxResult.slideCount}, 소요시간: ${html2pptxResult.duration}ms`);

        if (html2pptxResult.debugFiles && html2pptxResult.debugFiles.length > 0) {
          this.log(`   디버그 파일: ${html2pptxResult.debugFiles.length}개 저장됨`);
        }
      } else {
        // 기존 pptxgenjs 렌더러 사용
        this.emitProgress(currentStep, '🎨 PPT 렌더링 중...');

        const renderResult = await renderPresentation(
          deckSpec,
          layoutResult,
          this.theme,
          outputPath,
          {
            slideSize: this.config.slideSize,
            aspectRatio: this.config.aspectRatio,
          }
        );

        finalOutputPath = renderResult.filePath;
        this.log(`✅ PPT 생성 완료: ${renderResult.filePath}`);
      }

      this.recordTiming('render', renderStart);

      // 완료
      this.emitProgress(currentStep, '🎉 파이프라인 완료!', {
        timings: this.timings,
        totalDuration: Date.now() - startTime,
      });

      return {
        success: true,
        outputPath: finalOutputPath,
        deckSpec,
        layoutResult,
        lintPassed,
        lintIterations: iterations,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`❌ 파이프라인 에러: ${errorMessage}`, 'error');

      this.emitProgress(currentStep, `❌ 에러: ${errorMessage}`, {
        error: errorMessage,
        stage: PIPELINE_STEPS[currentStep]?.name || 'unknown',
      });

      // 폴백: 기존 pipeline.ts 사용 시도
      if (this.options.parallel) {
        this.log('🔄 순차 실행으로 폴백 시도...', 'warn');
        try {
          const fallbackOrchestrator = new ParallelOrchestrator({
            ...this.options,
            parallel: false,
          });
          return await fallbackOrchestrator.run(userInput);
        } catch (fallbackError) {
          this.log(`❌ 폴백도 실패: ${fallbackError}`, 'error');
        }
      }

      return {
        success: false,
        lintPassed: false,
        lintIterations: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  // ==========================================
  // 병렬 에이전트 실행
  // ==========================================

  /**
   * Content Agent와 Design Agent 병렬 실행
   */
  private async runParallelAgents(
    outlineResult: OutlineAgentOutput,
    userInput: UserInput
  ): Promise<ParallelAgentResults> {
    const { outline } = outlineResult;

    // 병렬 모드가 비활성화면 순차 실행
    if (!this.options.parallel) {
      return this.runSequentialAgents(outlineResult, userInput);
    }

    this.log('🔀 병렬 모드: Content + Design 동시 실행');

    // Promise.allSettled로 하나가 실패해도 다른 하나 결과 사용
    const [contentResult, designResult] = await Promise.allSettled([
      // Content Agent
      generateAllSlideContent(
        {
          outlines: outline,
          userInput: {
            tone: userInput.tone,
            audience: userInput.audience,
            sourceContent: userInput.sourceContent,
            additionalInstructions: userInput.additionalInstructions,
          },
        },
        {
          generator: this.options.contentGenerator,
          concurrency: this.options.concurrency,
          debug: this.options.debug,
        }
      ),

      // Design Agent
      generateAllSlideDesigns(
        {
          outlines: outline,
          userInput: {
            tone: userInput.tone,
            branding: userInput.branding,
          },
        },
        {
          generator: this.options.designGenerator,
          concurrency: this.options.concurrency,
          debug: this.options.debug,
        }
      ),
    ]);

    return {
      content: contentResult.status === 'fulfilled' ? contentResult.value : null,
      design: designResult.status === 'fulfilled' ? designResult.value : null,
      contentError: contentResult.status === 'rejected' ? contentResult.reason : undefined,
      designError: designResult.status === 'rejected' ? designResult.reason : undefined,
    };
  }

  /**
   * 순차 실행 (폴백용)
   */
  private async runSequentialAgents(
    outlineResult: OutlineAgentOutput,
    userInput: UserInput
  ): Promise<ParallelAgentResults> {
    this.log('📝 순차 모드: Content → Design 순서로 실행');

    let content: ContentAgentOutput[] | null = null;
    let design: DesignAgentOutput[] | null = null;
    let contentError: Error | undefined;
    let designError: Error | undefined;

    // Content Agent
    try {
      content = await generateAllSlideContent(
        {
          outlines: outlineResult.outline,
          userInput: {
            tone: userInput.tone,
            audience: userInput.audience,
            sourceContent: userInput.sourceContent,
            additionalInstructions: userInput.additionalInstructions,
          },
        },
        {
          generator: this.options.contentGenerator,
          concurrency: this.options.concurrency,
          debug: this.options.debug,
        }
      );
    } catch (error) {
      contentError = error as Error;
      this.log(`⚠️ Content Agent 실패: ${contentError.message}`, 'warn');
    }

    // Design Agent
    try {
      design = await generateAllSlideDesigns(
        {
          outlines: outlineResult.outline,
          userInput: {
            tone: userInput.tone,
            branding: userInput.branding,
          },
        },
        {
          generator: this.options.designGenerator,
          concurrency: this.options.concurrency,
          debug: this.options.debug,
        }
      );
    } catch (error) {
      designError = error as Error;
      this.log(`⚠️ Design Agent 실패: ${designError.message}`, 'warn');
    }

    return { content, design, contentError, designError };
  }

  // ==========================================
  // 결과 병합
  // ==========================================

  /**
   * Content + Design 결과를 DeckSpec으로 병합
   */
  private mergeToDeckSpec(
    outlineResult: OutlineAgentOutput,
    parallelResults: ParallelAgentResults,
    userInput: UserInput
  ): DeckSpec {
    const { outline, sections } = outlineResult;
    const { content, design } = parallelResults;

    // 콘텐츠/디자인 맵 생성 (slideIndex 기준)
    const contentMap = new Map<number, ContentAgentOutput>();
    const designMap = new Map<number, DesignAgentOutput>();

    if (content) {
      content.forEach((c) => contentMap.set(c.slideIndex, c));
    }
    if (design) {
      design.forEach((d) => designMap.set(d.slideIndex, d));
    }

    // 슬라이드 생성
    const slides: SlideSpec[] = outline.map((item, index) => {
      const contentOutput = contentMap.get(index);
      const designOutput = designMap.get(index);

      return this.buildSlideSpec(item, contentOutput, designOutput, userInput, index);
    });

    // DeckSpec 조립
    return {
      metadata: {
        title: userInput.topic,
        subtitle: userInput.additionalInstructions,
        author: userInput.branding?.companyName,
        company: userInput.branding?.companyName,
        date: new Date().toISOString().split('T')[0],
        version: '1.0.0',
        language: 'ko',
      },
      theme: this.applyThemeOverrides(designMap),
      slides,
      sections: sections.map((s) => ({
        name: s.name,
        startSlideIndex: s.startIndex,
        endSlideIndex: s.endIndex,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 개별 SlideSpec 빌드
   */
  private buildSlideSpec(
    outline: SlideOutline,
    content: ContentAgentOutput | undefined,
    design: DesignAgentOutput | undefined,
    userInput: UserInput,
    index: number
  ): SlideSpec {
    // 1. 콘텐츠 블록 결정
    const blocks = this.resolveBlocks(outline, content);

    // 2. 제약 조건 결정
    const constraints = this.resolveConstraints(outline, design);

    // 3. 배경색 결정 (타이틀/클로징은 primary, 나머지는 surface)
    const backgroundColor = this.getSlideBackgroundColor(outline.type);

    // 4. SlideSpec 생성
    return {
      id: uuidv4(),
      type: outline.type,
      title: outline.title,
      subtitle: outline.type === 'title' ? userInput.audience : undefined,
      blocks,
      notes: content?.notes || outline.keyMessage,
      constraints,
      keyMessage: outline.keyMessage,
      transition: 'fade',
      backgroundColor,
    };
  }

  /**
   * 슬라이드 타입에 따른 배경색 결정
   */
  private getSlideBackgroundColor(slideType: string): { theme: 'primary' | 'surface' | 'muted' } {
    switch (slideType) {
      case 'title':
      case 'sectionTitle':
        return { theme: 'primary' };
      case 'closing':
      case 'qna':
        return { theme: 'primary' };
      default:
        return { theme: 'surface' };
    }
  }

  /**
   * 콘텐츠 블록 결정 (Content Agent 출력 우선)
   */
  private resolveBlocks(
    outline: SlideOutline,
    content: ContentAgentOutput | undefined
  ): ContentBlock[] {
    // Content Agent 결과가 있으면 사용
    if (content && content.blocks.length > 0) {
      return content.blocks;
    }

    // 폴백: Outline의 contentHints로 기본 블록 생성
    if (outline.contentHints.length === 0) {
      return [];
    }

    if (outline.contentHints.length === 1) {
      return [{
        type: 'text',
        content: outline.contentHints[0],
        importance: 3,
      }];
    }

    return [{
      type: 'bulletList',
      items: outline.contentHints.map((hint) => ({
        content: hint,
        level: 0,
      })),
      importance: 3,
    }];
  }

  /**
   * 제약 조건 결정 (Design Agent 출력 우선)
   */
  private resolveConstraints(
    outline: SlideOutline,
    design: DesignAgentOutput | undefined
  ): SlideSpec['constraints'] {
    // Design Agent 결과가 있으면 사용
    if (design) {
      return {
        layoutHint: design.constraints.layoutHint,
        density: design.constraints.density,
        useAccentColor: design.constraints.useAccentColor,
        backgroundStyle: design.constraints.backgroundStyle,
        imagePriority: design.constraints.imagePriority || undefined,
      };
    }

    // 폴백: Outline의 estimatedDensity 사용
    return {
      density: outline.estimatedDensity,
      useAccentColor: false,
      backgroundStyle: 'solid',
    };
  }

  /**
   * 테마 오버라이드 적용
   */
  private applyThemeOverrides(designMap: Map<number, DesignAgentOutput>): Theme {
    // 첫 번째로 발견된 themeOverride 적용
    for (const design of designMap.values()) {
      if (design.themeOverride?.colors) {
        return {
          ...this.theme,
          colors: {
            ...this.theme.colors,
            ...(design.themeOverride.colors.primary && {
              primary: design.themeOverride.colors.primary,
            }),
            ...(design.themeOverride.colors.primaryDark && {
              primaryDark: design.themeOverride.colors.primaryDark,
            }),
            ...(design.themeOverride.colors.secondary && {
              secondary: design.themeOverride.colors.secondary,
            }),
          },
        };
      }
    }
    return this.theme;
  }

  // ==========================================
  // 유틸리티 메서드
  // ==========================================

  /**
   * 진행 상황 이벤트 발생
   */
  private emitProgress(
    stepIndex: number,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const step = PIPELINE_STEPS[stepIndex];

    const event: ProgressEvent = {
      stage: step?.name as PipelineStage || 'idle',
      step: stepIndex + 1,
      totalSteps: PIPELINE_STEPS.length,
      progress: step?.progress || 0,
      message,
      details,
    };

    this.options.onProgress?.(event);
    this.log(message);
  }

  /**
   * 로그 기록
   */
  private log(
    message: string,
    level: 'info' | 'warn' | 'error' = 'info'
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    const logMessage = `[${timestamp}] ${prefix} ${message}`;

    this.logs.push(logMessage);

    if (this.options.debug) {
      console.log(logMessage);
    }
  }

  /**
   * 병렬 실행 결과 로깅
   */
  private logParallelResults(results: ParallelAgentResults): void {
    const contentStatus = results.content
      ? `✅ ${results.content.length}개 슬라이드`
      : `❌ 실패: ${results.contentError?.message}`;

    const designStatus = results.design
      ? `✅ ${results.design.length}개 슬라이드`
      : `❌ 실패: ${results.designError?.message}`;

    this.log(`Content Agent: ${contentStatus}`);
    this.log(`Design Agent: ${designStatus}`);

    // 둘 다 실패한 경우 경고
    if (!results.content && !results.design) {
      this.log('⚠️ 병렬 에이전트 모두 실패, 기본 병합 사용', 'warn');
    }
  }

  /**
   * 타이밍 기록
   */
  private recordTiming(step: string, startTime: number): void {
    this.timings.push({
      step,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * 파일명 정규화
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9가-힣\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
  }

  /**
   * 로그 조회
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * 타이밍 조회
   */
  getTimings(): StepTiming[] {
    return [...this.timings];
  }
}

// ============================================
// 4. 편의 함수
// ============================================

/**
 * 병렬 파이프라인 실행 (메인 진입점)
 *
 * @example
 * // 1. 기본 사용 (병렬)
 * const result = await runParallelPipeline({
 *   topic: 'AI 트렌드 2025',
 *   tone: 'professional',
 *   audience: '기업 임원',
 *   slideCount: 10,
 * });
 *
 * @example
 * // 2. 순차 실행
 * const result = await runParallelPipeline(input, { parallel: false });
 *
 * @example
 * // 3. 진행 상황 콜백
 * const result = await runParallelPipeline(input, {
 *   onProgress: (event) => {
 *     console.log(`[${event.progress}%] ${event.message}`);
 *   }
 * });
 *
 * @example
 * // 4. LLM 생성기 주입
 * const result = await runParallelPipeline(input, {
 *   contentGenerator: async (prompt, system) => {
 *     return await callClaude(prompt, system);
 *   },
 *   designGenerator: async (prompt, system) => {
 *     return await callClaude(prompt, system);
 *   }
 * });
 *
 * @example
 * // 5. MCP Sequential Thinking 사용 (Claude Code 환경)
 * const result = await runParallelPipeline(input, {
 *   useMCP: true,
 *   mcpExecutor: async (params) => {
 *     const response = await mcp__sequential_thinking__sequentialthinking(params);
 *     return { success: true, thought: response.thought || JSON.stringify(response) };
 *   }
 * });
 */
export async function runParallelPipeline(
  userInput: UserInput,
  options: ParallelPipelineOptions = {}
): Promise<PipelineResult> {
  const orchestrator = new ParallelOrchestrator(options);
  return orchestrator.run(userInput);
}

/**
 * 병렬 vs 순차 성능 비교 (벤치마크용)
 */
export async function comparePipelineModes(
  userInput: UserInput,
  options: Omit<ParallelPipelineOptions, 'parallel' | 'onProgress'> = {}
): Promise<{
  parallel: PipelineResult;
  sequential: PipelineResult;
  speedup: number;
}> {
  // 병렬 실행
  const parallelOrchestrator = new ParallelOrchestrator({
    ...options,
    parallel: true,
  });
  const parallelResult = await parallelOrchestrator.run(userInput);

  // 순차 실행
  const sequentialOrchestrator = new ParallelOrchestrator({
    ...options,
    parallel: false,
  });
  const sequentialResult = await sequentialOrchestrator.run(userInput);

  // 속도 향상 비율
  const speedup = sequentialResult.duration / Math.max(1, parallelResult.duration);

  return {
    parallel: parallelResult,
    sequential: sequentialResult,
    speedup,
  };
}

/**
 * 샘플 입력으로 테스트 실행
 */
export async function testParallelPipeline(): Promise<void> {
  console.log('🚀 병렬 파이프라인 테스트 시작\n');

  const input: UserInput = {
    topic: 'AI 기술 트렌드 2025',
    tone: 'professional',
    audience: '기업 임원',
    slideCount: 10,
    sourceContent: `
      인공지능 기술은 2025년 더욱 빠르게 발전하고 있습니다.
      생성형 AI는 이제 업무 생산성의 핵심 도구가 되었습니다.
      멀티모달 AI가 텍스트, 이미지, 음성을 통합 처리합니다.
      AI 에이전트가 복잡한 작업을 자동화합니다.
      기업들은 AI 거버넌스와 윤리에 더 많은 관심을 기울이고 있습니다.
    `,
    additionalInstructions: '차트와 데이터를 많이 활용해주세요',
  };

  const result = await runParallelPipeline(input, {
    debug: true,
    onProgress: (event) => {
      console.log(`[${event.progress}%] ${event.stage}: ${event.message}`);
    },
  });

  if (result.success) {
    console.log('\n✅ 테스트 성공!');
    console.log(`📄 출력 파일: ${result.outputPath}`);
    console.log(`⏱️ 소요 시간: ${result.duration}ms`);
    console.log(`🔍 린트 통과: ${result.lintPassed}`);
  } else {
    console.error('\n❌ 테스트 실패:', result.error);
  }
}

// CLI 실행
if (typeof require !== 'undefined' && require.main === module) {
  testParallelPipeline().catch(console.error);
}
