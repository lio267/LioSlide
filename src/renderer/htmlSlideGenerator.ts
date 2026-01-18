/**
 * HTML Slide Generator - html2pptx Global CSS Framework 기반
 *
 * 핵심 원칙:
 * - html2pptx의 global.css가 자동 주입됨
 * - :root에서 CSS 변수만 오버라이드
 * - 유틸리티 클래스 사용 (.bg-primary, .text-5xl 등)
 */

import type { DeckSpec, SlideSpec, ContentBlock, Theme, ChartBlock, TableBlock } from '../types/slideSpec';

// ============================================
// Type Definitions
// ============================================

export interface HTMLSlideOutput {
  slideIndex: number;
  filename: string;
  html: string;
  slideType: string;
  hasPlaceholder: boolean;
  placeholderData?: PlaceholderInfo[];
}

export interface PlaceholderInfo {
  id: string;
  type: 'chart' | 'table' | 'image';
  data?: ChartBlock | TableBlock;
}

export interface HTMLSlideOptions {
  slideSize?: { width: number; height: number };
}

// ============================================
// Constants
// ============================================

const DEFAULT_SLIDE_SIZE = { width: 13.333, height: 7.5 };
const DPI = 96;

// ============================================
// CSS Variables Override (테마 색상 주입)
// ============================================

function generateThemeCSS(theme: Theme): string {
  const c = theme.colors;

  // html2pptx global.css의 CSS 변수 이름에 맞춰 오버라이드
  return `
<style>
:root {
  --color-primary: #${c.primary};
  --color-primary-light: #${c.primaryLight};
  --color-primary-dark: #${c.primaryDark};
  --color-primary-foreground: #FFFFFF;

  --color-surface: #${c.surface};
  --color-surface-foreground: #${c.surfaceForeground};

  --color-secondary: #${c.secondary};
  --color-secondary-foreground: #${c.surfaceForeground};

  --color-muted: #${c.muted};
  --color-muted-foreground: #${c.mutedForeground};

  --color-accent: #${c.accent};
  --color-accent-foreground: #FFFFFF;

  --color-border: #${c.border};

  --font-family-display: ${theme.fonts.display}, Arial, sans-serif;
  --font-family-content: ${theme.fonts.content}, Arial, sans-serif;
}
</style>`;
}

// ============================================
// Main Entry Point
// ============================================

export function generateHTMLSlides(
  deckSpec: DeckSpec,
  outputDir: string,
  options?: HTMLSlideOptions
): HTMLSlideOutput[] {
  const slides: HTMLSlideOutput[] = [];

  const slideSize = options?.slideSize || DEFAULT_SLIDE_SIZE;
  const pixelWidth = Math.round(slideSize.width * DPI);
  const pixelHeight = Math.round(slideSize.height * DPI);

  deckSpec.slides.forEach((slide, index) => {
    const { html, placeholders } = generateSlideHTML(
      slide,
      deckSpec.theme,
      index,
      pixelWidth,
      pixelHeight
    );
    const filename = `slide-${String(index + 1).padStart(2, '0')}.html`;

    slides.push({
      slideIndex: index,
      filename,
      html,
      slideType: slide.type,
      hasPlaceholder: placeholders.length > 0,
      placeholderData: placeholders.length > 0 ? placeholders : undefined,
    });
  });

  return slides;
}

// ============================================
// Slide HTML Generation
// ============================================

function generateSlideHTML(
  slide: SlideSpec,
  theme: Theme,
  index: number,
  pixelWidth: number,
  pixelHeight: number
): { html: string; placeholders: PlaceholderInfo[] } {
  const placeholders: PlaceholderInfo[] = [];
  const themeCSS = generateThemeCSS(theme);
  const content = renderSlideByType(slide, theme, placeholders);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${pixelWidth}, height=${pixelHeight}">
  <title>Slide ${index + 1}</title>
  ${themeCSS}
</head>
<body style="width: ${pixelWidth}px; height: ${pixelHeight}px;">
${content}
</body>
</html>`;

  return { html, placeholders };
}

// ============================================
// Slide Type Renderers
// ============================================

function renderSlideByType(
  slide: SlideSpec,
  theme: Theme,
  placeholders: PlaceholderInfo[]
): string {
  switch (slide.type) {
    case 'title':
      return renderTitleSlide(slide, theme);
    case 'sectionTitle':
      return renderSectionSlide(slide, theme);
    case 'closing':
    case 'qna':
      return renderClosingSlide(slide, theme);
    case 'agenda':
      return renderAgendaSlide(slide, theme);
    case 'twoColumn':
      return renderTwoColumnSlide(slide, theme, placeholders);
    case 'comparison':
      return renderComparisonSlide(slide, theme, placeholders);
    case 'summary':
      return renderSummarySlide(slide, theme);
    default:
      return renderContentSlide(slide, theme, placeholders);
  }
}

// ============================================
// TITLE SLIDE - Primary 배경, 중앙 정렬
// ============================================

function renderTitleSlide(slide: SlideSpec, theme: Theme): string {
  const title = escapeHtml(slide.title || '');
  const subtitle = escapeHtml(slide.subtitle || '');

  return `
  <div class="col center bg-primary h-full" style="padding: 60px;">
    <h1 class="text-5xl text-primary-foreground" style="text-align: center; font-weight: 700; margin-bottom: 24px;">${title}</h1>
    ${subtitle ? `<p class="text-xl text-primary-foreground" style="text-align: center; opacity: 0.85;">${subtitle}</p>` : ''}
  </div>`;
}

// ============================================
// SECTION SLIDE - Primary 배경
// ============================================

function renderSectionSlide(slide: SlideSpec, theme: Theme): string {
  const title = escapeHtml(slide.title || '');

  return `
  <div class="col center bg-primary h-full">
    <h2 class="text-4xl text-primary-foreground" style="text-align: center; font-weight: 600;">${title}</h2>
  </div>`;
}

// ============================================
// CLOSING SLIDE - Primary 배경
// ============================================

function renderClosingSlide(slide: SlideSpec, theme: Theme): string {
  const title = escapeHtml(slide.title || '감사합니다');
  const message = escapeHtml(slide.keyMessage || '');

  return `
  <div class="col center bg-primary h-full" style="padding: 60px;">
    <h1 class="text-5xl text-primary-foreground" style="text-align: center; font-weight: 700; margin-bottom: 24px;">${title}</h1>
    ${message ? `<p class="text-xl text-primary-foreground" style="text-align: center; opacity: 0.85;">${message}</p>` : ''}
  </div>`;
}

// ============================================
// AGENDA SLIDE - 목차
// ============================================

function renderAgendaSlide(slide: SlideSpec, theme: Theme): string {
  const title = escapeHtml(slide.title || '목차');
  const blocks = slide.blocks || [];

  const bulletBlock = blocks.find(b => b.type === 'bulletList');
  const items = bulletBlock?.type === 'bulletList' ? bulletBlock.items : [];

  const itemsHtml = items.map((item, idx) => `
    <div class="row" style="align-items: center; gap: 20px; padding: 16px 0;">
      <div class="bg-primary" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <p class="text-primary-foreground" style="font-weight: 700; font-size: 18px;">${idx + 1}</p>
      </div>
      <p class="text-xl text-surface-foreground">${escapeHtml(item.content || '')}</p>
    </div>
  `).join('');

  return `
  <div class="row bg-surface h-full">
    <!-- 왼쪽 Primary 액센트 바 -->
    <div class="bg-primary" style="width: 12px;"></div>

    <!-- 콘텐츠 영역 -->
    <div class="col fill-width" style="padding: 48px 60px;">
      <!-- 제목 -->
      <div style="margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid var(--color-primary);">
        <h2 class="text-3xl text-primary" style="font-weight: 700;">${title}</h2>
      </div>

      <!-- 목차 항목 -->
      <div class="col" style="gap: 8px;">
        ${itemsHtml}
      </div>
    </div>
  </div>`;
}

// ============================================
// CONTENT SLIDE - 일반 콘텐츠
// ============================================

function renderContentSlide(
  slide: SlideSpec,
  theme: Theme,
  placeholders: PlaceholderInfo[]
): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];

  // 차트/테이블이 있으면 2컬럼 레이아웃
  const hasChart = blocks.some(b => b.type === 'chart');
  const hasTable = blocks.some(b => b.type === 'table');
  if (hasChart || hasTable) {
    return renderTwoColumnWithPlaceholder(slide, theme, placeholders);
  }

  const contentHTML = renderContentBlocks(blocks, theme);

  return `
  <div class="row bg-surface h-full">
    <!-- 왼쪽 Primary 액센트 바 -->
    <div class="bg-primary" style="width: 12px;"></div>

    <!-- 콘텐츠 영역 -->
    <div class="col fill-width" style="padding: 48px 60px;">
      <!-- 제목 -->
      <div style="margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid var(--color-primary);">
        <h2 class="text-3xl text-primary" style="font-weight: 700;">${title}</h2>
      </div>

      <!-- 본문 -->
      <div class="col fill-height" style="justify-content: flex-start; gap: 16px;">
        ${contentHTML}
      </div>
    </div>
  </div>`;
}

// ============================================
// TWO COLUMN SLIDE
// ============================================

function renderTwoColumnSlide(
  slide: SlideSpec,
  theme: Theme,
  placeholders: PlaceholderInfo[]
): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];

  const midPoint = Math.ceil(blocks.length / 2);
  const leftBlocks = blocks.slice(0, midPoint);
  const rightBlocks = blocks.slice(midPoint);

  const leftContent = renderContentBlocks(leftBlocks, theme);
  const rightContent = renderContentBlocks(rightBlocks, theme);

  return `
  <div class="row bg-surface h-full">
    <div class="bg-primary" style="width: 12px;"></div>

    <div class="col fill-width" style="padding: 48px 60px;">
      <!-- 제목 -->
      <div style="margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid var(--color-primary);">
        <h2 class="text-3xl text-primary" style="font-weight: 700;">${title}</h2>
      </div>

      <!-- 2컬럼 본문 -->
      <div class="row fill-height" style="gap: 40px;">
        <div class="col fill-width" style="gap: 12px;">
          ${leftContent}
        </div>
        <div style="width: 1px; background: var(--color-border);"></div>
        <div class="col fill-width" style="gap: 12px;">
          ${rightContent}
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================
// COMPARISON SLIDE
// ============================================

function renderComparisonSlide(
  slide: SlideSpec,
  theme: Theme,
  placeholders: PlaceholderInfo[]
): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];

  const items = blocks.filter(b => b.type === 'text' || b.type === 'bulletList');
  const half = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, half);
  const rightItems = items.slice(half);

  const leftContent = renderContentBlocks(leftItems, theme);
  const rightContent = renderContentBlocks(rightItems, theme);

  return `
  <div class="row bg-surface h-full">
    <div class="bg-primary" style="width: 12px;"></div>

    <div class="col fill-width" style="padding: 48px 60px;">
      <!-- 제목 -->
      <div style="margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid var(--color-primary);">
        <h2 class="text-3xl text-primary" style="font-weight: 700;">${title}</h2>
      </div>

      <!-- 비교 카드 -->
      <div class="row fill-height" style="gap: 24px;">
        <div class="col fill-width bg-muted rounded" style="padding: 28px;">
          ${leftContent}
        </div>
        <div class="col fill-width bg-muted rounded" style="padding: 28px;">
          ${rightContent}
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================
// SUMMARY SLIDE
// ============================================

function renderSummarySlide(slide: SlideSpec, theme: Theme): string {
  const title = escapeHtml(slide.title || '요약');
  const blocks = slide.blocks || [];

  const contentHTML = renderContentBlocks(blocks, theme);

  return `
  <div class="row bg-surface h-full">
    <div class="bg-primary" style="width: 12px;"></div>

    <div class="col fill-width" style="padding: 48px 60px;">
      <!-- 제목 -->
      <div style="margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid var(--color-primary);">
        <h2 class="text-3xl text-primary" style="font-weight: 700;">${title}</h2>
      </div>

      <!-- 요약 내용 -->
      <div class="col fill-height" style="justify-content: flex-start; gap: 16px;">
        ${contentHTML}
      </div>
    </div>
  </div>`;
}

// ============================================
// TWO COLUMN WITH PLACEHOLDER (Chart/Table)
// ============================================

function renderTwoColumnWithPlaceholder(
  slide: SlideSpec,
  theme: Theme,
  placeholders: PlaceholderInfo[]
): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];

  const textBlocks = blocks.filter(b => b.type === 'text' || b.type === 'bulletList');
  const chartBlock = blocks.find(b => b.type === 'chart') as ChartBlock | undefined;
  const tableBlock = blocks.find(b => b.type === 'table') as TableBlock | undefined;

  const textContent = renderContentBlocks(textBlocks, theme);

  let placeholderId = '';
  if (chartBlock) {
    placeholderId = `chart-${slide.id}`;
    placeholders.push({ id: placeholderId, type: 'chart', data: chartBlock });
  } else if (tableBlock) {
    placeholderId = `table-${slide.id}`;
    placeholders.push({ id: placeholderId, type: 'table', data: tableBlock });
  }

  return `
  <div class="row bg-surface h-full">
    <div class="bg-primary" style="width: 12px;"></div>

    <div class="col fill-width" style="padding: 48px 60px;">
      <!-- 제목 -->
      <div style="margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid var(--color-primary);">
        <h2 class="text-3xl text-primary" style="font-weight: 700;">${title}</h2>
      </div>

      <!-- 30/70 분할 레이아웃 -->
      <div class="row fill-height" style="gap: 32px;">
        <div class="col" style="width: 35%; gap: 16px;">
          ${textContent || `<p class="text-muted-foreground">내용을 입력하세요</p>`}
        </div>
        <div class="col fill-width bg-muted rounded" style="min-height: 300px;" id="${placeholderId}">
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================
// Content Block Renderers
// ============================================

function renderContentBlocks(blocks: ContentBlock[], theme: Theme): string {
  return blocks.map(block => renderBlock(block, theme)).join('\n');
}

function renderBlock(block: ContentBlock, theme: Theme): string {
  switch (block.type) {
    case 'text':
      return renderTextBlock(block, theme);
    case 'bulletList':
      return renderBulletListBlock(block, theme);
    default:
      return '';
  }
}

function renderTextBlock(block: ContentBlock, theme: Theme): string {
  if (block.type !== 'text') return '';

  const content = escapeHtml(block.content || '');
  const importance = block.importance || 3;

  if (importance >= 5) {
    return `<p class="text-2xl text-primary" style="font-weight: 600; margin-bottom: 12px;">${content}</p>`;
  } else if (importance >= 4) {
    return `<p class="text-xl text-surface-foreground" style="font-weight: 500; margin-bottom: 8px;">${content}</p>`;
  }
  return `<p class="text-lg text-surface-foreground" style="line-height: 1.6; margin-bottom: 8px;">${content}</p>`;
}

function renderBulletListBlock(block: ContentBlock, theme: Theme): string {
  if (block.type !== 'bulletList' || !block.items) return '';

  const items = block.items.map(item => {
    const content = escapeHtml(item.content || '');
    const level = item.level || 0;
    const indent = level * 24;
    const bulletSize = level === 0 ? 10 : 8;
    const opacity = level === 0 ? 1 : 0.7;

    return `
      <li style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; padding-left: ${indent}px;">
        <div class="bg-primary" style="width: ${bulletSize}px; height: ${bulletSize}px; border-radius: 50%; margin-top: 8px; flex-shrink: 0; opacity: ${opacity};"></div>
        <p class="text-lg text-surface-foreground" style="line-height: 1.6;">${content}</p>
      </li>`;
  }).join('');

  return `<ul style="list-style: none; padding: 0; margin: 0;">${items}</ul>`;
}

// ============================================
// Utilities
// ============================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export alias for compatibility
export { generateHTMLSlides as renderDeckToHTML };
