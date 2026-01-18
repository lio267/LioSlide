/**
 * MCP Sequential Thinking 실제 연동 테스트
 *
 * 이 스크립트는 Claude Code 환경에서 실행해야 합니다.
 * MCP Sequential Thinking 도구와 연동하여 아웃라인을 생성합니다.
 *
 * 사용법:
 * 1. Claude Code에서 이 파일을 열고
 * 2. "이 스크립트의 testMCPOutlineGeneration 함수를 실행해줘" 라고 요청
 */

import type {
  SequentialThinkingParams,
  SequentialThinkingExecutor,
  ThinkingStep,
} from '../src/agents/outlineAgent';
import {
  OutlineAgent,
  generateOutline,
  OUTLINE_THINKING_STEPS,
} from '../src/agents/outlineAgent';
import type { UserInput } from '../src/types/agents';
import type { Theme } from '../src/types/slideSpec';

// ============================================
// 1. 테스트 입력 정의
// ============================================

const TEST_INPUT: UserInput = {
  topic: 'AI 기술 트렌드 2025',
  tone: 'professional',
  audience: '기업 임원',
  slideCount: 8,
  sourceContent: `
    인공지능 기술은 빠르게 발전하고 있습니다.

    주요 트렌드:
    1. 생성형 AI (Generative AI)
       - GPT-4, Claude, Gemini 등 대형 언어 모델의 발전
       - 이미지, 비디오, 음악 생성 AI
       - 기업용 AI 어시스턴트

    2. AI 에이전트 (AI Agents)
       - 자율적으로 작업을 수행하는 AI
       - 멀티모달 에이전트
       - 도구 사용 능력

    3. 엣지 AI (Edge AI)
       - 디바이스에서 실행되는 AI
       - 프라이버시 보호
       - 실시간 처리

    4. AI 거버넌스
       - 윤리적 AI 개발
       - 규제 동향 (EU AI Act)
       - 책임 있는 AI

    5. 비즈니스 적용
       - 업무 자동화
       - 의사결정 지원
       - 고객 경험 개선
  `,
  additionalInstructions: '트렌드별 비즈니스 임팩트를 강조해주세요',
};

const DEFAULT_THEME: Theme = {
  name: 'default',
  colors: {
    primary: '1E3A8A',
    primaryLight: '3B82F6',
    primaryDark: '1a3278',
    secondary: 'F59E0B',
    surface: 'FFFFFF',
    surfaceForeground: '1F2937',
    muted: 'F3F4F6',
    mutedForeground: '6B7280',
    accent: 'F59E0B',
    border: 'E5E7EB',
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
    gutter: 0.25,
    columns: 12,
    baselineUnit: 0.25,
  },
};

// ============================================
// 2. MCP 연동 인터페이스
// ============================================

/**
 * MCP Sequential Thinking 응답 타입
 */
interface MCPSequentialThinkingResponse {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  branchId?: string;
  needsMoreThoughts?: boolean;
}

/**
 * MCP Sequential Thinking 호출 타입
 * Claude Code 환경에서 실제 도구 호출 시 사용
 */
type MCPToolCall = (params: SequentialThinkingParams) => Promise<MCPSequentialThinkingResponse>;

/**
 * MCP Sequential Thinking Executor 생성
 * Claude Code 환경에서 mcp__sequential-thinking__sequentialthinking 도구와 연동
 */
export function createRealMCPExecutor(
  mcpToolCall: MCPToolCall
): SequentialThinkingExecutor {
  return async (params: SequentialThinkingParams) => {
    try {
      console.log(`\n[MCP] Step ${params.thoughtNumber}/${params.totalThoughts}`);
      console.log(`[MCP] Thought: ${params.thought.substring(0, 100)}...`);

      const response = await mcpToolCall(params);

      console.log(`[MCP] Response received`);

      return {
        success: true,
        thought: response.thought || JSON.stringify(response),
      };
    } catch (error) {
      console.error('[MCP] Error:', error);
      return {
        success: false,
        thought: '',
      };
    }
  };
}

// ============================================
// 3. 테스트 함수
// ============================================

/**
 * MCP Sequential Thinking을 사용한 아웃라인 생성 테스트
 *
 * @param mcpToolCall - Claude Code에서 제공하는 MCP 도구 호출 함수
 * @returns 생성된 아웃라인
 *
 * @example
 * // Claude Code에서 실행 시
 * await testMCPOutlineGeneration(async (params) => {
 *   return await mcp__sequential-thinking__sequentialthinking(params);
 * });
 */
export async function testMCPOutlineGeneration(
  mcpToolCall: MCPToolCall
): Promise<void> {
  console.log('\n========================================');
  console.log('  MCP Sequential Thinking 연동 테스트');
  console.log('========================================\n');

  console.log('입력:');
  console.log(`  - 주제: ${TEST_INPUT.topic}`);
  console.log(`  - 청중: ${TEST_INPUT.audience}`);
  console.log(`  - 톤: ${TEST_INPUT.tone}`);
  console.log(`  - 슬라이드 수: ${TEST_INPUT.slideCount}\n`);

  // MCP Executor 생성
  const mcpExecutor = createRealMCPExecutor(mcpToolCall);

  console.log('MCP Sequential Thinking 시작...\n');

  try {
    // 아웃라인 생성
    const result = await generateOutline(
      { userInput: TEST_INPUT, theme: DEFAULT_THEME },
      {
        useMCP: true,
        mcpExecutor,
        debug: true,
      }
    );

    console.log('\n========================================');
    console.log('  생성 결과');
    console.log('========================================\n');

    console.log(`총 슬라이드: ${result.totalSlides}장\n`);

    console.log('아웃라인:');
    result.outline.forEach((slide, i) => {
      console.log(`\n  [${i + 1}] ${slide.type.toUpperCase()}`);
      console.log(`      제목: ${slide.title}`);
      console.log(`      핵심: ${slide.keyMessage}`);
      console.log(`      밀도: ${slide.estimatedDensity}`);
      if (slide.contentHints.length > 0) {
        console.log(`      힌트: ${slide.contentHints.join(', ')}`);
      }
    });

    console.log('\n섹션:');
    result.sections.forEach((section) => {
      console.log(`  - ${section.name}: 슬라이드 ${section.startIndex + 1}~${section.endIndex + 1}`);
    });

    if (result.thinkingLog) {
      console.log('\n사고 로그:');
      console.log(result.thinkingLog);
    }

    console.log('\n테스트 완료!');
  } catch (error) {
    console.error('\n테스트 실패:', error);
    throw error;
  }
}

/**
 * 시뮬레이션 모드로 테스트 (MCP 없이)
 */
export async function testSimulationMode(): Promise<void> {
  console.log('\n========================================');
  console.log('  시뮬레이션 모드 테스트 (MCP 없음)');
  console.log('========================================\n');

  const result = await generateOutline(
    { userInput: TEST_INPUT, theme: DEFAULT_THEME },
    { useMCP: false }
  );

  console.log(`총 슬라이드: ${result.totalSlides}장\n`);

  result.outline.forEach((slide, i) => {
    console.log(`[${i + 1}] ${slide.type}: ${slide.title}`);
  });

  console.log('\n테스트 완료!');
}

/**
 * 단계별 Sequential Thinking 데모
 * 각 단계가 어떻게 진행되는지 시각화
 */
export function demonstrateThinkingSteps(): void {
  console.log('\n========================================');
  console.log('  Sequential Thinking 단계 설명');
  console.log('========================================\n');

  OUTLINE_THINKING_STEPS.forEach((step, i) => {
    console.log(`Step ${i + 1}: ${step.name}`);
    console.log(`  설명: ${step.description}`);
    console.log('');
  });

  console.log('각 단계에서 MCP Sequential Thinking이 호출됩니다.');
  console.log('이전 단계의 결과가 다음 단계의 입력으로 전달됩니다.\n');
}

// ============================================
// 4. CLI 실행
// ============================================

// 시뮬레이션 모드로 테스트 실행
if (require.main === module) {
  console.log('\n시뮬레이션 모드로 테스트를 실행합니다.');
  console.log('실제 MCP 연동은 Claude Code에서 직접 호출해야 합니다.\n');

  demonstrateThinkingSteps();

  testSimulationMode()
    .then(() => {
      console.log('\n✅ 시뮬레이션 테스트 완료');
    })
    .catch((error) => {
      console.error('\n❌ 테스트 실패:', error);
      process.exit(1);
    });
}
