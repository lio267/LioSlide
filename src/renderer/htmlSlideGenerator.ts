/**
 * HTML Slide Generator - Professional Quality Templates
 *
 * Design Philosophy:
 * - BOLD design choices per theme
 * - Asymmetric layouts (30/70 splits)
 * - Extreme typography (72pt headers vs 14pt body)
 * - Theme-specific visual identity
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

// Theme style types
type ThemeStyle = 'corporate' | 'minimal' | 'creative' | 'dark' | 'gradient' | 'modern' | 'toss' | 'vercel' | 'supabase' | 'claude' | 'cyberpunk' | 'twitter' | 'mono';

// ============================================
// Constants
// ============================================

const DEFAULT_SLIDE_SIZE = { width: 13.333, height: 7.5 };
const DPI = 96;

// Theme detection from theme name
function detectThemeStyle(themeName: string): ThemeStyle {
  const name = themeName.toLowerCase();
  if (name.includes('corporate') || name.includes('blue') || name.includes('business')) return 'corporate';
  if (name.includes('minimal') || name.includes('white')) return 'minimal';
  if (name.includes('creative') || name.includes('yellow')) return 'creative';
  if (name.includes('dark') || name.includes('professional')) return 'dark';
  if (name.includes('gradient') || name.includes('soft')) return 'gradient';
  if (name.includes('teal') || name.includes('modern')) return 'modern';
  if (name.includes('toss')) return 'toss';
  if (name.includes('vercel') || name.includes('mono')) return 'vercel';
  if (name.includes('supabase') || name.includes('green')) return 'supabase';
  if (name.includes('claude') || name.includes('coral')) return 'claude';
  if (name.includes('cyberpunk') || name.includes('neon')) return 'cyberpunk';
  if (name.includes('twitter')) return 'twitter';
  return 'corporate';
}

// ============================================
// Base CSS (shared across all themes)
// ============================================

const BASE_CSS = `
/* Reset & Base */
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-content), 'Arial', sans-serif;
  overflow: hidden;
  position: relative;
}

/* Layout Utilities */
.slide { display: flex; width: 100%; height: 100%; position: relative; }
.col { display: flex; flex-direction: column; }
.row { display: flex; flex-direction: row; }
.center { align-items: center; justify-content: center; }
.flex-1 { flex: 1; }

/* Typography Scale */
.text-hero { font-size: 72px; font-weight: 800; letter-spacing: -2px; line-height: 1.0; }
.text-display { font-size: 56px; font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; }
.text-h1 { font-size: 44px; font-weight: 700; letter-spacing: -1px; line-height: 1.15; }
.text-h2 { font-size: 36px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.2; }
.text-h3 { font-size: 28px; font-weight: 600; line-height: 1.25; }
.text-body { font-size: 20px; font-weight: 400; line-height: 1.6; }
.text-body-lg { font-size: 24px; font-weight: 400; line-height: 1.5; }
.text-caption { font-size: 16px; font-weight: 400; line-height: 1.5; }
.text-small { font-size: 14px; font-weight: 400; line-height: 1.4; }

/* Bullet Styles */
.bullet-list { list-style: none; }
.bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.bullet-marker {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 8px;
  flex-shrink: 0;
}
.bullet-bar {
  width: 4px;
  height: 100%;
  border-radius: 2px;
  margin-right: 12px;
  flex-shrink: 0;
}

/* Decorative Elements */
.accent-bar { position: absolute; }
.accent-circle { position: absolute; border-radius: 50%; }
.accent-line { position: absolute; }
.divider { width: 80px; height: 4px; border-radius: 2px; }
`;

// ============================================
// Theme-specific CSS
// ============================================

function getThemeCSS(theme: Theme, themeStyle: ThemeStyle): string {
  const c = theme.colors;

  const baseVars = `
:root {
  --primary: #${c.primary};
  --primary-light: #${c.primaryLight};
  --primary-dark: #${c.primaryDark};
  --surface: #${c.surface};
  --surface-fg: #${c.surfaceForeground};
  --muted: #${c.muted};
  --muted-fg: #${c.mutedForeground};
  --accent: #${c.accent};
  --border: #${c.border};
  --font-display: ${theme.fonts.display}, sans-serif;
  --font-content: ${theme.fonts.content}, sans-serif;
}`;

  // Theme-specific style variations
  const themeSpecific: Record<ThemeStyle, string> = {
    corporate: `
      .theme-bg { background: var(--surface); }
      .theme-title-bg { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); }
      .sidebar { background: var(--primary); width: 12px; }
      .accent-shape { background: var(--primary); opacity: 0.1; }
    `,
    minimal: `
      .theme-bg { background: #FFFFFF; }
      .theme-title-bg { background: #FFFFFF; }
      .sidebar { display: none; }
      .accent-bar { background: #000000; height: 2px; }
      .bullet-marker { background: #000000; }
      .text-h2 { font-weight: 300; letter-spacing: 0; }
    `,
    creative: `
      .theme-bg { background: var(--surface); }
      .theme-title-bg { background: linear-gradient(45deg, #FFD93D 0%, #FF6B6B 100%); }
      .sidebar { background: linear-gradient(180deg, #FFD93D 0%, #FF6B6B 100%); width: 20px; }
      .accent-shape { background: #FFD93D; transform: rotate(-5deg); }
      .text-hero { font-size: 84px; }
    `,
    dark: `
      .theme-bg { background: #0D0D0D; color: #FFFFFF; }
      .theme-title-bg { background: linear-gradient(135deg, #1a1a2e 0%, #0D0D0D 100%); }
      .sidebar { background: linear-gradient(180deg, var(--primary) 0%, var(--accent) 100%); width: 8px; }
      .accent-shape { background: var(--primary); opacity: 0.15; }
      .text-h2, .text-body { color: rgba(255,255,255,0.9); }
      .text-caption { color: rgba(255,255,255,0.6); }
    `,
    gradient: `
      .theme-bg { background: linear-gradient(135deg, #E8F4F8 0%, #FDF2F8 50%, #FEF3E2 100%); }
      .theme-title-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
      .sidebar { background: linear-gradient(180deg, #667eea 0%, #f093fb 100%); width: 16px; border-radius: 0 8px 8px 0; }
      .card { background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); border-radius: 16px; }
    `,
    modern: `
      .theme-bg { background: var(--surface); }
      .theme-title-bg { background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%); }
      .sidebar { background: var(--primary); width: 6px; }
      .accent-shape { background: var(--primary); clip-path: polygon(0 0, 100% 0, 80% 100%, 0 100%); }
    `,
    toss: `
      .theme-bg { background: #FFFFFF; }
      .theme-title-bg { background: #1B64DA; }
      .sidebar { background: #1B64DA; width: 4px; }
      .card { background: #F4F6FA; border-radius: 20px; }
      .text-h1 { font-weight: 800; }
    `,
    vercel: `
      .theme-bg { background: #000000; color: #FFFFFF; }
      .theme-title-bg { background: #000000; }
      .sidebar { display: none; }
      .accent-bar { background: linear-gradient(90deg, #FF0080, #7928CA, #FF0080); height: 4px; }
      .text-hero { font-family: 'Courier New', monospace; font-size: 64px; }
    `,
    supabase: `
      .theme-bg { background: #1C1C1C; color: #FFFFFF; }
      .theme-title-bg { background: linear-gradient(135deg, #1C1C1C 0%, #2D2D2D 100%); }
      .sidebar { background: linear-gradient(180deg, #3ECF8E 0%, #2AAB6A 100%); width: 6px; }
      .accent-shape { background: #3ECF8E; opacity: 0.2; }
    `,
    claude: `
      .theme-bg { background: #FAF8F5; }
      .theme-title-bg { background: linear-gradient(135deg, #D97757 0%, #C4654A 100%); }
      .sidebar { background: #D97757; width: 10px; border-radius: 0 5px 5px 0; }
      .card { background: #FFFFFF; border: 1px solid #E8E4DE; border-radius: 12px; }
    `,
    cyberpunk: `
      .theme-bg { background: #0a0a0f; color: #FFFFFF; }
      .theme-title-bg { background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); }
      .sidebar { background: linear-gradient(180deg, #00ff87 0%, #60efff 50%, #ff00ff 100%); width: 6px; }
      .accent-shape { background: #00ff87; opacity: 0.1; box-shadow: 0 0 60px #00ff87; }
      .text-hero { text-shadow: 0 0 20px var(--primary); }
    `,
    twitter: `
      .theme-bg { background: #FFFFFF; }
      .theme-title-bg { background: #1D9BF0; }
      .sidebar { background: #1D9BF0; width: 5px; }
      .card { background: #F7F9FA; border-radius: 16px; }
      .text-h1 { font-weight: 800; }
    `,
    mono: `
      .theme-bg { background: #FAFAFA; }
      .theme-title-bg { background: #1A1A1A; }
      .sidebar { background: #1A1A1A; width: 8px; }
      .text-hero, .text-h1, .text-h2 { font-family: 'Courier New', monospace; }
    `,
  };

  return baseVars + (themeSpecific[themeStyle] || themeSpecific.corporate);
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
  const themeStyle = detectThemeStyle(deckSpec.theme.name);

  const slideSize = options?.slideSize || DEFAULT_SLIDE_SIZE;
  const pixelWidth = Math.round(slideSize.width * DPI);
  const pixelHeight = Math.round(slideSize.height * DPI);

  deckSpec.slides.forEach((slide, index) => {
    const { html, placeholders } = generateSlideHTML(
      slide,
      deckSpec.theme,
      themeStyle,
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
  themeStyle: ThemeStyle,
  index: number,
  pixelWidth: number,
  pixelHeight: number
): { html: string; placeholders: PlaceholderInfo[] } {
  const placeholders: PlaceholderInfo[] = [];
  const themeCSS = getThemeCSS(theme, themeStyle);
  const content = renderSlideByType(slide, theme, themeStyle, placeholders);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${pixelWidth}, height=${pixelHeight}">
  <title>Slide ${index + 1}</title>
  <style>
${BASE_CSS}
${themeCSS}
  </style>
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
  themeStyle: ThemeStyle,
  placeholders: PlaceholderInfo[]
): string {
  switch (slide.type) {
    case 'title':
      return renderTitleSlide(slide, theme, themeStyle);
    case 'sectionTitle':
      return renderSectionSlide(slide, theme, themeStyle);
    case 'closing':
    case 'qna':
      return renderClosingSlide(slide, theme, themeStyle);
    case 'agenda':
      return renderAgendaSlide(slide, theme, themeStyle);
    case 'twoColumn':
      return renderTwoColumnSlide(slide, theme, themeStyle, placeholders);
    case 'comparison':
      return renderComparisonSlide(slide, theme, themeStyle, placeholders);
    case 'summary':
      return renderSummarySlide(slide, theme, themeStyle);
    default:
      return renderContentSlide(slide, theme, themeStyle, placeholders);
  }
}

// ============================================
// TITLE SLIDE - Hero layout with impact
// ============================================

function renderTitleSlide(slide: SlideSpec, theme: Theme, themeStyle: ThemeStyle): string {
  const title = escapeHtml(slide.title || '');
  const subtitle = escapeHtml(slide.subtitle || '');
  const c = theme.colors;

  // Theme-specific title layouts
  if (themeStyle === 'minimal') {
    return `
    <div class="slide col center theme-bg" style="padding: 80px;">
      <h1 class="text-hero" style="color: #000000; text-align: center; max-width: 900px;">${title}</h1>
      ${subtitle ? `<p class="text-body-lg" style="color: #666666; margin-top: 32px; text-align: center;">${subtitle}</p>` : ''}
      <div class="accent-bar" style="width: 120px; height: 2px; background: #000; margin-top: 48px;"></div>
    </div>`;
  }

  if (themeStyle === 'dark' || themeStyle === 'vercel' || themeStyle === 'supabase' || themeStyle === 'cyberpunk') {
    const glowColor = themeStyle === 'cyberpunk' ? '#00ff87' : `#${c.primary}`;
    return `
    <div class="slide col center theme-title-bg" style="padding: 80px; position: relative; overflow: hidden;">
      <!-- Decorative elements -->
      <div class="accent-circle" style="width: 400px; height: 400px; background: ${glowColor}; opacity: 0.1; top: -100px; right: -100px; filter: blur(80px);"></div>
      <div class="accent-circle" style="width: 300px; height: 300px; background: #${c.accent}; opacity: 0.08; bottom: -50px; left: -50px; filter: blur(60px);"></div>

      <h1 class="text-hero" style="color: #FFFFFF; text-align: center; max-width: 1000px; position: relative; z-index: 1;">${title}</h1>
      ${subtitle ? `<p class="text-body-lg" style="color: rgba(255,255,255,0.7); margin-top: 24px; text-align: center; position: relative; z-index: 1;">${subtitle}</p>` : ''}
    </div>`;
  }

  if (themeStyle === 'creative') {
    return `
    <div class="slide col center theme-title-bg" style="padding: 60px; position: relative; overflow: hidden;">
      <!-- Decorative shapes -->
      <div style="position: absolute; width: 200px; height: 200px; background: rgba(255,255,255,0.2); border-radius: 50%; top: 60px; left: 80px;"></div>
      <div style="position: absolute; width: 120px; height: 120px; background: rgba(255,255,255,0.15); top: 400px; right: 120px; transform: rotate(45deg);"></div>

      <h1 class="text-hero" style="color: #FFFFFF; text-align: center; max-width: 900px; position: relative; z-index: 1; transform: rotate(-2deg);">${title}</h1>
      ${subtitle ? `<p class="text-h3" style="color: rgba(255,255,255,0.9); margin-top: 24px; text-align: center; position: relative; z-index: 1;">${subtitle}</p>` : ''}
    </div>`;
  }

  if (themeStyle === 'gradient') {
    return `
    <div class="slide col center theme-title-bg" style="padding: 80px; position: relative;">
      <h1 class="text-hero" style="color: #FFFFFF; text-align: center; max-width: 900px;">${title}</h1>
      ${subtitle ? `<p class="text-body-lg" style="color: rgba(255,255,255,0.85); margin-top: 28px; text-align: center;">${subtitle}</p>` : ''}
      <div style="width: 100px; height: 4px; background: rgba(255,255,255,0.5); border-radius: 2px; margin-top: 40px;"></div>
    </div>`;
  }

  // Default corporate/toss/modern style
  return `
  <div class="slide col center theme-title-bg" style="padding: 80px; position: relative; overflow: hidden;">
    <!-- Geometric accent -->
    <div style="position: absolute; width: 500px; height: 500px; background: rgba(255,255,255,0.08); border-radius: 50%; top: -150px; right: -150px;"></div>
    <div style="position: absolute; width: 300px; height: 300px; background: rgba(255,255,255,0.05); border-radius: 50%; bottom: -100px; left: -100px;"></div>

    <h1 class="text-hero" style="color: #FFFFFF; text-align: center; max-width: 1000px; position: relative; z-index: 1;">${title}</h1>
    ${subtitle ? `<p class="text-h3" style="color: rgba(255,255,255,0.85); margin-top: 24px; text-align: center; font-weight: 400; position: relative; z-index: 1;">${subtitle}</p>` : ''}
  </div>`;
}

// ============================================
// SECTION SLIDE - Bold section divider
// ============================================

function renderSectionSlide(slide: SlideSpec, theme: Theme, themeStyle: ThemeStyle): string {
  const title = escapeHtml(slide.title || '');
  const c = theme.colors;

  if (themeStyle === 'minimal') {
    return `
    <div class="slide col center theme-bg">
      <div style="width: 60px; height: 60px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; margin-bottom: 32px;">
        <p style="color: #000; font-size: 36px; font-weight: 600; margin: 0;">§</p>
      </div>
      <h2 style="color: #000; text-align: center; font-size: 56px; font-weight: 700; letter-spacing: -1.5px; line-height: 1.1;">${title}</h2>
    </div>`;
  }

  return `
  <div class="slide col center theme-title-bg" style="position: relative; overflow: hidden;">
    <div style="position: absolute; width: 800px; height: 800px; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
    <div style="position: absolute; width: 600px; height: 600px; border: 1px solid rgba(255,255,255,0.05); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
    <h2 class="text-display" style="color: #FFFFFF; text-align: center; position: relative; z-index: 1;">${title}</h2>
  </div>`;
}

// ============================================
// CLOSING SLIDE - Impactful ending
// ============================================

function renderClosingSlide(slide: SlideSpec, theme: Theme, themeStyle: ThemeStyle): string {
  const title = escapeHtml(slide.title || '감사합니다');
  const message = escapeHtml(slide.keyMessage || '');
  const c = theme.colors;

  if (themeStyle === 'minimal') {
    return `
    <div class="slide col center theme-bg">
      <h1 class="text-hero" style="color: #000;">${title}</h1>
      ${message ? `<p class="text-body-lg" style="color: #666; margin-top: 24px;">${message}</p>` : ''}
    </div>`;
  }

  // CTA style button for other themes
  return `
  <div class="slide col center theme-title-bg" style="position: relative; overflow: hidden;">
    <div style="position: absolute; width: 600px; height: 600px; background: rgba(255,255,255,0.05); border-radius: 50%; top: -200px; right: -200px;"></div>

    <h1 class="text-hero" style="color: #FFFFFF; margin-bottom: 32px;">${title}</h1>
    ${message ? `
    <div style="background: rgba(255,255,255,0.15); padding: 16px 40px; border-radius: 50px; backdrop-filter: blur(10px);">
      <p class="text-body-lg" style="color: #FFFFFF;">${message}</p>
    </div>` : ''}
  </div>`;
}

// ============================================
// AGENDA SLIDE - Numbered list with style
// ============================================

function renderAgendaSlide(slide: SlideSpec, theme: Theme, themeStyle: ThemeStyle): string {
  const title = escapeHtml(slide.title || '목차');
  const blocks = slide.blocks || [];
  const c = theme.colors;

  const bulletBlock = blocks.find(b => b.type === 'bulletList');
  const items = bulletBlock?.type === 'bulletList' ? bulletBlock.items : [];

  if (themeStyle === 'minimal') {
    const itemsHtml = items.map((item, idx) => `
      <div style="display: flex; align-items: center; gap: 24px; padding: 20px 0; border-bottom: 1px solid #E5E5E5;">
        <p style="color: #000; font-weight: 300; font-size: 36px; margin: 0;">${String(idx + 1).padStart(2, '0')}</p>
        <p style="color: #333; font-size: 24px; font-weight: 400; line-height: 1.5; margin: 0;">${escapeHtml(item.content || '')}</p>
      </div>
    `).join('');

    return `
    <div class="slide row theme-bg">
      <div class="col" style="width: 35%; padding: 60px; justify-content: center; border-right: 1px solid #E5E5E5;">
        <h2 style="color: #000; font-weight: 300; font-size: 56px; letter-spacing: -1.5px; line-height: 1.1;">${title}</h2>
      </div>
      <div class="col flex-1" style="padding: 40px 60px; justify-content: center;">
        ${itemsHtml}
      </div>
    </div>`;
  }

  // Corporate/Modern style with numbered badges
  const itemsHtml = items.map((item, idx) => `
    <div style="display: flex; align-items: center; gap: 20px; padding: 18px 0;">
      <div style="width: 44px; height: 44px; background: #${c.primary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <p style="color: #FFFFFF; font-weight: 700; font-size: 18px; margin: 0;">${idx + 1}</p>
      </div>
      <p style="color: #${c.surfaceForeground}; font-size: 24px; font-weight: 400; line-height: 1.5; margin: 0;">${escapeHtml(item.content || '')}</p>
    </div>
  `).join('');

  return `
  <div class="slide row theme-bg">
    <!-- Left accent sidebar -->
    <div class="sidebar"></div>

    <!-- Content -->
    <div class="col flex-1" style="padding: 48px 60px;">
      <!-- Title with underline -->
      <div style="margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid #${c.primary};">
        <h2 style="color: #${c.primary}; font-size: 44px; font-weight: 700; letter-spacing: -1px; line-height: 1.15;">${title}</h2>
      </div>

      <!-- Agenda items -->
      <div class="col" style="gap: 8px;">
        ${itemsHtml}
      </div>
    </div>
  </div>`;
}

// ============================================
// CONTENT SLIDE - Main content layout
// ============================================

function renderContentSlide(
  slide: SlideSpec,
  theme: Theme,
  themeStyle: ThemeStyle,
  placeholders: PlaceholderInfo[]
): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];
  const c = theme.colors;

  // Check for charts/tables
  const hasChart = blocks.some(b => b.type === 'chart');
  const hasTable = blocks.some(b => b.type === 'table');
  if (hasChart || hasTable) {
    return renderTwoColumnWithPlaceholder(slide, theme, themeStyle, placeholders);
  }

  const contentHTML = renderContentBlocks(blocks, theme, themeStyle);

  if (themeStyle === 'minimal') {
    return `
    <div class="slide col theme-bg" style="padding: 60px 80px;">
      <!-- Title -->
      <div style="margin-bottom: 40px;">
        <h2 class="text-h1" style="color: #000; font-weight: 400;">${title}</h2>
        <div style="width: 60px; height: 2px; background: #000; margin-top: 16px;"></div>
      </div>

      <!-- Content -->
      <div class="col flex-1" style="justify-content: center;">
        ${contentHTML}
      </div>
    </div>`;
  }

  if (themeStyle === 'dark' || themeStyle === 'vercel' || themeStyle === 'supabase' || themeStyle === 'cyberpunk') {
    return `
    <div class="slide row theme-bg" style="position: relative;">
      <!-- Accent sidebar -->
      <div class="sidebar"></div>

      <!-- Decorative glow -->
      <div style="position: absolute; width: 300px; height: 300px; background: #${c.primary}; opacity: 0.05; border-radius: 50%; top: -100px; right: 100px; filter: blur(60px);"></div>

      <!-- Content area -->
      <div class="col flex-1" style="padding: 48px 60px;">
        <!-- Title with accent -->
        <div style="margin-bottom: 32px;">
          <h2 class="text-h1" style="color: #FFFFFF;">${title}</h2>
          <div class="divider" style="background: #${c.primary}; margin-top: 16px;"></div>
        </div>

        <!-- Content -->
        <div class="col flex-1" style="justify-content: flex-start; gap: 16px;">
          ${contentHTML}
        </div>
      </div>
    </div>`;
  }

  // Default corporate style with sidebar accent
  return `
  <div class="slide row theme-bg">
    <!-- Accent sidebar -->
    <div class="sidebar"></div>

    <!-- Content area -->
    <div class="col flex-1" style="padding: 48px 60px;">
      <!-- Title zone -->
      <div style="margin-bottom: 28px; padding-bottom: 14px; border-bottom: 3px solid #${c.primary};">
        <h2 class="text-h1" style="color: #${c.primary};">${title}</h2>
      </div>

      <!-- Content -->
      <div class="col flex-1" style="justify-content: flex-start; gap: 12px;">
        ${contentHTML}
      </div>
    </div>

    <!-- Right decorative bar -->
    <div style="width: 40px; background: linear-gradient(180deg, #${c.muted} 0%, transparent 100%);"></div>
  </div>`;
}

// ============================================
// TWO COLUMN SLIDE
// ============================================

function renderTwoColumnSlide(
  slide: SlideSpec,
  theme: Theme,
  themeStyle: ThemeStyle,
  placeholders: PlaceholderInfo[]
): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];
  const c = theme.colors;

  const midPoint = Math.ceil(blocks.length / 2);
  const leftBlocks = blocks.slice(0, midPoint);
  const rightBlocks = blocks.slice(midPoint);

  const leftContent = renderContentBlocks(leftBlocks, theme, themeStyle);
  const rightContent = renderContentBlocks(rightBlocks, theme, themeStyle);

  return `
  <div class="slide row theme-bg">
    <div class="sidebar"></div>

    <div class="col flex-1" style="padding: 48px 60px;">
      <!-- Title -->
      <div style="margin-bottom: 28px; padding-bottom: 14px; border-bottom: 3px solid #${c.primary};">
        <h2 class="text-h1" style="color: #${c.primary};">${title}</h2>
      </div>

      <!-- Two column content -->
      <div class="row flex-1" style="gap: 40px;">
        <div class="col" style="flex: 1; gap: 16px;">
          ${leftContent}
        </div>
        <div style="width: 1px; background: #${c.border};"></div>
        <div class="col" style="flex: 1; gap: 16px;">
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
  themeStyle: ThemeStyle,
  placeholders: PlaceholderInfo[]
): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];
  const c = theme.colors;

  const items = blocks.filter(b => b.type === 'text' || b.type === 'bulletList');
  const half = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, half);
  const rightItems = items.slice(half);

  const leftContent = renderContentBlocks(leftItems, theme, themeStyle);
  const rightContent = renderContentBlocks(rightItems, theme, themeStyle);

  return `
  <div class="slide row theme-bg">
    <div class="sidebar"></div>

    <div class="col flex-1" style="padding: 48px 60px;">
      <!-- Title -->
      <div style="margin-bottom: 28px; padding-bottom: 14px; border-bottom: 3px solid #${c.primary};">
        <h2 class="text-h1" style="color: #${c.primary};">${title}</h2>
      </div>

      <!-- Comparison cards -->
      <div class="row flex-1" style="gap: 24px;">
        <div class="col card" style="flex: 1; background: #${c.muted}; border-radius: 12px; padding: 28px;">
          ${leftContent}
        </div>
        <div class="col card" style="flex: 1; background: #${c.muted}; border-radius: 12px; padding: 28px;">
          ${rightContent}
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================
// SUMMARY SLIDE
// ============================================

function renderSummarySlide(slide: SlideSpec, theme: Theme, themeStyle: ThemeStyle): string {
  const title = escapeHtml(slide.title || '요약');
  const blocks = slide.blocks || [];
  const c = theme.colors;

  const contentHTML = renderContentBlocks(blocks, theme, themeStyle);

  return `
  <div class="slide row theme-bg">
    <div class="sidebar"></div>

    <div class="col flex-1" style="padding: 48px 60px;">
      <!-- Title with icon -->
      <div style="margin-bottom: 28px; padding-bottom: 14px; border-bottom: 3px solid #${c.primary};">
        <h2 style="color: #${c.primary}; font-size: 44px; font-weight: 700; letter-spacing: -1px; line-height: 1.15; margin: 0;">${title}</h2>
      </div>

      <!-- Content -->
      <div class="col flex-1" style="justify-content: flex-start; gap: 12px;">
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
  themeStyle: ThemeStyle,
  placeholders: PlaceholderInfo[]
): string {
  const title = escapeHtml(slide.title || '');
  const blocks = slide.blocks || [];
  const c = theme.colors;

  const textBlocks = blocks.filter(b => b.type === 'text' || b.type === 'bulletList');
  const chartBlock = blocks.find(b => b.type === 'chart') as ChartBlock | undefined;
  const tableBlock = blocks.find(b => b.type === 'table') as TableBlock | undefined;

  const textContent = renderContentBlocks(textBlocks, theme, themeStyle);

  let placeholderId = '';
  if (chartBlock) {
    placeholderId = `chart-${slide.id}`;
    placeholders.push({ id: placeholderId, type: 'chart', data: chartBlock });
  } else if (tableBlock) {
    placeholderId = `table-${slide.id}`;
    placeholders.push({ id: placeholderId, type: 'table', data: tableBlock });
  }

  return `
  <div class="slide row theme-bg">
    <div class="sidebar"></div>

    <div class="col flex-1" style="padding: 48px 60px;">
      <!-- Title -->
      <div style="margin-bottom: 28px; padding-bottom: 14px; border-bottom: 3px solid #${c.primary};">
        <h2 class="text-h1" style="color: #${c.primary};">${title}</h2>
      </div>

      <!-- 30/70 split layout -->
      <div class="row flex-1" style="gap: 32px;">
        <div class="col" style="width: 35%; gap: 16px;">
          ${textContent || `<p style="color: #${c.mutedForeground};">내용을 입력하세요</p>`}
        </div>
        <div class="col flex-1" style="background: #${c.muted}; border-radius: 12px; min-height: 300px;" id="${placeholderId}">
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================
// Content Block Renderers
// ============================================

function renderContentBlocks(blocks: ContentBlock[], theme: Theme, themeStyle: ThemeStyle): string {
  return blocks.map(block => renderBlock(block, theme, themeStyle)).join('\n');
}

function renderBlock(block: ContentBlock, theme: Theme, themeStyle: ThemeStyle): string {
  switch (block.type) {
    case 'text':
      return renderTextBlock(block, theme, themeStyle);
    case 'bulletList':
      return renderBulletListBlock(block, theme, themeStyle);
    default:
      return '';
  }
}

function renderTextBlock(block: ContentBlock, theme: Theme, themeStyle: ThemeStyle): string {
  if (block.type !== 'text') return '';

  const content = escapeHtml(block.content || '');
  const importance = block.importance || 3;
  const c = theme.colors;

  const isDark = ['dark', 'vercel', 'supabase', 'cyberpunk'].includes(themeStyle);
  const textColor = isDark ? 'rgba(255,255,255,0.9)' : `#${c.surfaceForeground}`;
  const highlightColor = isDark ? '#FFFFFF' : `#${c.primary}`;

  if (importance >= 5) {
    return `<p class="text-h3" style="color: ${highlightColor}; font-weight: 600; margin-bottom: 12px;">${content}</p>`;
  } else if (importance >= 4) {
    return `<p class="text-body-lg" style="color: ${textColor}; font-weight: 500; margin-bottom: 8px;">${content}</p>`;
  }
  return `<p class="text-body" style="color: ${textColor}; margin-bottom: 8px;">${content}</p>`;
}

function renderBulletListBlock(block: ContentBlock, theme: Theme, themeStyle: ThemeStyle): string {
  if (block.type !== 'bulletList' || !block.items) return '';

  const c = theme.colors;
  const isDark = ['dark', 'vercel', 'supabase', 'cyberpunk'].includes(themeStyle);
  const textColor = isDark ? 'rgba(255,255,255,0.9)' : `#${c.surfaceForeground}`;
  const bulletColor = `#${c.primary}`;

  const items = block.items.map(item => {
    const content = escapeHtml(item.content || '');
    const level = item.level || 0;
    const indent = level * 24;
    const bulletSize = level === 0 ? 10 : 8;
    const opacity = level === 0 ? 1 : 0.7;

    return `
      <li style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; padding-left: ${indent}px;">
        <div style="background: ${bulletColor}; width: ${bulletSize}px; height: ${bulletSize}px; border-radius: 50%; margin-top: 8px; flex-shrink: 0; opacity: ${opacity};"></div>
        <p style="color: ${textColor}; font-size: 20px; font-weight: 400; line-height: 1.6; margin: 0;">${content}</p>
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
