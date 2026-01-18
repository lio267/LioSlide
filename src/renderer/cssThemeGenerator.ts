/**
 * CSS Theme Generator - JSON 테마를 CSS 변수로 변환
 *
 * html2pptx 스킬 가이드에 맞춘 CSS 변수 생성
 * - 글로벌 CSS 프레임워크가 자동 주입됨
 * - :root 셀렉터로 변수만 오버라이드
 */

import type { Theme } from '../types/slideSpec';

/**
 * 테마를 CSS 변수 오버라이드 문자열로 변환
 * html2pptx의 global.css 변수와 호환
 */
export function generateThemeCSS(theme: Theme): string {
  const colors = theme.colors;
  const fonts = theme.fonts;

  return `:root {
  /* Typography */
  --font-family-display: ${fonts.display}, sans-serif;
  --font-weight-display: 600;
  --font-family-content: ${fonts.content}, sans-serif;
  --font-weight-content: 400;
  --font-size-content: 16px;
  --line-height-content: 1.4;

  /* Surface Colors */
  --color-surface: #${colors.surface};
  --color-surface-foreground: #${colors.surfaceForeground};

  /* Primary Colors */
  --color-primary: #${colors.primary};
  --color-primary-light: #${colors.primaryLight};
  --color-primary-dark: #${colors.primaryDark};
  --color-primary-foreground: #ffffff;

  /* Secondary Colors */
  --color-secondary: #${colors.secondary};
  --color-secondary-foreground: #${colors.surfaceForeground};

  /* Utility Colors */
  --color-muted: #${colors.muted};
  --color-muted-foreground: #${colors.mutedForeground};
  --color-accent: #${colors.accent};
  --color-accent-foreground: #${colors.surfaceForeground};
  --color-border: #${colors.border};

  /* Spacing */
  --spacing: 0.25rem;
  --gap: 1rem;
  --radius: 0.4rem;
}`;
}

/**
 * 테마 JSON 파일을 Theme 타입으로 변환
 */
export function parseThemeFile(themeJson: Record<string, unknown>): Partial<Theme> {
  const colors = themeJson.colors as Record<string, string> | undefined;
  const fonts = themeJson.fonts as Record<string, string> | undefined;

  return {
    name: themeJson.id as string || 'default',
    colors: colors ? {
      primary: colors.primary?.replace('#', '') || '1791e8',
      primaryLight: colors.secondary?.replace('#', '') || '4ba8ed',
      primaryDark: colors.primaryDark?.replace('#', '') || '1273ba',
      secondary: 'f5f5f5',
      surface: colors.background?.replace('#', '') || 'ffffff',
      surfaceForeground: colors.text?.replace('#', '') || '1d1d1d',
      muted: colors.backgroundAlt?.replace('#', '') || 'f5f5f5',
      mutedForeground: colors.textSecondary?.replace('#', '') || '737373',
      accent: colors.accent?.replace('#', '') || 'f5f5f5',
      border: 'c8c8c8',
    } : undefined,
    fonts: fonts ? {
      display: mapToWebSafeFont(fonts.heading || 'Arial'),
      content: mapToWebSafeFont(fonts.body || 'Arial'),
      mono: 'Courier New' as const,
    } : undefined,
  };
}

/**
 * 커스텀 폰트를 Web-safe 폰트로 매핑
 */
function mapToWebSafeFont(fontName: string): 'Arial' | 'Helvetica' | 'Times New Roman' | 'Georgia' | 'Verdana' | 'Trebuchet MS' | 'Courier New' | 'Impact' | 'Comic Sans MS' | 'Tahoma' {
  const fontMap: Record<string, 'Arial' | 'Helvetica' | 'Times New Roman' | 'Georgia' | 'Verdana' | 'Trebuchet MS' | 'Courier New' | 'Impact' | 'Comic Sans MS' | 'Tahoma'> = {
    'pretendard': 'Arial',
    'noto sans': 'Arial',
    'noto sans kr': 'Arial',
    'roboto': 'Arial',
    'inter': 'Arial',
    'sf pro': 'Helvetica',
    'segoe ui': 'Arial',
    'open sans': 'Arial',
    'lato': 'Arial',
    'montserrat': 'Arial',
    'nanum gothic': 'Arial',
    'nanum myeongjo': 'Georgia',
    'times': 'Times New Roman',
    'georgia': 'Georgia',
    'arial': 'Arial',
    'helvetica': 'Helvetica',
    'verdana': 'Verdana',
    'tahoma': 'Tahoma',
    'trebuchet': 'Trebuchet MS',
    'courier': 'Courier New',
    'impact': 'Impact',
  };

  const normalized = fontName.toLowerCase();
  return fontMap[normalized] || 'Arial';
}

// 이전 버전 호환성을 위한 별칭
export { generateThemeCSS as generateFullCSS };

export interface CSSThemeVariables {
  '--color-primary': string;
  '--color-primary-light': string;
  '--color-primary-dark': string;
  '--color-secondary': string;
  '--color-surface': string;
  '--color-surface-foreground': string;
  '--color-muted': string;
  '--color-muted-foreground': string;
  '--color-accent': string;
  '--color-border': string;
  '--font-display': string;
  '--font-content': string;
}

export function themeToCSSVariables(theme: Theme): CSSThemeVariables {
  return {
    '--color-primary': `#${theme.colors.primary}`,
    '--color-primary-light': `#${theme.colors.primaryLight}`,
    '--color-primary-dark': `#${theme.colors.primaryDark}`,
    '--color-secondary': `#${theme.colors.secondary}`,
    '--color-surface': `#${theme.colors.surface}`,
    '--color-surface-foreground': `#${theme.colors.surfaceForeground}`,
    '--color-muted': `#${theme.colors.muted}`,
    '--color-muted-foreground': `#${theme.colors.mutedForeground}`,
    '--color-accent': `#${theme.colors.accent}`,
    '--color-border': `#${theme.colors.border}`,
    '--font-display': theme.fonts.display,
    '--font-content': theme.fonts.content,
  };
}
