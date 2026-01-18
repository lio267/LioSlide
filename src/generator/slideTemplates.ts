/**
 * 슬라이드 타입별 HTML 템플릿
 * html2pptx 스킬 가이드 준수:
 * - 960x540px 캔버스 (16:9)
 * - Title zone: 상단 100px
 * - Content zone: y=110 ~ y=490
 * - Footnote zone: 하단 40px
 *
 * 지원 슬라이드 타입:
 * - title: 표지
 * - agenda: 목차
 * - content: 일반 불릿
 * - twoColumn: 2단 비교
 * - timeline: 타임라인/프로세스
 * - stats: 통계/숫자 강조
 * - chart: 차트 (placeholder)
 * - quote: 인용문
 * - summary: 요약
 * - imageText: 이미지+텍스트
 * - closing: 마무리
 */

import {
  getTheme,
  getSlideBackground,
  getSlideTitleColor,
  getSlideTextColor,
  getSlideMutedColor,
  getSlideBorderColor,
  getSlideAccentColor,
} from '../themes/themeConfig';

// ============================================
// 타입 정의
// ============================================

export type SlideType =
  | 'title'
  | 'agenda'
  | 'content'
  | 'twoColumn'
  | 'timeline'
  | 'stats'
  | 'chart'
  | 'quote'
  | 'summary'
  | 'imageText'
  | 'closing';

export type ThemeName =
  | 'corporate-blue'
  | 'minimal-white'
  | 'creative-yellow'
  | 'dark-professional'
  | 'soft-gradient'
  | 'modern-teal'
  | string;

export interface SlideData {
  type: SlideType;
  title?: string;
  subtitle?: string;
  content?: string[];
  leftContent?: string[];
  rightContent?: string[];
  quoteText?: string;
  quoteAuthor?: string;
  chartPlaceholder?: boolean;
  footnote?: string;
  theme?: ThemeName;
  agendaItems?: AgendaItem[];
  timelineItems?: TimelineItem[];
  statsItems?: StatItem[];
  summaryPoints?: string[];
  imagePlaceholder?: boolean;
}

export interface AgendaItem {
  number: string | number;
  title: string;
  description?: string;
}

export interface TimelineItem {
  label: string;
  title: string;
  description?: string;
}

export interface StatItem {
  value: string;
  unit?: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ThemeCSS {
  name: string;
  css: string;
}

// ============================================
// 테마별 데코레이션 생성 함수
// ============================================

function getCorporateBlueDecorations(slideType: 'title' | 'content' | 'closing'): string {
  if (slideType === 'title' || slideType === 'closing') {
    return `
      <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 80px; background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);"></div>
      <div style="position: absolute; right: 60px; top: 40px; width: 120px; height: 8px; background: #f97316;"></div>
      <div style="position: absolute; right: 60px; top: 56px; width: 60px; height: 4px; background: #3b82f6; opacity: 0.6;"></div>
      <div style="position: absolute; left: 80px; bottom: 0; right: 0; height: 6px; background: linear-gradient(90deg, #2563eb, #f97316);"></div>
    `;
  }
  return `
    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: #2563eb;"></div>
    <div style="position: absolute; left: 0; bottom: 0; right: 0; height: 3px; background: linear-gradient(90deg, #2563eb, transparent);"></div>
  `;
}

function getMinimalWhiteDecorations(slideType: 'title' | 'content' | 'closing'): string {
  if (slideType === 'title') {
    return `<div style="position: absolute; left: 120px; right: 120px; bottom: 80px; height: 1px; background: #171717;"></div>`;
  }
  if (slideType === 'closing') {
    return `<div style="position: absolute; left: 120px; right: 120px; top: 200px; height: 1px; background: #171717;"></div>`;
  }
  return `<div style="position: absolute; left: 40px; top: 32px; width: 3px; height: 40px; background: #171717;"></div>`;
}

function getCreativeYellowDecorations(slideType: 'title' | 'content' | 'closing'): string {
  if (slideType === 'title' || slideType === 'closing') {
    // 오버플로우 방지: 원형 요소를 경계 내부에 배치
    return `
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;">
        <div style="position: absolute; right: -50px; top: -50px; width: 300px; height: 300px; background: #f59e0b; border-radius: 50%; opacity: 0.25;"></div>
        <div style="position: absolute; left: -40px; bottom: -40px; width: 200px; height: 200px; background: #ff6b35; border-radius: 50%; opacity: 0.12;"></div>
      </div>
      <div style="position: absolute; bottom: 40px; left: 60px; right: 60px; height: 8px; background: linear-gradient(90deg, #f59e0b, #ff6b35);"></div>
    `;
  }
  return `
    <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;">
      <div style="position: absolute; left: -50px; top: -50px; width: 150px; height: 150px; background: #f59e0b; opacity: 0.08; transform: rotate(45deg);"></div>
    </div>
    <div style="position: absolute; left: 40px; top: 32px; width: 60px; height: 6px; background: #f59e0b;"></div>
    <div style="position: absolute; left: 40px; top: 44px; width: 30px; height: 3px; background: #ff6b35;"></div>
  `;
}

function getDarkProfessionalDecorations(slideType: 'title' | 'content' | 'closing'): string {
  if (slideType === 'title' || slideType === 'closing') {
    return `
      <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at 70% 20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%);"></div>
      <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%);"></div>
      <div style="position: absolute; right: 80px; top: 60px; width: 160px; height: 2px; background: linear-gradient(90deg, transparent, #d4af37);"></div>
      <div style="position: absolute; left: 80px; bottom: 60px; width: 100px; height: 2px; background: linear-gradient(90deg, #d4af37, transparent);"></div>
      <div style="position: absolute; right: 60px; bottom: 60px; width: 8px; height: 8px; background: #d4af37; border-radius: 50%;"></div>
    `;
  }
  return `
    <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at 90% 10%, rgba(212, 175, 55, 0.08) 0%, transparent 40%);"></div>
    <div style="position: absolute; left: 40px; top: 28px; width: 4px; height: 50px; background: linear-gradient(180deg, #d4af37, #a1a1aa);"></div>
  `;
}

function getSoftGradientDecorations(slideType: 'title' | 'content' | 'closing'): string {
  if (slideType === 'title' || slideType === 'closing') {
    // 오버플로우 방지: 원형 요소를 overflow: hidden 컨테이너에 배치
    return `
      <div style="position: absolute; inset: 0; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #f472b6 100%); opacity: 0.08;"></div>
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;">
        <div style="position: absolute; right: -30px; top: -30px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%); border-radius: 50%;"></div>
        <div style="position: absolute; left: -20px; bottom: -20px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(244, 114, 182, 0.2) 0%, transparent 70%); border-radius: 50%;"></div>
      </div>
      <div style="position: absolute; bottom: 50px; left: 80px; right: 80px; height: 4px; background: linear-gradient(90deg, #7c3aed, #f472b6); border-radius: 2px;"></div>
    `;
  }
  return `
    <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(124, 58, 237, 0.03) 0%, rgba(244, 114, 182, 0.03) 100%);"></div>
    <div style="position: absolute; left: 40px; top: 28px; width: 50px; height: 4px; background: linear-gradient(90deg, #7c3aed, #f472b6); border-radius: 2px;"></div>
  `;
}

function getModernTealDecorations(slideType: 'title' | 'content' | 'closing'): string {
  if (slideType === 'title' || slideType === 'closing') {
    return `
      <div style="position: absolute; right: 40px; top: 40px; width: 120px; height: 120px; border: 3px solid #0d9488; transform: rotate(45deg);"></div>
      <div style="position: absolute; right: 80px; top: 80px; width: 60px; height: 60px; background: #0d9488; opacity: 0.2; transform: rotate(45deg);"></div>
      <div style="position: absolute; left: 60px; bottom: 60px; width: 80px; height: 80px; border: 2px solid #f97316; border-radius: 50%;"></div>
      <div style="position: absolute; left: 80px; bottom: 80px; width: 40px; height: 40px; background: #f97316; border-radius: 50%; opacity: 0.3;"></div>
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #0d9488, #14b8a6, #0d9488);"></div>
    `;
  }
  return `
    <div style="position: absolute; right: 30px; top: 30px; width: 50px; height: 50px; border: 2px solid #0d9488; transform: rotate(45deg); opacity: 0.3;"></div>
    <div style="position: absolute; left: 40px; top: 28px; width: 8px; height: 50px; background: #0d9488;"></div>
    <div style="position: absolute; left: 52px; top: 40px; width: 4px; height: 25px; background: #f97316; opacity: 0.6;"></div>
  `;
}

function getHighContrastDecorations(slideType: 'title' | 'content' | 'closing'): string {
  if (slideType === 'title' || slideType === 'closing') {
    // 강렬한 대각선 스트라이프 + 네온 효과
    return `
      <div style="position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255, 204, 0, 0.05) 60px, rgba(255, 204, 0, 0.05) 120px); pointer-events: none;"></div>
      <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 12px; background: linear-gradient(180deg, #ffcc00 0%, #ff6600 100%);"></div>
      <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 12px; background: linear-gradient(180deg, #ff6600 0%, #ffcc00 100%);"></div>
      <div style="position: absolute; bottom: 0; left: 12px; right: 12px; height: 6px; background: #ffcc00;"></div>
      <div style="position: absolute; top: 40px; right: 60px; width: 100px; height: 100px; border: 4px solid #ffcc00; opacity: 0.3;"></div>
    `;
  }
  // content
  return `
    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: linear-gradient(180deg, #ffcc00, #ff6600);"></div>
    <div style="position: absolute; left: 40px; top: 28px; width: 60px; height: 6px; background: #ffcc00;"></div>
    <div style="position: absolute; left: 40px; top: 40px; width: 30px; height: 3px; background: #ff6600;"></div>
  `;
}

function getThemeDecorations(themeName: ThemeName, slideType: 'title' | 'content' | 'closing'): string {
  switch (themeName) {
    case 'corporate-blue': return getCorporateBlueDecorations(slideType);
    case 'minimal-white': return getMinimalWhiteDecorations(slideType);
    case 'creative-yellow': return getCreativeYellowDecorations(slideType);
    case 'dark-professional': return getDarkProfessionalDecorations(slideType);
    case 'soft-gradient': return getSoftGradientDecorations(slideType);
    case 'modern-teal': return getModernTealDecorations(slideType);
    case 'high-contrast': return getHighContrastDecorations(slideType);
    default: return '';
  }
}

// ============================================
// 공통 HTML 래퍼
// ============================================

function createSlideHTML(
  title: string,
  themeCSS: string,
  bgColor: string,
  bodyContent: string,
  extraStyles: string = ''
): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=960, height=540">
  <title>${escapeHtml(title)}</title>
  <style>
${themeCSS}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; overflow: hidden; }
    ${extraStyles}
  </style>
</head>
<body style="width: 960px; height: 540px; position: relative; background: ${bgColor};">
${bodyContent}
</body>
</html>`;
}

// ============================================
// 타이틀 슬라이드
// ============================================

export function renderTitleSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'title');
  const titleColor = getSlideTitleColor(theme, 'title');
  const mutedColor = getSlideMutedColor(theme);
  const decorations = getThemeDecorations(theme, 'title');

  const titleSize = theme === 'creative-yellow' ? '80px' : '52px';
  const subtitleSize = theme === 'creative-yellow' ? '28px' : '24px';
  const contentAlign = theme === 'corporate-blue' ? 'flex-start' : 'center';
  const paddingLeft = theme === 'corporate-blue' ? '120px' : '60px';

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: ${contentAlign}; padding: 60px 60px 60px ${paddingLeft};">
    <h1 style="color: ${titleColor}; font-size: ${titleSize}; font-weight: 700; letter-spacing: -1px; margin: 0; ${contentAlign === 'flex-start' ? 'text-align: left;' : 'text-align: center;'} max-width: 100%;">${escapeHtml(data.title || '')}</h1>
    ${data.subtitle ? `<p style="color: ${mutedColor}; font-size: ${subtitleSize}; margin-top: 24px; ${contentAlign === 'flex-start' ? 'text-align: left;' : 'text-align: center;'}">${escapeHtml(data.subtitle)}</p>` : ''}
  </div>`;

  return createSlideHTML(data.title || 'Title', themeCSS, bgColor, body);
}

// ============================================
// 목차(Agenda) 슬라이드
// ============================================

export function renderAgendaSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'content');
  const titleColor = getSlideTitleColor(theme, 'content');
  const textColor = getSlideTextColor(theme);
  const mutedColor = getSlideMutedColor(theme);
  const accentColor = getSlideAccentColor(theme);
  const decorations = getThemeDecorations(theme, 'content');

  const items = data.agendaItems || [];
  const agendaHTML = items.map((item, idx) => `
    <div style="display: flex; align-items: flex-start; margin-bottom: 24px;">
      <div style="width: 48px; height: 48px; background: ${accentColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 20px; flex-shrink: 0;">
        <span style="color: white; font-size: 20px; font-weight: 700;">${item.number || idx + 1}</span>
      </div>
      <div style="flex: 1;">
        <p style="color: ${textColor}; font-size: 22px; font-weight: 600; margin: 0;">${escapeHtml(item.title)}</p>
        ${item.description ? `<p style="color: ${mutedColor}; font-size: 16px; margin-top: 6px;">${escapeHtml(item.description)}</p>` : ''}
      </div>
    </div>
  `).join('');

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 36px 60px;">
    <h1 style="color: ${titleColor}; font-size: 36px; font-weight: 700; margin-bottom: 32px;">${escapeHtml(data.title || '목차')}</h1>
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
      ${agendaHTML}
    </div>
  </div>`;

  return createSlideHTML(data.title || 'Agenda', themeCSS, bgColor, body);
}

// ============================================
// 콘텐츠 슬라이드
// ============================================

export function renderContentSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'content');
  const titleColor = getSlideTitleColor(theme, 'content');
  const textColor = getSlideTextColor(theme);
  const mutedColor = getSlideMutedColor(theme);
  const decorations = getThemeDecorations(theme, 'content');

  const paddingLeft = theme === 'minimal-white' ? '80px' : theme === 'modern-teal' ? '70px' : '60px';
  const listStyle = theme === 'minimal-white' ? 'none' : 'disc';

  const bullets = (data.content || [])
    .map(item => `<li style="margin-bottom: 14px; padding-left: 8px;"><span style="line-height: 1.5;">${escapeHtml(item)}</span></li>`)
    .join('\n');

  const extraStyles = theme === 'minimal-white' ? `
    ul li { display: flex; align-items: flex-start; }
    ul li::before { content: "—"; margin-right: 12px; color: #888; flex-shrink: 0; }
  ` : '';

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column;">
    <div style="padding: 36px ${paddingLeft} 0 ${paddingLeft};">
      <h1 style="color: ${titleColor}; font-size: 36px; font-weight: 700; margin: 0;">${escapeHtml(data.title || '')}</h1>
    </div>
    <div style="flex: 1; padding: 28px ${paddingLeft} 20px ${paddingLeft}; overflow: hidden;">
      <ul style="margin: 0; padding-left: ${theme === 'minimal-white' ? '0' : '28px'}; color: ${textColor}; font-size: 22px; list-style-type: ${listStyle};">
        ${bullets}
      </ul>
    </div>
    ${data.footnote ? `<p style="position: absolute; bottom: 24px; left: ${paddingLeft}; font-size: 10px; color: ${mutedColor}; margin: 0;">${escapeHtml(data.footnote)}</p>` : ''}
  </div>`;

  return createSlideHTML(data.title || 'Content', themeCSS, bgColor, body, extraStyles);
}

// ============================================
// 2단 레이아웃 슬라이드
// ============================================

export function renderTwoColumnSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'content');
  const titleColor = getSlideTitleColor(theme, 'content');
  const textColor = getSlideTextColor(theme);
  const borderColor = getSlideBorderColor(theme);
  const accentColor = getSlideAccentColor(theme);
  const decorations = getThemeDecorations(theme, 'content');

  const leftBullets = (data.leftContent || [])
    .map(item => `<li style="margin-bottom: 12px;"><span>${escapeHtml(item)}</span></li>`)
    .join('\n');

  const rightBullets = (data.rightContent || [])
    .map(item => `<li style="margin-bottom: 12px;"><span>${escapeHtml(item)}</span></li>`)
    .join('\n');

  const dividerStyle = (theme === 'dark-professional' || theme === 'soft-gradient')
    ? `background: linear-gradient(180deg, ${accentColor}, ${borderColor});`
    : `background: ${borderColor};`;

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column;">
    <div style="padding: 36px 60px 0 60px;">
      <h1 style="color: ${titleColor}; font-size: 36px; font-weight: 700; margin: 0;">${escapeHtml(data.title || '')}</h1>
    </div>
    <div style="flex: 1; display: flex; gap: 24px; padding: 28px 60px 20px 60px;">
      <div style="flex: 1;">
        <ul style="margin: 0; padding-left: 24px; color: ${textColor}; font-size: 18px; line-height: 1.6;">
          ${leftBullets}
        </ul>
      </div>
      <div style="width: 2px; ${dividerStyle}"></div>
      <div style="flex: 1;">
        <ul style="margin: 0; padding-left: 24px; color: ${textColor}; font-size: 18px; line-height: 1.6;">
          ${rightBullets}
        </ul>
      </div>
    </div>
  </div>`;

  return createSlideHTML(data.title || 'Two Column', themeCSS, bgColor, body);
}

// ============================================
// 타임라인 슬라이드
// ============================================

export function renderTimelineSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'content');
  const titleColor = getSlideTitleColor(theme, 'content');
  const textColor = getSlideTextColor(theme);
  const mutedColor = getSlideMutedColor(theme);
  const accentColor = getSlideAccentColor(theme);
  const themeData = getTheme(theme);
  const primaryColor = themeData.colors.primary;
  const decorations = getThemeDecorations(theme, 'content');

  const items = data.timelineItems || [];
  const itemWidth = Math.min(180, Math.floor((960 - 120) / Math.max(items.length, 1)));

  const timelineHTML = items.map((item, idx) => `
    <div style="display: flex; flex-direction: column; align-items: center; width: ${itemWidth}px;">
      <div style="width: 40px; height: 40px; background: ${idx === 0 ? accentColor : primaryColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 2;">
        <span style="color: white; font-size: 14px; font-weight: 700;">${escapeHtml(item.label)}</span>
      </div>
      <div style="text-align: center; margin-top: 16px;">
        <p style="color: ${textColor}; font-size: 16px; font-weight: 600; margin: 0;">${escapeHtml(item.title)}</p>
        ${item.description ? `<p style="color: ${mutedColor}; font-size: 12px; margin-top: 8px;">${escapeHtml(item.description)}</p>` : ''}
      </div>
    </div>
  `).join('');

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column;">
    <div style="padding: 36px 60px 0 60px;">
      <h1 style="color: ${titleColor}; font-size: 36px; font-weight: 700; margin: 0;">${escapeHtml(data.title || '')}</h1>
    </div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px 60px;">
      <div style="position: relative; display: flex; align-items: flex-start; justify-content: space-between; width: 100%;">
        <div style="position: absolute; top: 20px; left: 60px; right: 60px; height: 3px; background: linear-gradient(90deg, ${primaryColor}, ${accentColor}); z-index: 1;"></div>
        ${timelineHTML}
      </div>
    </div>
  </div>`;

  return createSlideHTML(data.title || 'Timeline', themeCSS, bgColor, body);
}

// ============================================
// 통계 슬라이드
// ============================================

export function renderStatsSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'content');
  const titleColor = getSlideTitleColor(theme, 'content');
  const textColor = getSlideTextColor(theme);
  const accentColor = getSlideAccentColor(theme);
  const decorations = getThemeDecorations(theme, 'content');

  const items = data.statsItems || [];

  const statsHTML = items.slice(0, 4).map(item => {
    const trendIcon = item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '';
    const trendColor = item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#ef4444' : textColor;

    return `
    <div style="flex: 1; text-align: center; padding: 20px;">
      <p style="color: ${accentColor}; font-size: 48px; font-weight: 700; margin: 0;">
        ${escapeHtml(item.value)}${item.unit ? `<span style="font-size: 24px;">${escapeHtml(item.unit)}</span>` : ''}
        ${trendIcon ? `<span style="font-size: 24px; color: ${trendColor};">${trendIcon}</span>` : ''}
      </p>
      <p style="color: ${textColor}; font-size: 18px; margin-top: 12px; font-weight: 500;">${escapeHtml(item.label)}</p>
    </div>
  `;
  }).join('');

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column;">
    <div style="padding: 36px 60px 0 60px;">
      <h1 style="color: ${titleColor}; font-size: 36px; font-weight: 700; margin: 0;">${escapeHtml(data.title || '')}</h1>
    </div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px 40px;">
      <div style="display: flex; width: 100%; gap: 20px;">
        ${statsHTML}
      </div>
    </div>
  </div>`;

  return createSlideHTML(data.title || 'Stats', themeCSS, bgColor, body);
}

// ============================================
// 차트 슬라이드
// ============================================

export function renderChartSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'content');
  const titleColor = getSlideTitleColor(theme, 'content');
  const textColor = getSlideTextColor(theme);
  const mutedColor = getSlideMutedColor(theme);
  const borderColor = getSlideBorderColor(theme);
  const themeData = getTheme(theme);
  const surfaceColor = themeData.colors.surface;
  const decorations = getThemeDecorations(theme, 'content');

  const bullets = (data.content || [])
    .map(item => `<li style="margin-bottom: 12px;"><span>${escapeHtml(item)}</span></li>`)
    .join('\n');

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column;">
    <div style="padding: 36px 60px 0 60px;">
      <h1 style="color: ${titleColor}; font-size: 36px; font-weight: 700; margin: 0;">${escapeHtml(data.title || '')}</h1>
    </div>
    <div style="flex: 1; display: flex; gap: 32px; padding: 28px 60px 20px 60px;">
      <div style="width: 35%;">
        <ul style="margin: 0; padding-left: 20px; color: ${textColor}; font-size: 16px; line-height: 1.6;">
          ${bullets}
        </ul>
      </div>
      <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
        <div id="chart-area" style="width: 100%; height: 90%; background: ${surfaceColor}; border: 2px dashed ${borderColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${mutedColor}; font-size: 14px;">Chart Placeholder</span>
        </div>
      </div>
    </div>
  </div>`;

  return createSlideHTML(data.title || 'Chart', themeCSS, bgColor, body);
}

// ============================================
// 인용문 슬라이드
// ============================================

export function renderQuoteSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const themeData = getTheme(theme);
  const mutedColor = getSlideMutedColor(theme);
  const textColor = getSlideTextColor(theme);
  const primaryColor = themeData.colors.primary;
  const accentColor = getSlideAccentColor(theme);
  const surfaceColor = themeData.colors.surface;
  const decorations = getThemeDecorations(theme, 'content');

  let bgStyle = `background: ${surfaceColor};`;
  if (theme === 'dark-professional') {
    bgStyle = `background: linear-gradient(135deg, ${themeData.colors.background} 0%, ${surfaceColor} 100%);`;
  } else if (theme === 'soft-gradient') {
    bgStyle = `background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%);`;
  }

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 60px 80px; ${bgStyle}">
    <div style="max-width: 760px; position: relative;">
      <p style="position: absolute; top: -20px; left: -30px; font-size: 120px; color: ${accentColor}; opacity: 0.2; font-family: Georgia, serif; line-height: 1; margin: 0;">"</p>
      <div style="border-left: 6px solid ${primaryColor}; padding-left: 40px;">
        <p style="color: ${textColor}; font-size: 32px; font-style: italic; line-height: 1.6; margin: 0; font-family: Georgia, serif;">"${escapeHtml(data.quoteText || '')}"</p>
        ${data.quoteAuthor ? `<p style="color: ${mutedColor}; font-size: 18px; margin-top: 28px; font-style: normal;">— ${escapeHtml(data.quoteAuthor)}</p>` : ''}
      </div>
    </div>
  </div>`;

  return createSlideHTML('Quote', themeCSS, 'transparent', body);
}

// ============================================
// 요약 슬라이드
// ============================================

export function renderSummarySlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'content');
  const titleColor = getSlideTitleColor(theme, 'content');
  const textColor = getSlideTextColor(theme);
  const accentColor = getSlideAccentColor(theme);
  const themeData = getTheme(theme);
  const primaryColor = themeData.colors.primary;
  const decorations = getThemeDecorations(theme, 'content');

  const points = data.summaryPoints || data.content || [];
  const summaryHTML = points.slice(0, 5).map((point, idx) => `
    <div style="display: flex; align-items: flex-start; margin-bottom: 20px;">
      <div style="width: 32px; height: 32px; background: ${idx === 0 ? accentColor : primaryColor}; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
        <span style="color: white; font-size: 16px; font-weight: 700;">${idx + 1}</span>
      </div>
      <p style="color: ${textColor}; font-size: 20px; line-height: 1.5; margin: 0; padding-top: 4px;">${escapeHtml(point)}</p>
    </div>
  `).join('');

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; padding: 36px 60px;">
    <h1 style="color: ${titleColor}; font-size: 36px; font-weight: 700; margin-bottom: 32px;">${escapeHtml(data.title || '핵심 요약')}</h1>
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
      ${summaryHTML}
    </div>
  </div>`;

  return createSlideHTML(data.title || 'Summary', themeCSS, bgColor, body);
}

// ============================================
// 이미지+텍스트 슬라이드
// ============================================

export function renderImageTextSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'content');
  const titleColor = getSlideTitleColor(theme, 'content');
  const textColor = getSlideTextColor(theme);
  const mutedColor = getSlideMutedColor(theme);
  const borderColor = getSlideBorderColor(theme);
  const themeData = getTheme(theme);
  const surfaceColor = themeData.colors.surface;
  const decorations = getThemeDecorations(theme, 'content');

  const paragraphs = (data.content || [])
    .map(p => `<p style="margin-bottom: 16px; line-height: 1.6;">${escapeHtml(p)}</p>`)
    .join('');

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column;">
    <div style="padding: 36px 60px 0 60px;">
      <h1 style="color: ${titleColor}; font-size: 36px; font-weight: 700; margin: 0;">${escapeHtml(data.title || '')}</h1>
    </div>
    <div style="flex: 1; display: flex; gap: 32px; padding: 28px 60px 20px 60px;">
      <div style="flex: 1;">
        <div id="image-placeholder" style="width: 100%; height: 100%; background: ${surfaceColor}; border: 2px dashed ${borderColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${mutedColor}; font-size: 14px;">Image Placeholder</span>
        </div>
      </div>
      <div style="flex: 1; color: ${textColor}; font-size: 18px;">
        ${paragraphs}
      </div>
    </div>
  </div>`;

  return createSlideHTML(data.title || 'Image + Text', themeCSS, bgColor, body);
}

// ============================================
// 클로징 슬라이드
// ============================================

export function renderClosingSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  const theme = themeName || 'corporate-blue';
  const bgColor = getSlideBackground(theme, 'closing');
  const titleColor = getSlideTitleColor(theme, 'closing');
  const mutedColor = getSlideMutedColor(theme);
  const decorations = getThemeDecorations(theme, 'closing');

  const closingTitle = data.title || '감사합니다';
  const titleSize = theme === 'creative-yellow' ? '72px' : theme === 'minimal-white' ? '48px' : '56px';
  const contentAlign = theme === 'corporate-blue' ? 'flex-start' : 'center';
  const paddingLeft = theme === 'corporate-blue' ? '120px' : '60px';

  const body = `
  ${decorations}
  <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: ${contentAlign}; padding: 60px 60px 60px ${paddingLeft};">
    <h1 style="color: ${titleColor}; font-size: ${titleSize}; font-weight: 700; margin: 0; ${contentAlign === 'flex-start' ? 'text-align: left;' : 'text-align: center;'}">${escapeHtml(closingTitle)}</h1>
    ${data.subtitle ? `<p style="color: ${mutedColor}; font-size: 22px; margin-top: 20px; ${contentAlign === 'flex-start' ? 'text-align: left;' : 'text-align: center;'}">${escapeHtml(data.subtitle)}</p>` : ''}
  </div>`;

  return createSlideHTML(closingTitle, themeCSS, bgColor, body);
}

// ============================================
// 슬라이드 렌더링 디스패처
// ============================================

export function renderSlide(data: SlideData, themeCSS: string, themeName?: ThemeName): string {
  switch (data.type) {
    case 'title': return renderTitleSlide(data, themeCSS, themeName);
    case 'agenda': return renderAgendaSlide(data, themeCSS, themeName);
    case 'content': return renderContentSlide(data, themeCSS, themeName);
    case 'twoColumn': return renderTwoColumnSlide(data, themeCSS, themeName);
    case 'timeline': return renderTimelineSlide(data, themeCSS, themeName);
    case 'stats': return renderStatsSlide(data, themeCSS, themeName);
    case 'chart': return renderChartSlide(data, themeCSS, themeName);
    case 'quote': return renderQuoteSlide(data, themeCSS, themeName);
    case 'summary': return renderSummarySlide(data, themeCSS, themeName);
    case 'imageText': return renderImageTextSlide(data, themeCSS, themeName);
    case 'closing': return renderClosingSlide(data, themeCSS, themeName);
    default: return renderContentSlide(data, themeCSS, themeName);
  }
}

// ============================================
// 테마 CSS 생성 헬퍼
// ============================================

export function generateThemeCSSForName(themeName: ThemeName): string {
  const theme = getTheme(themeName);
  const { colors } = theme;

  return `:root {
  --font-family-display: Arial, sans-serif;
  --font-weight-display: 600;
  --font-family-content: Arial, sans-serif;
  --font-weight-content: 400;
  --font-size-content: 16px;
  --line-height-content: 1.4;
  --color-surface: ${colors.surface};
  --color-surface-foreground: ${colors.text};
  --color-primary: ${colors.primary};
  --color-primary-light: ${colors.primaryLight};
  --color-primary-dark: ${colors.primaryDark};
  --color-primary-foreground: #ffffff;
  --color-secondary: ${colors.surface};
  --color-secondary-foreground: ${colors.text};
  --color-muted: ${colors.surface};
  --color-muted-foreground: ${colors.textMuted};
  --color-accent: ${colors.accent};
  --color-accent-foreground: ${colors.accentForeground};
  --color-border: ${colors.border};
  --spacing: 0.25rem;
  --gap: 1rem;
  --radius: ${theme.borderRadius}px;
}`;
}

// ============================================
// HTML 이스케이프
// ============================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
