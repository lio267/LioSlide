import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { runParallelPipeline } from '../../../src/orchestrator/parallelOrchestrator';
import type { UserInput, PresentationTone } from '../../../src/types/agents';

// 유효한 톤 목록
const VALID_TONES: PresentationTone[] = [
  'professional',
  'casual',
  'creative',
  'academic',
  'minimal',
  'energetic',
  'luxury',
];

// 템플릿 ID 목록
const VALID_TEMPLATES = [
  'corporate-blue',
  'minimal-white',
  'creative-yellow',
  'dark-professional',
  'soft-gradient',
  'modern-teal',
  'toss-blue',
  'vercel-mono',
  'supabase-green',
  'claude-coral',
  'cyberpunk-neon',
  'twitter-blue',
  'mono-minimal',
];

// 화면 비율 목록
const VALID_ASPECT_RATIOS = ['16:9', '4:3', '16:10', 'A4'];

// 화면 비율별 크기 (인치 단위로 pptxgenjs에서 사용)
const ASPECT_RATIO_SIZES: Record<string, { width: number; height: number }> = {
  '16:9': { width: 13.33, height: 7.5 },   // 와이드스크린 (기본)
  '4:3': { width: 10, height: 7.5 },       // 표준
  '16:10': { width: 13.33, height: 8.33 }, // 와이드
  'A4': { width: 8.27, height: 11.69 },    // A4 세로
};

// 테마 로드 함수
function loadTheme(templateId: string): Record<string, unknown> | null {
  const themePath = path.join(process.cwd(), 'themes', `${templateId}.json`);
  if (fs.existsSync(themePath)) {
    try {
      const themeContent = fs.readFileSync(themePath, 'utf-8');
      return JSON.parse(themeContent);
    } catch {
      console.warn(`[API] 테마 로드 실패: ${templateId}`);
    }
  }
  return null;
}

// 입력 유효성 검사
function validateInput(body: Record<string, unknown>): {
  valid: boolean;
  error?: string;
  data?: UserInput;
  templateId?: string;
  aspectRatio?: string;
} {
  const { topic, audience, tone, slideCount, sourceContent, templateId, aspectRatio } = body;

  // 필수 필드 검사
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return { valid: false, error: '주제를 입력해주세요.' };
  }
  if (!audience || typeof audience !== 'string' || audience.trim().length === 0) {
    return { valid: false, error: '청중을 입력해주세요.' };
  }

  // 톤 검사
  const validTone = VALID_TONES.includes(tone as PresentationTone)
    ? (tone as PresentationTone)
    : 'professional';

  // 슬라이드 수 검사
  let validSlideCount = typeof slideCount === 'number' ? slideCount : 10;
  validSlideCount = Math.max(5, Math.min(20, validSlideCount));

  // 원문은 선택적
  const validSourceContent =
    typeof sourceContent === 'string' ? sourceContent : undefined;

  // 템플릿 ID 검사
  const validTemplateId = VALID_TEMPLATES.includes(templateId as string)
    ? (templateId as string)
    : 'corporate-blue';

  // 화면 비율 검사
  const validAspectRatio = VALID_ASPECT_RATIOS.includes(aspectRatio as string)
    ? (aspectRatio as string)
    : '16:9';

  return {
    valid: true,
    data: {
      topic: topic.trim(),
      audience: audience.trim(),
      tone: validTone,
      slideCount: validSlideCount,
      sourceContent: validSourceContent,
    },
    templateId: validTemplateId,
    aspectRatio: validAspectRatio,
  };
}

// 파일명 정규화
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9가-힣\s-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();

    // 입력 유효성 검사
    const validation = validateInput(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { error: validation.error || '유효하지 않은 입력입니다.' },
        { status: 400 }
      );
    }

    const userInput = validation.data;
    const templateId = validation.templateId || 'corporate-blue';
    const aspectRatio = validation.aspectRatio || '16:9';
    const slideSize = ASPECT_RATIO_SIZES[aspectRatio] || ASPECT_RATIO_SIZES['16:9'];

    // 테마 로드
    const theme = loadTheme(templateId);
    console.log(`[API] 템플릿: ${templateId}, 테마 로드: ${theme ? '성공' : '실패'}, 화면 비율: ${aspectRatio}`);

    // 출력 디렉토리 확인
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // PPT 생성
    console.log(`[API] PPT 생성 시작: ${userInput.topic}`);
    const startTime = Date.now();

    const result = await runParallelPipeline(userInput, {
      parallel: true,
      debug: true,
      config: {
        outputDir,
        autoFix: true,
        maxLintIterations: 3,
        stopOnLintError: false,
        theme: theme || undefined,
        slideSize,
        aspectRatio,
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[API] PPT 생성 완료: ${duration}ms`);

    // 결과 확인
    if (!result.success || !result.outputPath) {
      return NextResponse.json(
        {
          error: result.error || 'PPT 생성에 실패했습니다.',
          details: {
            lintPassed: result.lintPassed,
            lintIterations: result.lintIterations,
            duration: result.duration,
          },
        },
        { status: 500 }
      );
    }

    // 파일 읽기 및 Base64 인코딩
    const filePath = result.outputPath;

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '생성된 파일을 찾을 수 없습니다.' },
        { status: 500 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileContent = fileBuffer.toString('base64');
    const fileName = path.basename(filePath);

    // 슬라이드 데이터 추출 (미리보기/편집용)
    const slidesData = result.deckSpec?.slides.map((slide, index) => {
      // 불릿 포인트 추출
      const bullets: string[] = [];
      const leftContent: string[] = [];
      const rightContent: string[] = [];

      if (slide.blocks) {
        slide.blocks.forEach((block) => {
          if (block.type === 'bulletList' && block.items) {
            block.items.forEach((item) => {
              if (item.content) bullets.push(item.content);
            });
          } else if (block.type === 'text' && block.content) {
            bullets.push(block.content);
          }
        });
      }

      return {
        id: slide.id || `slide-${index}`,
        type: slide.type || 'content',
        title: slide.title || '',
        subtitle: slide.subtitle || '',
        bullets: bullets.length > 0 ? bullets : undefined,
        keyMessage: slide.keyMessage || '',
        leftContent: leftContent.length > 0 ? leftContent : undefined,
        rightContent: rightContent.length > 0 ? rightContent : undefined,
      };
    }) || [];

    // 성공 응답
    return NextResponse.json({
      success: true,
      fileName,
      fileContent,
      slidesData,
      themeColor: ((theme as Record<string, Record<string, unknown>>)?.colors?.primary as string) || '1791e8',
      metadata: {
        templateId,
        templateName: (theme as Record<string, unknown>)?.nameKo || templateId,
        slideCount: result.deckSpec?.slides.length || 0,
        lintPassed: result.lintPassed,
        lintIterations: result.lintIterations,
        duration: result.duration,
      },
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'PPT 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
