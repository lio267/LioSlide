/**
 * Themes Index
 *
 * 테마 모듈 내보내기
 */

export {
  // 테마 설정
  THEMES,
  THEME_IDS,
  DEFAULT_THEME_ID,

  // 타입
  type Theme,
  type ThemeId,
  type ThemeColors,
  type ThemeMeta,
  type ThemePreview as ThemePreviewConfig,
  type SlideTypeForTheme,

  // 유틸리티 함수
  getTheme,
  getAllThemes,
  isDarkTheme,
  getThemesByCategory,
  getThemeCSSVariables,
  getThemeStyles,

  // 슬라이드별 색상 헬퍼
  getSlideBackground,
  getSlideTitleColor,
  getSlideTextColor,
  getSlideMutedColor,
  getSlideBorderColor,
  getSlideAccentColor,
} from './themeConfig';
