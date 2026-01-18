/**
 * HTML 슬라이드 생성기
 * 구조화된 콘텐츠를 HTML 슬라이드로 변환
 */

import * as fs from 'fs';
import * as path from 'path';
import { renderSlide, SlideData, SlideType } from './slideTemplates';

export interface PresentationInput {
  topic: string;
  audience: string;
  tone: 'professional' | 'casual' | 'creative' | 'academic';
  slideCount: number;
  content: string[];  // 요약된 콘텐츠 배열
  themeId: string;
}

export interface GeneratedSlide {
  index: number;
  filename: string;
  html: string;
  type: SlideType;
  hasPlaceholder: boolean;
}

// 테마 CSS 로드
export function loadThemeCSS(themeId: string): string {
  const themePath = path.join(process.cwd(), 'styles', 'themes', `${themeId}.css`);

  if (fs.existsSync(themePath)) {
    return fs.readFileSync(themePath, 'utf-8');
  }

  // 기본 테마
  return fs.readFileSync(
    path.join(process.cwd(), 'styles', 'themes', 'corporate-blue.css'),
    'utf-8'
  );
}

/**
 * 프레젠테이션 슬라이드 생성
 */
export function generatePresentation(input: PresentationInput): GeneratedSlide[] {
  const themeCSS = loadThemeCSS(input.themeId);
  const slides: GeneratedSlide[] = [];

  // 슬라이드 구조 결정
  const structure = planSlideStructure(input);

  structure.forEach((slideData, index) => {
    const html = renderSlide(slideData, themeCSS);
    const filename = `slide-${String(index + 1).padStart(2, '0')}.html`;

    slides.push({
      index,
      filename,
      html,
      type: slideData.type,
      hasPlaceholder: slideData.type === 'chart',
    });
  });

  return slides;
}

/**
 * 슬라이드 구조 계획
 */
function planSlideStructure(input: PresentationInput): SlideData[] {
  const slides: SlideData[] = [];
  const contentItems = input.content;
  const totalSlides = input.slideCount;

  // 1. 타이틀 슬라이드
  slides.push({
    type: 'title',
    title: input.topic,
    subtitle: `${input.audience}을 위한 프레젠테이션`,
  });

  // 2. 콘텐츠 슬라이드들 (전체의 70-80%)
  const contentSlideCount = Math.floor((totalSlides - 2) * 0.8);
  const itemsPerSlide = Math.ceil(contentItems.length / contentSlideCount);

  let currentItemIndex = 0;
  let slideNumber = 1;

  for (let i = 0; i < contentSlideCount && currentItemIndex < contentItems.length; i++) {
    const slideItems = contentItems.slice(currentItemIndex, currentItemIndex + itemsPerSlide);
    currentItemIndex += itemsPerSlide;

    // 다양한 레이아웃 사용
    if (i === 0 && slideItems.length >= 4) {
      // 첫 번째 콘텐츠는 2단 레이아웃
      const mid = Math.ceil(slideItems.length / 2);
      slides.push({
        type: 'twoColumn',
        title: `핵심 포인트 ${slideNumber}`,
        leftContent: slideItems.slice(0, mid),
        rightContent: slideItems.slice(mid),
      });
    } else if (i === 1 && slideItems.length >= 2) {
      // 두 번째는 차트 슬라이드 (placeholder)
      slides.push({
        type: 'chart',
        title: `데이터 분석 ${slideNumber}`,
        content: slideItems.slice(0, 3),
        chartPlaceholder: true,
      });
    } else {
      // 나머지는 일반 콘텐츠
      slides.push({
        type: 'content',
        title: `${input.topic} - ${slideNumber}`,
        content: slideItems,
      });
    }
    slideNumber++;
  }

  // 3. 인용문 슬라이드 (선택적)
  if (totalSlides > 5) {
    slides.push({
      type: 'quote',
      quoteText: getInspiringQuote(input.tone),
      quoteAuthor: '업계 전문가',
    });
  }

  // 4. 클로징 슬라이드
  slides.push({
    type: 'closing',
    title: '감사합니다',
    subtitle: '질문이 있으시면 말씀해 주세요',
  });

  // 슬라이드 수 조정
  while (slides.length < totalSlides && contentItems.length > 0) {
    const extraItems = contentItems.slice(0, 3);
    slides.splice(slides.length - 1, 0, {
      type: 'content',
      title: `추가 정보`,
      content: extraItems,
    });
  }

  return slides.slice(0, totalSlides);
}

/**
 * 톤에 맞는 인용문 반환
 */
function getInspiringQuote(tone: string): string {
  const quotes: Record<string, string> = {
    professional: '성공은 준비와 기회가 만나는 곳에서 시작됩니다.',
    casual: '변화를 두려워하지 마세요. 변화가 없으면 성장도 없습니다.',
    creative: '상상력은 지식보다 중요합니다. 지식은 한계가 있지만, 상상력은 세상을 품습니다.',
    academic: '데이터는 새로운 석유입니다. 하지만 정제되지 않으면 가치가 없습니다.',
  };

  return quotes[tone] || quotes.professional;
}

/**
 * HTML 파일들을 디렉토리에 저장
 */
export function saveSlides(slides: GeneratedSlide[], outputDir: string): string[] {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const savedPaths: string[] = [];

  for (const slide of slides) {
    const filePath = path.join(outputDir, slide.filename);
    fs.writeFileSync(filePath, slide.html, 'utf-8');
    savedPaths.push(filePath);
  }

  return savedPaths;
}
