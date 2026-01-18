/**
 * 에이전트 시스템 타입 정의
 * 
 * 파이프라인: 기획 → 스펙 → 레이아웃 → 렌더 → 린트/수정
 * 
 * 각 에이전트는 명확한 입출력 계약을 가집니다.
 */

import type { DeckSpec, SlideSpec, LayoutResult, Theme } from './slideSpec';
import type { LintResult, LintPatch } from './lintRules';

// ============================================
// 1. 에이전트 기본 인터페이스
// ============================================

export interface AgentContext {
  /** 사용자 입력 */
  userInput: UserInput;
  /** 현재 테마 */
  theme: Theme;
  /** MCP 도구 사용 가능 여부 */
  mcpTools: MCPToolsConfig;
  /** 실행 옵션 */
  options: AgentOptions;
}

export interface AgentOptions {
  /** 디버그 모드 */
  debug: boolean;
  /** 자동 수정 활성화 */
  autoFix: boolean;
  /** 최대 반복 횟수 (자동 수정 시) */
  maxIterations: number;
  /** 언어 설정 */
  language: 'ko' | 'en' | 'ja' | 'zh';
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  logs: AgentLog[];
  duration: number; // ms
}

export interface AgentLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

// ============================================
// 2. 사용자 입력 타입
// ============================================

export interface UserInput {
  /** 프레젠테이션 주제 */
  topic: string;
  /** 톤/스타일 */
  tone: PresentationTone;
  /** 대상 청중 */
  audience: string;
  /** 원하는 슬라이드 수 (대략적) */
  slideCount: number;
  /** 원문/소스 자료 */
  sourceContent?: string;
  /** 회사/브랜드 정보 */
  branding?: BrandingInfo;
  /** 추가 지시사항 */
  additionalInstructions?: string;
}

export type PresentationTone =
  | 'professional'    // 전문적
  | 'casual'          // 캐주얼
  | 'academic'        // 학술적
  | 'creative'        // 창의적
  | 'minimal'         // 미니멀
  | 'energetic'       // 활기찬
  | 'luxury';         // 고급스러운

export interface BrandingInfo {
  companyName: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  fontPreference?: string;
}

// ============================================
// 3. MCP 도구 설정
// ============================================

export interface MCPToolsConfig {
  /** 씨퀀스띵킹 - Outline 생성에 사용 */
  sequenceThinking: {
    enabled: boolean;
    /** 사용 시점: 목차/흐름 생성 */
    useFor: 'outline';
  };
  
  /** 컨텍스트7 - API 제약 확인에 사용 */
  context7: {
    enabled: boolean;
    /** 사용 시점: pptxgenjs API 문서 참조 */
    useFor: 'api-reference';
    /** 캐시된 문서 경로 */
    cachePath?: string;
  };
  
  /** 깃허브 - 템플릿/예제 참조에 사용 */
  github: {
    enabled: boolean;
    /** 사용 시점: 템플릿 가져오기, 버전 관리 */
    useFor: 'templates';
    /** 연결된 레포 */
    repository?: string;
  };
  
  /** 크롬 DevTools - 레이아웃 디버깅에 사용 */
  chromeDevTools: {
    enabled: boolean;
    /** 사용 시점: HTML 프리뷰 검사 */
    useFor: 'layout-debugging';
  };
}

// ============================================
// 4. Outline Agent
// ============================================

export interface OutlineAgentInput {
  userInput: UserInput;
  theme: Theme;
}

export interface SlideOutline {
  /** 슬라이드 순서 */
  order: number;
  /** 슬라이드 타입 */
  type: SlideSpec['type'];
  /** 제목 */
  title: string;
  /** 핵심 메시지 (한 문장) */
  keyMessage: string;
  /** 포함될 콘텐츠 힌트 */
  contentHints: string[];
  /** 예상 콘텐츠 밀도 */
  estimatedDensity: 'sparse' | 'normal' | 'dense';
}

export interface OutlineAgentOutput {
  /** 전체 아웃라인 */
  outline: SlideOutline[];
  /** 총 예상 슬라이드 수 */
  totalSlides: number;
  /** 섹션 구조 */
  sections: {
    name: string;
    startIndex: number;
    endIndex: number;
  }[];
  /** 씨퀀스띵킹 사용 로그 */
  thinkingLog?: string;
}

// ============================================
// 5. SlideSpec Builder Agent
// ============================================

export interface SpecBuilderAgentInput {
  outline: OutlineAgentOutput;
  userInput: UserInput;
  theme: Theme;
}

export interface SpecBuilderAgentOutput {
  /** 생성된 DeckSpec */
  deckSpec: DeckSpec;
  /** 각 슬라이드의 생성 메타데이터 */
  metadata: {
    slideId: string;
    generatedFrom: string; // outline의 keyMessage 참조
    confidenceScore: number; // 0-1
  }[];
}

// ============================================
// 6. Layout Engine Agent
// ============================================

export interface LayoutEngineInput {
  deckSpec: DeckSpec;
  theme: Theme;
}

export interface LayoutEngineOutput {
  /** 레이아웃 결과 */
  layoutResult: LayoutResult;
  /** 레이아웃 경고 (오버플로우 가능성 등) */
  warnings: {
    slideIndex: number;
    blockIndex?: number;
    message: string;
  }[];
}

// ============================================
// 7. Renderer Agent (pptxgenjs)
// ============================================

export interface RendererInput {
  deckSpec: DeckSpec;
  layoutResult: LayoutResult;
  outputPath: string;
}

export interface RendererOutput {
  /** 출력 파일 경로 */
  filePath: string;
  /** 파일 크기 (bytes) */
  fileSize: number;
  /** 렌더링된 슬라이드 수 */
  slideCount: number;
}

// ============================================
// 8. Style Guardian (서브에이전트)
// ============================================

export interface StyleGuardianInput {
  deckSpec: DeckSpec;
  layoutResult: LayoutResult;
  theme: Theme;
  /** 검사할 규칙 카테고리 (비어있으면 전체) */
  categories?: string[];
}

export interface StyleGuardianOutput {
  /** 린트 결과 */
  lintResult: LintResult;
  /** 제안된 패치들 */
  patches: {
    slideIndex: number;
    blockIndex?: number;
    patch: LintPatch;
    autoApplicable: boolean;
  }[];
  /** 자동 수정된 DeckSpec (autoFix가 true일 때) */
  fixedDeckSpec?: DeckSpec;
}

// ============================================
// 9. Refactor Agent (서브에이전트)
// ============================================

export interface RefactorAgentInput {
  /** 검사할 코드 경로 */
  codePaths: string[];
  /** 검사 유형 */
  checkTypes: RefactorCheckType[];
}

export type RefactorCheckType =
  | 'duplicate-code'     // 중복 코드
  | 'type-safety'        // 타입 안전성
  | 'layer-violation'    // 레이어 침범
  | 'test-coverage'      // 테스트 커버리지
  | 'code-smell';        // 코드 스멜

export interface RefactorSuggestion {
  file: string;
  line: number;
  checkType: RefactorCheckType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedFix?: string;
}

export interface RefactorAgentOutput {
  suggestions: RefactorSuggestion[];
  /** 레이어 침범 여부 */
  layerViolations: {
    from: 'spec' | 'layout' | 'render';
    to: 'spec' | 'layout' | 'render';
    file: string;
    description: string;
  }[];
}

// ============================================
// 10. 파이프라인 전체 타입
// ============================================

export interface PipelineState {
  /** 현재 단계 */
  currentStage: PipelineStage;
  /** 각 단계 결과 */
  results: {
    outline?: AgentResult<OutlineAgentOutput>;
    spec?: AgentResult<SpecBuilderAgentOutput>;
    layout?: AgentResult<LayoutEngineOutput>;
    render?: AgentResult<RendererOutput>;
    lint?: AgentResult<StyleGuardianOutput>;
  };
  /** 전체 진행률 (0-100) */
  progress: number;
  /** 린트 반복 횟수 */
  lintIterations: number;
}

export type PipelineStage =
  | 'idle'
  | 'outline'
  | 'spec'
  | 'layout'
  | 'render'
  | 'lint'
  | 'fixing'
  | 'complete'
  | 'error';

export interface PipelineConfig {
  /** 자동 수정 활성화 */
  autoFix: boolean;
  /** 최대 린트 반복 횟수 */
  maxLintIterations: number;
  /** 린트 에러 시 중단 여부 */
  stopOnLintError: boolean;
  /** 출력 경로 */
  outputDir: string;
  /** slidespec.json 저장 여부 */
  saveSpec: boolean;
  /** 테마 설정 (템플릿에서 로드, raw JSON 또는 Theme 타입) */
  theme?: Theme | Record<string, unknown>;
  /** 슬라이드 크기 (인치 단위) */
  slideSize?: { width: number; height: number };
  /** 화면 비율 (16:9, 4:3, 16:10, A4) */
  aspectRatio?: string;
}
