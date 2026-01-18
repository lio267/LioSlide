/**
 * HTML Slide Renderer - DeckSpec을 HTML 슬라이드로 변환
 *
 * 각 슬라이드를 960×540px HTML로 렌더링
 */

import type { DeckSpec, SlideSpec, ContentBlock, Theme } from '../types/slideSpec';
import { generateFullCSS } from './cssThemeGenerator';

/**
 * HTML 슬라이드 출력
 */
export interface HTMLSlideOutput {
  slideIndex: number;
  html: string;
  slideType: string;
}

/**
 * DeckSpec을 HTML 슬라이드 배열로 변환
 */
export function renderDeckToHTML(deckSpec: DeckSpec): HTMLSlideOutput[] {
  const slides: HTMLSlideOutput[] = [];

  deckSpec.slides.forEach((slide, index) => {
    const html = renderSlideToHTML(slide, deckSpec.theme, deckSpec.metadata.title);
    slides.push({
      slideIndex: index,
      html,
      slideType: slide.type,
    });
  });

  return slides;
}

/**
 * 단일 슬라이드를 HTML로 렌더링
 */
export function renderSlideToHTML(
  slide: SlideSpec,
  theme: Theme,
  deckTitle: string
): string {
  const css = generateFullCSS(theme);
  const slideClass = getSlideClass(slide.type);
  const content = renderSlideContent(slide);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=960, height=540">
  <title>${escapeHtml(slide.title || deckTitle)}</title>
  <style>
${css}
  </style>
</head>
<body>
  <div class="slide ${slideClass}">
${content}
  </div>
</body>
</html>`;
}

/**
 * 슬라이드 타입에 따른 CSS 클래스 반환
 */
function getSlideClass(type: string): string {
  switch (type) {
    case 'title':
      return 'slide-title';
    case 'sectionTitle':
      return 'slide-section';
    case 'agenda':
      return 'slide-content slide-agenda';
    case 'summary':
      return 'slide-content slide-summary';
    case 'closing':
    case 'qna':
      return 'slide-closing';
    default:
      return 'slide-content';
  }
}

/**
 * 슬라이드 콘텐츠를 HTML로 렌더링
 */
function renderSlideContent(slide: SlideSpec): string {
  switch (slide.type) {
    case 'title':
      return renderTitleSlide(slide);
    case 'sectionTitle':
      return renderSectionSlide(slide);
    case 'closing':
    case 'qna':
      return renderClosingSlide(slide);
    case 'agenda':
      return renderAgendaSlide(slide);
    default:
      return renderContentSlide(slide);
  }
}

/**
 * 타이틀 슬라이드 렌더링
 */
function renderTitleSlide(slide: SlideSpec): string {
  const title = escapeHtml(slide.title || '');
  const subtitle = escapeHtml(slide.subtitle || '');

  return `
    <h1 class="title">${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
  `;
}

/**
 * 섹션 타이틀 슬라이드 렌더링
 */
function renderSectionSlide(slide: SlideSpec): string {
  const title = escapeHtml(slide.title || '');

  return `
    <h2 class="title">${title}</h2>
  `;
}

/**
 * 클로징 슬라이드 렌더링
 */
function renderClosingSlide(slide: SlideSpec): string {
  const title = escapeHtml(slide.title || '감사합니다');
  const keyMessage = escapeHtml(slide.keyMessage || '');

  return `
    <h1 class="title">${title}</h1>
    ${keyMessage ? `<p class="subtitle">${keyMessage}</p>` : ''}
  `;
}

/**
 * 목차 슬라이드 렌더링
 */
function renderAgendaSlide(slide: SlideSpec): string {
  const title = escapeHtml(slide.title || '목차');
  const blocks = slide.blocks || [];

  let agendaItems = '';

  // 불릿 리스트에서 목차 항목 추출
  const bulletBlock = blocks.find(b => b.type === 'bulletList');
  if (bulletBlock && bulletBlock.type === 'bulletList' && bulletBlock.items) {
    agendaItems = bulletBlock.items
      .map((item, index) => {
        let content = typeof item === 'string' ? item : item.content || '';
        // "1. " 형태의 번호 접두사 제거 (이미 번호 뱃지로 표시하므로)
        content = escapeHtml(content.replace(/^\d+\.\s*/, ''));
        return `
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 40px; height: 40px; background: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
            <span style="color: white; font-size: 18px; font-weight: 700;">${index + 1}</span>
          </div>
          <span style="font-size: 20px; color: var(--color-surface-foreground);">${content}</span>
        </div>`;
      })
      .join('\n');
  }

  return `
    <h2 class="title">${title}</h2>
    <div class="content">
${agendaItems}
    </div>
  `;
}

/**
 * 일반 콘텐츠 슬라이드 렌더링
 */
function renderContentSlide(slide: SlideSpec): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];

  const contentHTML = blocks.map(block => renderBlock(block)).join('\n');

  return `
    <h2 class="title">${title}</h2>
    <div class="content">
${contentHTML}
    </div>
  `;
}

/**
 * 콘텐츠 블록을 HTML로 렌더링
 */
function renderBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return renderTextBlock(block);
    case 'bulletList':
      return renderBulletListBlock(block);
    default:
      return '';
  }
}

/**
 * 텍스트 블록 렌더링
 */
function renderTextBlock(block: ContentBlock): string {
  if (block.type !== 'text') return '';

  const content = escapeHtml(block.content || '');
  const importance = block.importance || 3;

  return `      <p class="text-block importance-${importance}">${content}</p>`;
}

/**
 * 불릿 리스트 블록 렌더링
 */
function renderBulletListBlock(block: ContentBlock): string {
  if (block.type !== 'bulletList' || !block.items) return '';

  const items = block.items
    .map(item => {
      const content = escapeHtml(typeof item === 'string' ? item : item.content || '');
      const level = typeof item === 'object' && item.level ? item.level : 0;
      const levelClass = level > 0 ? ` level-${level}` : '';
      return `        <li class="${levelClass}">${content}</li>`;
    })
    .join('\n');

  return `      <ul class="bullet-list">
${items}
      </ul>`;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 전체 덱을 하나의 HTML 파일로 렌더링 (디버깅용)
 */
export function renderDeckToSingleHTML(deckSpec: DeckSpec): string {
  const css = generateFullCSS(deckSpec.theme);
  const slides = deckSpec.slides
    .map((slide, index) => {
      const slideClass = getSlideClass(slide.type);
      const content = renderSlideContent(slide);
      return `
    <div class="slide ${slideClass}" data-slide-index="${index}">
${content}
    </div>`;
    })
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(deckSpec.metadata.title || 'Presentation')}</title>
  <style>
${css}

/* 미리보기 레이아웃 */
body {
  width: auto;
  height: auto;
  background: #1a1a1a;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.slide {
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  flex-shrink: 0;
}
  </style>
</head>
<body>
${slides}
</body>
</html>`;
}
