/**
 * 테마 설정 통합 파일
 * 모든 슬라이드에 일관된 테마 적용을 위한 중앙 설정
 *
 * 6개 테마:
 * 1. dark-professional - 다크 프로페셔널
 * 2. corporate-blue - 비즈니스 블루
 * 3. minimal-white - 미니멀 화이트
 * 4. creative-yellow - 크리에이티브 옐로우
 * 5. soft-gradient - 소프트 그라데이션
 * 6. modern-teal - 모던 틸
 */

// ============================================
// 1. 타입 정의
// ============================================

export interface ThemeColors {
  /** 메인 배경색 */
  background: string;
  /** 보조 배경색 (카드, 섹션) */
  surface: string;
  /** 주요 브랜드 색상 */
  primary: string;
  /** 주요 색상 어두운 버전 */
  primaryDark: string;
  /** 주요 색상 밝은 버전 */
  primaryLight: string;
  /** 기본 텍스트 색상 */
  text: string;
  /** 흐린 텍스트 색상 */
  textMuted: string;
  /** 강조 색상 */
  accent: string;
  /** 강조 색상 위의 텍스트 색상 */
  accentForeground: string;
  /** 테두리 색상 */
  border: string;
}

export interface ThemeMeta {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: 'dark' | 'light' | 'colorful';
  tags: string[];
  fontHeading: string;
  fontBody: string;
  borderRadius: number;
}

export interface ThemePreview {
  /** Tailwind gradient 클래스 */
  gradient: string;
  /** 프리뷰 강조 색상 */
  accentColor: string;
  /** 스타일 유형 */
  style: 'dark' | 'light' | 'gradient' | 'minimal' | 'creative' | 'modern';
}

export interface Theme extends ThemeMeta {
  colors: ThemeColors;
  preview: ThemePreview;
}

// ============================================
// 2. 테마 정의
// ============================================

export const THEMES: Record<string, Theme> = {
  'dark-professional': {
    id: 'dark-professional',
    name: 'Dark Professional',
    nameKo: '다크 프로페셔널',
    description: 'Elegant dark theme for impactful presentations',
    descriptionKo: '임팩트 있는 발표를 위한 세련된 다크 테마',
    category: 'dark',
    tags: ['다크', '세련된', '임팩트', '프리미엄'],
    fontHeading: 'Pretendard',
    fontBody: 'Pretendard',
    borderRadius: 4,
    colors: {
      background: '#09090b',
      surface: '#18181b',
      primary: '#fafafa',
      primaryDark: '#e4e4e7',
      primaryLight: '#ffffff',
      text: '#fafafa',
      textMuted: '#a1a1aa',
      accent: '#d4af37',
      accentForeground: '#09090b',
      border: '#27272a',
    },
    preview: {
      gradient: 'from-zinc-900 via-neutral-900 to-black',
      accentColor: '#d4af37',
      style: 'dark',
    },
  },

  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    nameKo: '비즈니스 블루',
    description: 'Modern and professional blue theme for business presentations',
    descriptionKo: '비즈니스 발표를 위한 현대적이고 전문적인 블루 테마',
    category: 'light',
    tags: ['비즈니스', '전문적', '기업', '모던', '프리미엄'],
    fontHeading: 'Pretendard',
    fontBody: 'Pretendard',
    borderRadius: 8,
    colors: {
      background: '#ffffff',
      surface: '#f8fafc',
      primary: '#2563eb',
      primaryDark: '#1d4ed8',
      primaryLight: '#3b82f6',
      text: '#1e293b',
      textMuted: '#64748b',
      accent: '#f97316',
      accentForeground: '#ffffff',
      border: '#cbd5e1',
    },
    preview: {
      gradient: 'from-blue-600 to-blue-700',
      accentColor: '#f97316',
      style: 'light',
    },
  },

  'minimal-white': {
    id: 'minimal-white',
    name: 'Minimal White',
    nameKo: '미니멀 화이트',
    description: 'Elegant minimalist theme with generous whitespace',
    descriptionKo: '넉넉한 여백과 세련된 타이포그래피의 미니멀 테마',
    category: 'light',
    tags: ['미니멀', '깔끔', '심플', '우아한', '모던'],
    fontHeading: 'Pretendard',
    fontBody: 'Pretendard',
    borderRadius: 0,
    colors: {
      background: '#ffffff',
      surface: '#fafafa',
      primary: '#171717',
      primaryDark: '#0a0a0a',
      primaryLight: '#404040',
      text: '#171717',
      textMuted: '#737373',
      accent: '#171717',
      accentForeground: '#ffffff',
      border: '#e5e5e5',
    },
    preview: {
      gradient: 'from-neutral-50 to-white',
      accentColor: '#171717',
      style: 'minimal',
    },
  },

  'creative-yellow': {
    id: 'creative-yellow',
    name: 'Creative Yellow',
    nameKo: '크리에이티브 옐로우',
    description: 'Vibrant yellow theme for creative presentations',
    descriptionKo: '창의적인 발표를 위한 생동감 있는 옐로우 테마',
    category: 'colorful',
    tags: ['크리에이티브', '활기찬', '마케팅', '에너지'],
    fontHeading: 'Pretendard',
    fontBody: 'Pretendard',
    borderRadius: 12,
    colors: {
      background: '#fffbeb',
      surface: '#fef3c7',
      primary: '#f59e0b',
      primaryDark: '#d97706',
      primaryLight: '#fbbf24',
      text: '#1c1917',
      textMuted: '#57534e',
      accent: '#ff6b35',
      accentForeground: '#ffffff',
      border: '#fde68a',
    },
    preview: {
      gradient: 'from-amber-400 via-yellow-400 to-orange-400',
      accentColor: '#ff6b35',
      style: 'creative',
    },
  },

  'soft-gradient': {
    id: 'soft-gradient',
    name: 'Soft Gradient',
    nameKo: '소프트 그라데이션',
    description: 'Soft pastel gradient theme for gentle presentations',
    descriptionKo: '부드러운 파스텔 그라데이션 테마',
    category: 'colorful',
    tags: ['부드러운', '파스텔', '그라데이션', '우아한'],
    fontHeading: 'Pretendard',
    fontBody: 'Pretendard',
    borderRadius: 12,
    colors: {
      background: '#faf5ff',
      surface: '#f3e8ff',
      primary: '#7c3aed',
      primaryDark: '#6d28d9',
      primaryLight: '#8b5cf6',
      text: '#3b0764',
      textMuted: '#6b21a8',
      accent: '#f472b6',
      accentForeground: '#ffffff',
      border: '#ddd6fe',
    },
    preview: {
      gradient: 'from-violet-400 via-purple-400 to-pink-400',
      accentColor: '#f472b6',
      style: 'gradient',
    },
  },

  'modern-teal': {
    id: 'modern-teal',
    name: 'Modern Teal',
    nameKo: '모던 틸',
    description: 'Modern teal theme for tech and startup presentations',
    descriptionKo: '테크/스타트업 발표에 적합한 모던 틸 테마',
    category: 'colorful',
    tags: ['모던', '테크', '스타트업', '신선한'],
    fontHeading: 'Pretendard',
    fontBody: 'Pretendard',
    borderRadius: 8,
    colors: {
      background: '#f0fdfa',
      surface: '#ccfbf1',
      primary: '#0d9488',
      primaryDark: '#0f766e',
      primaryLight: '#14b8a6',
      text: '#134e4a',
      textMuted: '#115e59',
      accent: '#f97316',
      accentForeground: '#ffffff',
      border: '#99f6e4',
    },
    preview: {
      gradient: 'from-teal-500 to-emerald-500',
      accentColor: '#f97316',
      style: 'modern',
    },
  },

  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    nameKo: '하이 콘트라스트',
    description: 'Bold high contrast theme for maximum visibility in presentations',
    descriptionKo: '발표장에서 최대 가시성을 위한 고대비 테마',
    category: 'dark',
    tags: ['고대비', '강렬한', '주목도', '발표'],
    fontHeading: 'Pretendard',
    fontBody: 'Pretendard',
    borderRadius: 0,
    colors: {
      background: '#000000',
      surface: '#1a1a1a',
      primary: '#ffcc00',
      primaryDark: '#e6b800',
      primaryLight: '#ffd633',
      text: '#ffffff',
      textMuted: '#cccccc',
      accent: '#ff6600',
      accentForeground: '#000000',
      border: '#333333',
    },
    preview: {
      gradient: 'from-yellow-500 via-orange-500 to-red-500',
      accentColor: '#ff6600',
      style: 'dark',
    },
  },
};

// ============================================
// 3. 테마 ID 및 기본값
// ============================================

/** 테마 ID 목록 */
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

/** 테마 ID 타입 */
export type ThemeId = keyof typeof THEMES;

/** 기본 테마 ID */
export const DEFAULT_THEME_ID: ThemeId = 'corporate-blue';

// ============================================
// 4. 테마 유틸리티 함수
// ============================================

/**
 * 테마 ID로 테마 가져오기
 */
export function getTheme(themeId: string): Theme {
  return THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
}

/**
 * 모든 테마 목록 가져오기
 */
export function getAllThemes(): Theme[] {
  return Object.values(THEMES);
}

/**
 * 테마가 다크 테마인지 확인
 */
export function isDarkTheme(themeId: string): boolean {
  const theme = getTheme(themeId);
  return theme.category === 'dark';
}

/**
 * 카테고리별 테마 필터링
 */
export function getThemesByCategory(category: Theme['category']): Theme[] {
  return Object.values(THEMES).filter((theme) => theme.category === category);
}

/**
 * 테마 CSS 변수 문자열 생성
 */
export function getThemeCSSVariables(themeId: string): string {
  const theme = getTheme(themeId);
  const { colors } = theme;

  return `
    --theme-background: ${colors.background};
    --theme-surface: ${colors.surface};
    --theme-primary: ${colors.primary};
    --theme-primary-dark: ${colors.primaryDark};
    --theme-primary-light: ${colors.primaryLight};
    --theme-text: ${colors.text};
    --theme-text-muted: ${colors.textMuted};
    --theme-accent: ${colors.accent};
    --theme-accent-foreground: ${colors.accentForeground};
    --theme-border: ${colors.border};
    --theme-radius: ${theme.borderRadius}px;
    --theme-font-heading: ${theme.fontHeading}, sans-serif;
    --theme-font-body: ${theme.fontBody}, sans-serif;
  `;
}

/**
 * 테마 인라인 스타일 객체 생성 (React용)
 */
export function getThemeStyles(themeId: string): Record<string, string> {
  const theme = getTheme(themeId);
  const { colors } = theme;

  return {
    '--theme-background': colors.background,
    '--theme-surface': colors.surface,
    '--theme-primary': colors.primary,
    '--theme-primary-dark': colors.primaryDark,
    '--theme-primary-light': colors.primaryLight,
    '--theme-text': colors.text,
    '--theme-text-muted': colors.textMuted,
    '--theme-accent': colors.accent,
    '--theme-accent-foreground': colors.accentForeground,
    '--theme-border': colors.border,
  };
}

// ============================================
// 5. 슬라이드 타입별 테마 색상 헬퍼
// ============================================

export type SlideTypeForTheme = 'title' | 'content' | 'closing';

/**
 * 슬라이드 타입에 맞는 배경색 가져오기
 */
export function getSlideBackground(themeId: string, slideType: SlideTypeForTheme): string {
  const theme = getTheme(themeId);

  if (slideType === 'title' || slideType === 'closing') {
    // 다크 테마는 배경색 그대로, 라이트 테마는 surface
    return isDarkTheme(themeId) ? theme.colors.background : theme.colors.surface;
  }

  return theme.colors.background;
}

/**
 * 슬라이드 타입에 맞는 제목 색상 가져오기
 */
export function getSlideTitleColor(themeId: string, slideType: SlideTypeForTheme): string {
  const theme = getTheme(themeId);

  if (slideType === 'title' || slideType === 'closing') {
    // 다크 테마는 text 색상, 라이트 테마는 primaryDark
    return isDarkTheme(themeId) ? theme.colors.text : theme.colors.primaryDark;
  }

  // content 슬라이드는 primary 색상
  return theme.colors.primary;
}

/**
 * 슬라이드 타입에 맞는 본문 색상 가져오기
 */
export function getSlideTextColor(themeId: string): string {
  const theme = getTheme(themeId);
  return theme.colors.text;
}

/**
 * 슬라이드 타입에 맞는 흐린 텍스트 색상 가져오기
 */
export function getSlideMutedColor(themeId: string): string {
  const theme = getTheme(themeId);
  return theme.colors.textMuted;
}

/**
 * 슬라이드 타입에 맞는 테두리 색상 가져오기
 */
export function getSlideBorderColor(themeId: string): string {
  const theme = getTheme(themeId);
  return theme.colors.border;
}

/**
 * 슬라이드 타입에 맞는 강조 색상 가져오기
 */
export function getSlideAccentColor(themeId: string): string {
  const theme = getTheme(themeId);
  return theme.colors.accent;
}
