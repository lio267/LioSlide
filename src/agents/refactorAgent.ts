/**
 * Refactor Agent - 코드 구조 관리 서브에이전트
 * 
 * 역할:
 * 1. PPT 렌더러/레이아웃 엔진 코드 구조 정리
 * 2. 중복 제거, 타입 강화, 테스트 추가
 * 3. 확장 가능한 컴포넌트 형태로 모듈화
 * 
 * 핵심 원칙:
 * - "스펙-레이아웃-렌더" 레이어 침범 금지
 * - pptxgenjs 호출은 Renderer 레이어에서만
 */

import type {
  RefactorAgentInput,
  RefactorAgentOutput,
  RefactorSuggestion,
  RefactorCheckType,
} from '../types/agents';

// ============================================
// 1. 레이어 정의
// ============================================

export const LAYERS = {
  SPEC: {
    name: 'spec',
    description: 'SlideSpec/DeckSpec 정의 및 변환',
    allowedImports: ['zod', 'uuid'],
    forbiddenImports: ['pptxgenjs', '@ant/html2pptx'],
    directories: ['types', 'agents/outline', 'agents/specBuilder'],
  },
  LAYOUT: {
    name: 'layout',
    description: '레이아웃 계산 및 좌표 배치',
    allowedImports: ['types/*'],
    forbiddenImports: ['pptxgenjs', '@ant/html2pptx'],
    directories: ['engine/layout'],
  },
  RENDER: {
    name: 'render',
    description: 'pptxgenjs를 통한 실제 PPT 생성',
    allowedImports: ['pptxgenjs', '@ant/html2pptx', 'types/*'],
    forbiddenImports: [],
    directories: ['renderer'],
  },
} as const;

export type LayerName = keyof typeof LAYERS;

// ============================================
// 2. 컴포넌트 패턴 정의
// ============================================

export const COMPONENT_PATTERNS = {
  /** 슬라이드 컴포넌트 기본 구조 */
  slideComponent: {
    namePattern: /^[A-Z][a-zA-Z]+Slide$/,
    requiredMethods: ['render', 'getLayout'],
    example: `
export class TitleSlide implements SlideComponent {
  constructor(private spec: SlideSpec) {}
  
  getLayout(theme: Theme): LayoutedSlide {
    // 레이아웃 계산 (좌표 결정)
  }
  
  render(pptx: PptxGenJS, layout: LayoutedSlide): void {
    // pptxgenjs 호출
  }
}`,
  },
  
  /** 블록 컴포넌트 기본 구조 */
  blockComponent: {
    namePattern: /^[A-Z][a-zA-Z]+Block$/,
    requiredMethods: ['measure', 'render'],
    example: `
export class TextBlock implements BlockComponent {
  constructor(private spec: TextBlockSpec) {}
  
  measure(constraints: BoxConstraints): BoundingBox {
    // 크기 계산
  }
  
  render(slide: PptxSlide, box: BoundingBox): void {
    // pptxgenjs 호출
  }
}`,
  },
} as const;

// ============================================
// 3. Refactor Agent 클래스
// ============================================

export class RefactorAgent {
  private codePaths: string[];
  private checkTypes: RefactorCheckType[];
  
  constructor(input: RefactorAgentInput) {
    this.codePaths = input.codePaths;
    this.checkTypes = input.checkTypes;
  }
  
  /**
   * 전체 리팩터링 검사 실행
   */
  public analyze(): RefactorAgentOutput {
    const suggestions: RefactorSuggestion[] = [];
    const layerViolations: RefactorAgentOutput['layerViolations'] = [];
    
    // 검사 유형별 실행
    if (this.checkTypes.includes('layer-violation')) {
      layerViolations.push(...this.checkLayerViolations());
    }
    
    if (this.checkTypes.includes('duplicate-code')) {
      suggestions.push(...this.checkDuplicateCode());
    }
    
    if (this.checkTypes.includes('type-safety')) {
      suggestions.push(...this.checkTypeSafety());
    }
    
    if (this.checkTypes.includes('code-smell')) {
      suggestions.push(...this.checkCodeSmells());
    }
    
    return {
      suggestions,
      layerViolations,
    };
  }
  
  // ==========================================
  // 레이어 침범 검사
  // ==========================================
  
  private checkLayerViolations(): RefactorAgentOutput['layerViolations'] {
    const violations: RefactorAgentOutput['layerViolations'] = [];
    
    // 레이어별 금지된 import 검사
    const layerRules = [
      {
        layer: 'spec' as const,
        forbidden: ['pptxgenjs', 'html2pptx'],
        directories: ['types/', 'agents/outline', 'agents/specBuilder'],
      },
      {
        layer: 'layout' as const,
        forbidden: ['pptxgenjs', 'html2pptx'],
        directories: ['engine/layout'],
      },
    ];
    
    layerRules.forEach(rule => {
      rule.forbidden.forEach(forbiddenImport => {
        // 실제 구현에서는 파일 시스템을 스캔하여 import 검사
        // 여기서는 검사 로직의 구조만 정의
      });
    });
    
    return violations;
  }
  
  // ==========================================
  // 중복 코드 검사
  // ==========================================
  
  private checkDuplicateCode(): RefactorSuggestion[] {
    const suggestions: RefactorSuggestion[] = [];
    
    // 중복 패턴 정의
    const duplicatePatterns = [
      {
        pattern: 'repeated-layout-calculation',
        description: '레이아웃 계산 로직이 여러 곳에서 반복됨',
        fix: 'Layout Engine으로 통합',
      },
      {
        pattern: 'repeated-pptx-calls',
        description: 'pptxgenjs 호출이 여러 컴포넌트에서 반복됨',
        fix: 'BaseSlideRenderer로 추상화',
      },
      {
        pattern: 'repeated-color-parsing',
        description: '색상 파싱 로직이 분산됨',
        fix: 'ColorUtils로 통합',
      },
    ];
    
    // 실제 구현에서는 AST 분석을 통해 중복 탐지
    
    return suggestions;
  }
  
  // ==========================================
  // 타입 안전성 검사
  // ==========================================
  
  private checkTypeSafety(): RefactorSuggestion[] {
    const suggestions: RefactorSuggestion[] = [];
    
    // 타입 안전성 규칙
    const typeRules = [
      {
        rule: 'no-any',
        description: 'any 타입 사용 금지',
        severity: 'error' as const,
      },
      {
        rule: 'strict-null-checks',
        description: 'null/undefined 체크 필수',
        severity: 'error' as const,
      },
      {
        rule: 'zod-validation',
        description: '외부 입력은 반드시 zod로 검증',
        severity: 'warning' as const,
      },
    ];
    
    return suggestions;
  }
  
  // ==========================================
  // 코드 스멜 검사
  // ==========================================
  
  private checkCodeSmells(): RefactorSuggestion[] {
    const suggestions: RefactorSuggestion[] = [];
    
    // 코드 스멜 패턴
    const smellPatterns = [
      {
        smell: 'long-method',
        threshold: 50, // 50줄 이상
        suggestion: '메서드 분리',
      },
      {
        smell: 'large-class',
        threshold: 300, // 300줄 이상
        suggestion: '클래스 분리',
      },
      {
        smell: 'deep-nesting',
        threshold: 4, // 4단계 이상
        suggestion: 'Early return 또는 메서드 추출',
      },
      {
        smell: 'magic-number',
        suggestion: '상수로 추출',
      },
    ];
    
    return suggestions;
  }
}

// ============================================
// 4. 컴포넌트 템플릿 생성기
// ============================================

export const ComponentTemplates = {
  /**
   * 슬라이드 컴포넌트 템플릿 생성
   */
  generateSlideComponent: (name: string): string => `
import type { SlideSpec, Theme, LayoutedSlide, BoundingBox } from '../types/slideSpec';
import type PptxGenJS from 'pptxgenjs';

export interface ${name}Props {
  spec: SlideSpec;
  theme: Theme;
}

export class ${name} {
  private spec: SlideSpec;
  private theme: Theme;
  
  constructor({ spec, theme }: ${name}Props) {
    this.spec = spec;
    this.theme = theme;
  }
  
  /**
   * 레이아웃 계산 (Layout Layer)
   * - 좌표는 여기서만 결정
   * - pptxgenjs 호출 금지
   */
  getLayout(): LayoutedSlide {
    const { grid } = this.theme;
    
    // TODO: 레이아웃 계산 로직
    return {
      slideId: this.spec.id,
      blocks: [],
    };
  }
  
  /**
   * 렌더링 (Render Layer)
   * - pptxgenjs 호출은 여기서만
   * - 좌표 계산 금지 (getLayout 결과 사용)
   */
  render(pptx: PptxGenJS, layout: LayoutedSlide): void {
    const slide = pptx.addSlide();
    
    // TODO: 렌더링 로직
  }
}
`,

  /**
   * 블록 컴포넌트 템플릿 생성
   */
  generateBlockComponent: (name: string): string => `
import type { ContentBlock, BoundingBox } from '../types/slideSpec';

export interface ${name}Props {
  block: ContentBlock;
}

export interface BoxConstraints {
  maxWidth: number;
  maxHeight: number;
  minWidth?: number;
  minHeight?: number;
}

export class ${name} {
  private block: ContentBlock;
  
  constructor({ block }: ${name}Props) {
    this.block = block;
  }
  
  /**
   * 크기 측정 (Layout Layer)
   */
  measure(constraints: BoxConstraints): BoundingBox {
    // TODO: 크기 계산 로직
    return {
      x: 0,
      y: 0,
      width: constraints.maxWidth,
      height: 0,
    };
  }
  
  /**
   * 렌더링 (Render Layer)
   */
  render(slide: any, box: BoundingBox): void {
    // TODO: pptxgenjs 렌더링 로직
  }
}
`,
};

// ============================================
// 5. 실행 함수
// ============================================

export function runRefactorAgent(input: RefactorAgentInput): RefactorAgentOutput {
  const agent = new RefactorAgent(input);
  return agent.analyze();
}
