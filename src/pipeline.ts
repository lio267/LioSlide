/**
 * PPT 생성 파이프라인
 * 
 * 흐름: Outline → SpecBuilder → Layout → Render → Lint → (수정 반복)
 * 
 * 각 단계는 명확한 입출력 계약을 따릅니다.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  UserInput,
  PipelineConfig,
  PipelineState,
  PipelineStage,
  OutlineAgentOutput,
  AgentResult,
} from './types/agents';
import type {
  DeckSpec,
  SlideSpec,
  Theme,
  LayoutResult,
  ContentBlock,
  TextBlock,
  BulletListBlock,
} from './types/slideSpec';
import { DeckSpecSchema, ThemeSchema } from './types/slideSpec';
import { OutlineAgent, generateOutline } from './agents/outlineAgent';
import { LayoutEngine, calculateDeckLayout } from './engine/layout/layoutEngine';
import { StyleGuardian, runStyleGuardian, applyAutoFixes } from './agents/styleGuardian';
import { PPTXRenderer, renderPresentation } from './renderer/pptxRenderer';
import { renderDeckWithHtml2Pptx } from './renderer/html2pptxRenderer';

// ============================================
// 1. 기본 테마
// ============================================

export const DEFAULT_THEME: Theme = {
  name: 'default',
  colors: {
    primary: '1791e8',
    primaryLight: '4ba8ed',
    primaryDark: '1273ba',
    secondary: 'f5f5f5',
    surface: 'ffffff',
    surfaceForeground: '1d1d1d',
    muted: 'f5f5f5',
    mutedForeground: '737373',
    accent: 'f5f5f5',
    border: 'c8c8c8',
  },
  fonts: {
    display: 'Arial',
    content: 'Arial',
    mono: 'Courier New',
  },
  fontSizes: {
    title: 44,
    sectionTitle: 34,
    body: 20,
    caption: 12,
    footnote: 10,
  },
  lineHeights: {
    title: 1.1,
    body: 1.3,
  },
  grid: {
    canvas: { width: 13.333, height: 7.5 },
    safeMargin: 0.5,
    readableMargin: 0.7,
    columns: 12,
    gutter: 0.2,
    baselineUnit: 8,
  },
};

// ============================================
// 2. 기본 파이프라인 설정
// ============================================

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  autoFix: true,
  maxLintIterations: 3,
  stopOnLintError: false,
  outputDir: './output',
  saveSpec: true,
};

// ============================================
// 3. SpecBuilder - 아웃라인을 DeckSpec으로 변환
// ============================================

function buildDeckSpec(
  outline: OutlineAgentOutput,
  userInput: UserInput,
  theme: Theme
): DeckSpec {
  const slides: SlideSpec[] = outline.outline.map(item => {
    const blocks: ContentBlock[] = [];
    
    // 콘텐츠 힌트를 블록으로 변환
    if (item.contentHints.length > 0) {
      if (item.contentHints.length === 1) {
        // 단일 텍스트 블록
        blocks.push({
          type: 'text',
          content: item.contentHints[0],
          importance: 3,
        } as TextBlock);
      } else {
        // 불릿 리스트
        blocks.push({
          type: 'bulletList',
          items: item.contentHints.map((hint, i) => ({
            content: hint,
            level: 0,
          })),
          importance: 3,
        } as BulletListBlock);
      }
    }
    
    return {
      id: uuidv4(),
      type: item.type,
      title: item.title,
      subtitle: item.type === 'title' ? userInput.audience : undefined,
      blocks,
      notes: item.keyMessage,
      constraints: {
        density: item.estimatedDensity,
        useAccentColor: false,
        backgroundStyle: 'solid' as const,
      },
      keyMessage: item.keyMessage,
      transition: 'fade',
    };
  });
  
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
    theme,
    slides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// 4. 파이프라인 이벤트 핸들러
// ============================================

export interface PipelineEvents {
  onStageChange?: (stage: PipelineStage, progress: number) => void;
  onLog?: (message: string, level: 'info' | 'warn' | 'error') => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: Error, stage: PipelineStage) => void;
}

export interface PipelineResult {
  success: boolean;
  outputPath?: string;
  specPath?: string;
  deckSpec?: DeckSpec;
  layoutResult?: LayoutResult;
  lintPassed: boolean;
  lintIterations: number;
  duration: number;
  error?: string;
}

// ============================================
// 5. 메인 파이프라인 클래스
// ============================================

export class PPTGenerationPipeline {
  private config: PipelineConfig;
  private theme: Theme;
  private events: PipelineEvents;
  private state: PipelineState;
  
  constructor(
    config: Partial<PipelineConfig> = {},
    theme: Partial<Theme> = {},
    events: PipelineEvents = {}
  ) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.theme = ThemeSchema.parse({ ...DEFAULT_THEME, ...theme });
    this.events = events;
    this.state = {
      currentStage: 'idle',
      results: {},
      progress: 0,
      lintIterations: 0,
    };
  }
  
  /**
   * 파이프라인 실행
   */
  async run(userInput: UserInput): Promise<PipelineResult> {
    const startTime = Date.now();
    
    try {
      // Stage 1: Outline 생성
      this.setStage('outline', 10);
      this.log('📋 아웃라인 생성 중...');
      
      const outlineResult = await generateOutline({
        userInput,
        theme: this.theme,
      });
      
      this.log(`✅ ${outlineResult.totalSlides}개 슬라이드 아웃라인 생성 완료`);
      
      // Stage 2: DeckSpec 빌드
      this.setStage('spec', 30);
      this.log('🔧 SlideSpec 구조화 중...');
      
      let deckSpec = buildDeckSpec(outlineResult, userInput, this.theme);
      deckSpec = DeckSpecSchema.parse(deckSpec);
      
      this.log('✅ DeckSpec 생성 완료');
      
      // Stage 3: 레이아웃 계산
      this.setStage('layout', 50);
      this.log('📐 레이아웃 계산 중...');
      
      const layoutEngine = new LayoutEngine(this.theme);
      let layoutResult = layoutEngine.calculateLayout(deckSpec);
      
      // 오버플로우 검사
      const overflows = layoutEngine.detectOverflows(layoutResult);
      if (overflows.length > 0) {
        this.log(`⚠️ ${overflows.length}개 슬라이드에서 오버플로우 감지`, 'warn');
      }
      
      this.log('✅ 레이아웃 계산 완료');
      
      // Stage 4: 린트 및 자동 수정
      this.setStage('lint', 70);
      this.log('🔍 Style Guardian 린트 실행 중...');
      
      let lintPassed = false;
      let iterations = 0;
      
      while (iterations < this.config.maxLintIterations) {
        iterations++;
        this.state.lintIterations = iterations;
        
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
          this.log('⚠️ 자동 수정 비활성화됨, 린트 실패 상태로 계속', 'warn');
          break;
        }
        
        // 자동 수정 적용
        this.log('🔧 자동 수정 적용 중...');
        deckSpec = applyAutoFixes(deckSpec, guardianResult);
        layoutResult = layoutEngine.calculateLayout(deckSpec);
      }
      
      if (!lintPassed && this.config.stopOnLintError) {
        throw new Error('Style Guardian 린트 실패 - export 중단');
      }
      
      // Stage 5: 렌더링 (html2pptx 기반)
      this.setStage('render', 90);
      this.log('🎨 PPT 렌더링 중 (html2pptx)...');

      const outputPath = `${this.config.outputDir}/${this.sanitizeFilename(userInput.topic)}.pptx`;

      // html2pptx 기반 렌더러 사용
      const html2pptxResult = await renderDeckWithHtml2Pptx(deckSpec, {
        outputPath,
        debug: true,
        debugDir: `${this.config.outputDir}/debug`,
      });

      if (!html2pptxResult.success) {
        throw new Error(`html2pptx 렌더링 실패: ${html2pptxResult.error}`);
      }

      this.log(`✅ PPT 생성 완료: ${html2pptxResult.outputPath} (${html2pptxResult.duration}ms)`);
      
      // 스펙 저장
      let specPath: string | undefined;
      if (this.config.saveSpec) {
        specPath = `${this.config.outputDir}/${this.sanitizeFilename(userInput.topic)}.spec.json`;
        // TODO: 실제 파일 저장 구현
        this.log(`📄 스펙 저장: ${specPath}`);
      }
      
      // 완료
      this.setStage('complete', 100);
      
      const result: PipelineResult = {
        success: true,
        outputPath: html2pptxResult.outputPath,
        specPath,
        deckSpec,
        layoutResult,
        lintPassed,
        lintIterations: iterations,
        duration: Date.now() - startTime,
      };
      
      this.events.onComplete?.(result);
      return result;
      
    } catch (error) {
      this.setStage('error', this.state.progress);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`❌ 파이프라인 에러: ${errorMessage}`, 'error');
      
      this.events.onError?.(error as Error, this.state.currentStage);
      
      return {
        success: false,
        lintPassed: false,
        lintIterations: this.state.lintIterations,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }
  
  // ==========================================
  // 헬퍼 메서드
  // ==========================================
  
  private setStage(stage: PipelineStage, progress: number): void {
    this.state.currentStage = stage;
    this.state.progress = progress;
    this.events.onStageChange?.(stage, progress);
  }
  
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.events.onLog?.(message, level);
    
    // 콘솔 출력
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${this.state.currentStage}] ${message}`);
  }
  
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9가-힣\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
  }
  
  /**
   * 현재 상태 조회
   */
  getState(): PipelineState {
    return { ...this.state };
  }
}

// ============================================
// 6. 편의 함수
// ============================================

/**
 * 간단한 PPT 생성 (기본 설정)
 */
export async function generatePPT(
  userInput: UserInput,
  options: {
    theme?: Partial<Theme>;
    config?: Partial<PipelineConfig>;
    onProgress?: (stage: PipelineStage, progress: number) => void;
  } = {}
): Promise<PipelineResult> {
  const pipeline = new PPTGenerationPipeline(
    options.config,
    options.theme,
    {
      onStageChange: options.onProgress,
    }
  );
  
  return pipeline.run(userInput);
}

/**
 * 샘플 입력 생성 (테스트용)
 */
export function createSampleInput(): UserInput {
  return {
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
}

// ============================================
// 7. CLI 진입점 (Node.js 환경)
// ============================================

export async function main(): Promise<void> {
  console.log('🚀 PPT 자동 생성기 시작\n');
  
  const input = createSampleInput();
  
  const result = await generatePPT(input, {
    onProgress: (stage, progress) => {
      console.log(`[${progress}%] ${stage}`);
    },
  });
  
  if (result.success) {
    console.log('\n✅ 생성 완료!');
    console.log(`📄 출력 파일: ${result.outputPath}`);
    console.log(`⏱️ 소요 시간: ${result.duration}ms`);
  } else {
    console.error('\n❌ 생성 실패:', result.error);
  }
}

// Node.js에서 직접 실행 시
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}
