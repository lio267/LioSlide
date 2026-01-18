'use client';

/**
 * ThemePreview - 6개 테마 미리보기 카드 컴포넌트
 * 실제 슬라이드 모양의 축소판을 보여줌
 */

import React from 'react';
import { THEMES, THEME_IDS, type ThemeId, type Theme } from '@/themes/themeConfig';

interface ThemePreviewProps {
  selectedTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * 개별 테마 카드 - 슬라이드 축소판 형태
 */
function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  const { colors, preview, nameKo, descriptionKo } = theme;

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full rounded-xl overflow-hidden transition-all duration-200
        ${isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg scale-[1.02]'
          : 'hover:shadow-md hover:scale-[1.01]'
        }
      `}
      style={{ aspectRatio: '16/9' }}
    >
      {/* 슬라이드 미리보기 영역 */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: colors.background }}
      >
        {/* 테마별 데코레이션 */}
        {theme.id === 'corporate-blue' && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-[10%]"
              style={{
                background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              }}
            />
            <div
              className="absolute right-[8%] top-[10%] w-[15%] h-[3%]"
              style={{ backgroundColor: colors.accent }}
            />
          </>
        )}

        {theme.id === 'dark-professional' && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 70% 20%, ${colors.accent}30 0%, transparent 50%)`,
              }}
            />
          </>
        )}

        {theme.id === 'minimal-white' && (
          <div
            className="absolute left-[15%] right-[15%] bottom-[18%] h-[1px]"
            style={{ backgroundColor: colors.primary }}
          />
        )}

        {theme.id === 'creative-yellow' && (
          <>
            <div
              className="absolute -right-[10%] -top-[20%] w-[50%] h-[80%] rounded-full opacity-30"
              style={{ backgroundColor: colors.primary }}
            />
            <div
              className="absolute -left-[8%] -bottom-[15%] w-[35%] h-[60%] rounded-full opacity-15"
              style={{ backgroundColor: colors.accent }}
            />
          </>
        )}

        {theme.id === 'soft-gradient' && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
            }}
          />
        )}

        {theme.id === 'modern-teal' && (
          <>
            <div
              className="absolute right-[8%] top-[10%] w-[18%] h-[30%] border-2 rotate-45"
              style={{ borderColor: colors.primary }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-[4%]"
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})`,
              }}
            />
          </>
        )}

        {theme.id === 'high-contrast' && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-[3%]"
              style={{
                background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-[3%]"
              style={{
                background: `linear-gradient(180deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
              }}
            />
            <div
              className="absolute bottom-0 left-[3%] right-[3%] h-[3%]"
              style={{ backgroundColor: colors.primary }}
            />
          </>
        )}

        {/* 제목 미리보기 */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
          <div
            className="w-[60%] h-3 rounded-full mb-2"
            style={{
              backgroundColor:
                theme.category === 'dark' ? colors.text : colors.primary,
              opacity: 0.8,
            }}
          />
          <div
            className="w-[40%] h-2 rounded-full"
            style={{
              backgroundColor: colors.textMuted,
              opacity: 0.5,
            }}
          />
        </div>
      </div>

      {/* 테마 정보 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-sm font-medium">{nameKo}</p>
        <p className="text-white/70 text-xs truncate">{descriptionKo}</p>
      </div>

      {/* 선택 표시 */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

/**
 * 테마 프리뷰 그리드 컴포넌트
 */
export function ThemePreview({ selectedTheme, onSelectTheme }: ThemePreviewProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">테마 선택</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {THEME_IDS.map((themeId) => (
          <ThemeCard
            key={themeId}
            theme={THEMES[themeId]}
            isSelected={selectedTheme === themeId}
            onClick={() => onSelectTheme(themeId)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 테마 선택 드롭다운 (간소화된 버전)
 */
export function ThemeSelect({
  selectedTheme,
  onSelectTheme,
}: ThemePreviewProps) {
  return (
    <select
      value={selectedTheme}
      onChange={(e) => onSelectTheme(e.target.value as ThemeId)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {THEME_IDS.map((themeId) => (
        <option key={themeId} value={themeId}>
          {THEMES[themeId].nameKo} - {THEMES[themeId].descriptionKo}
        </option>
      ))}
    </select>
  );
}

/**
 * 현재 테마 미니 프리뷰 (선택된 테마 표시용)
 */
export function ThemeMiniPreview({ themeId }: { themeId: ThemeId }) {
  const theme = THEMES[themeId];
  if (!theme) return null;

  return (
    <div
      className="w-16 h-9 rounded overflow-hidden border border-gray-200"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* 간단한 슬라이드 형태 표시 */}
      <div className="w-full h-full flex flex-col justify-center items-center p-1">
        <div
          className="w-[60%] h-1 rounded-full mb-0.5"
          style={{
            backgroundColor:
              theme.category === 'dark'
                ? theme.colors.text
                : theme.colors.primary,
          }}
        />
        <div
          className="w-[40%] h-0.5 rounded-full"
          style={{ backgroundColor: theme.colors.textMuted }}
        />
      </div>
    </div>
  );
}

export default ThemePreview;
