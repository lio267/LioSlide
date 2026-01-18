import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { renderDeckWithHtml2Pptx } from '../../../src/renderer/html2pptxRenderer';
import type { DeckSpec, SlideSpec, ContentBlock, BulletListBlock } from '../../../src/types/slideSpec';

// BulletItem 타입 정의 (BulletListBlock의 items 요소)
type BulletItem = BulletListBlock['items'][number];

// 슬라이드 데이터 타입 (클라이언트에서 전달)
interface SlideData {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  keyMessage?: string;
  leftContent?: string[];
  rightContent?: string[];
}

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

// # 제거 헬퍼 함수
function stripHash(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  return color.replace(/^#/, '');
}

// 슬라이드 데이터를 DeckSpec으로 변환
function convertToDecKSpec(
  slidesData: SlideData[],
  templateId: string,
  topic: string,
  theme: Record<string, unknown> | null
): DeckSpec {
  const slides: SlideSpec[] = slidesData.map((slideData, index) => {
    const blocks: ContentBlock[] = [];

    // 불릿 포인트를 ContentBlock으로 변환
    if (slideData.bullets && slideData.bullets.length > 0) {
      const items = slideData.bullets.map((content) => ({
        content,
        level: 0,
      }));
      blocks.push({
        type: 'bulletList' as const,
        items,
        importance: 3,
      });
    }

    return {
      id: slideData.id || `slide-${index}`,
      type: slideData.type as SlideSpec['type'],
      title: slideData.title,
      subtitle: slideData.subtitle,
      keyMessage: slideData.keyMessage,
      blocks,
      constraints: {
        density: 'normal' as const,
        useAccentColor: false,
        backgroundStyle: 'solid' as const,
      },
      transition: 'none' as const,
    };
  });

  // 테마 설정 (# 제거하여 중복 방지)
  const themeColors = theme?.colors as Record<string, string> | undefined;

  return {
    metadata: {
      title: topic,
      author: '',
      company: '',
      version: '1.0',
      language: 'ko' as const,
    },
    createdAt: new Date().toISOString(),
    theme: {
      name: templateId,
      colors: {
        primary: stripHash(themeColors?.primary, '1791e8'),
        primaryLight: stripHash(themeColors?.primaryLight || themeColors?.secondary, '4ba8ed'),
        primaryDark: stripHash(themeColors?.primaryDark, '1273ba'),
        secondary: stripHash(themeColors?.secondary, 'f5f5f5'),
        surface: stripHash(themeColors?.background, 'ffffff'),
        surfaceForeground: stripHash(themeColors?.text, '1d1d1d'),
        muted: stripHash(themeColors?.backgroundAlt, 'f5f5f5'),
        mutedForeground: stripHash(themeColors?.textSecondary, '737373'),
        accent: stripHash(themeColors?.accent, 'f5f5f5'),
        border: stripHash(themeColors?.textLight, 'c8c8c8'),
      },
      fonts: {
        display: 'Arial',
        content: 'Arial',
        mono: 'Courier New',
      },
      grid: {
        canvas: { width: 13.333, height: 7.5 },
        safeMargin: 0.5,
        readableMargin: 0.7,
        columns: 12,
        gutter: 0.2,
        baselineUnit: 8,
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
    },
    slides,
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
    const body = await request.json();
    const { slidesData, templateId, topic } = body;

    if (!slidesData || !Array.isArray(slidesData) || slidesData.length === 0) {
      return NextResponse.json(
        { error: '슬라이드 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 테마 로드
    const theme = loadTheme(templateId || 'corporate-blue');
    console.log(`[API/regenerate] 템플릿: ${templateId}, 테마 로드: ${theme ? '성공' : '실패'}`);

    // DeckSpec 생성
    const deckSpec = convertToDecKSpec(
      slidesData,
      templateId || 'corporate-blue',
      topic || 'Presentation',
      theme
    );

    // 출력 디렉토리 확인
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 파일명 생성
    const fileName = `${sanitizeFilename(topic || 'presentation')}_edited.pptx`;
    const outputPath = path.join(outputDir, fileName);

    console.log(`[API/regenerate] PPT 재생성 시작`);
    const startTime = Date.now();

    // PPT 생성
    const result = await renderDeckWithHtml2Pptx(deckSpec, {
      outputPath,
      debug: false,
    });

    const duration = Date.now() - startTime;
    console.log(`[API/regenerate] PPT 재생성 완료: ${duration}ms`);

    if (!result.success || !result.outputPath) {
      return NextResponse.json(
        { error: result.error || 'PPT 재생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 파일 읽기 및 Base64 인코딩
    const fileBuffer = fs.readFileSync(result.outputPath);
    const fileContent = fileBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      fileName,
      fileContent,
      metadata: {
        slideCount: slidesData.length,
        duration,
      },
    });
  } catch (error) {
    console.error('[API/regenerate] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'PPT 재생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
