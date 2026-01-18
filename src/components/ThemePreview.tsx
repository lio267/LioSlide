/**
 * Theme Preview Component
 *
 * 6개 테마의 미리보기 카드를 표시합니다.
 * 실제 슬라이드 모양의 축소판을 보여주고 테마 선택 기능을 제공합니다.
 */

import React from 'react';
import {
  THEMES,
  getAllThemes,
  getTheme,
  isDarkTheme,
  type Theme,
  type ThemeId,
} from '../themes/themeConfig';

// ============================================
// 타입 정의
// ============================================

interface ThemePreviewProps {
  /** 현재 선택된 테마 ID */
  selectedTheme: string;
  /** 테마 선택 시 콜백 */
  onSelectTheme: (themeId: string) => void;
  /** 컴팩트 모드 (작은 카드) */
  compact?: boolean;
  /** 추가 클래스 이름 */
  className?: string;
}

interface ThemeCardProps {
  /** 테마 설정 */
  theme: Theme;
  /** 선택 여부 */
  isSelected: boolean;
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 컴팩트 모드 */
  compact?: boolean;
}

// ============================================
// 테마 프리뷰 썸네일 컴포넌트
// ============================================

function ThemeThumbnail({ theme, compact }: { theme: Theme; compact?: boolean }) {
  const { colors } = theme;
  const height = compact ? 80 : 120;
  const titleSize = compact ? 10 : 14;
  const textSize = compact ? 6 : 8;

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        background: colors.background,
        borderRadius: `${theme.borderRadius}px`,
        overflow: 'hidden',
        position: 'relative',
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* 데코레이션 - 테마별 */}
      {theme.id === 'corporate-blue' && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: compact ? '8px' : '12px',
              background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: compact ? '8px' : '12px',
              top: compact ? '8px' : '12px',
              width: compact ? '24px' : '36px',
              height: '3px',
              background: colors.accent,
            }}
          />
        </>
      )}

      {theme.id === 'dark-professional' && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 70% 20%, ${colors.accent}33 0%, transparent 50%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: compact ? '8px' : '12px',
              bottom: compact ? '8px' : '12px',
              width: compact ? '20px' : '30px',
              height: '2px',
              background: `linear-gradient(90deg, ${colors.accent}, transparent)`,
            }}
          />
        </>
      )}

      {theme.id === 'minimal-white' && (
        <div
          style={{
            position: 'absolute',
            left: compact ? '16px' : '24px',
            right: compact ? '16px' : '24px',
            bottom: compact ? '16px' : '24px',
            height: '1px',
            background: colors.primary,
          }}
        />
      )}

      {theme.id === 'creative-yellow' && (
        <>
          <div
            style={{
              position: 'absolute',
              right: compact ? '-16px' : '-24px',
              top: compact ? '-16px' : '-24px',
              width: compact ? '48px' : '72px',
              height: compact ? '48px' : '72px',
              background: colors.primary,
              borderRadius: '50%',
              opacity: 0.3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: compact ? '6px' : '10px',
              left: compact ? '8px' : '12px',
              right: compact ? '8px' : '12px',
              height: '3px',
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
            }}
          />
        </>
      )}

      {theme.id === 'soft-gradient' && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.accent}15 100%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: compact ? '-10px' : '-16px',
              top: compact ? '-10px' : '-16px',
              width: compact ? '40px' : '60px',
              height: compact ? '40px' : '60px',
              background: `radial-gradient(circle, ${colors.primary}40 0%, transparent 70%)`,
              borderRadius: '50%',
            }}
          />
        </>
      )}

      {theme.id === 'modern-teal' && (
        <>
          <div
            style={{
              position: 'absolute',
              right: compact ? '8px' : '12px',
              top: compact ? '8px' : '12px',
              width: compact ? '20px' : '30px',
              height: compact ? '20px' : '30px',
              border: `2px solid ${colors.primary}`,
              transform: 'rotate(45deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})`,
            }}
          />
        </>
      )}

      {/* 콘텐츠 미리보기 */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: compact ? '10px 12px' : '16px 20px',
          paddingLeft: theme.id === 'corporate-blue' ? (compact ? '20px' : '28px') : undefined,
        }}
      >
        <div
          style={{
            fontSize: `${titleSize}px`,
            fontWeight: 700,
            color: colors.text,
            marginBottom: compact ? '4px' : '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {theme.nameKo}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '2px' : '4px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: compact ? '4px' : '6px',
                background: colors.textMuted,
                borderRadius: '2px',
                width: `${90 - i * 15}%`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 테마 카드 컴포넌트
// ============================================

function ThemeCard({ theme, isSelected, onClick, compact }: ThemeCardProps) {
  const { colors } = theme;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: compact ? '8px' : '12px',
        background: isSelected ? `${colors.primary}10` : 'transparent',
        border: isSelected ? `2px solid ${colors.primary}` : '2px solid transparent',
        borderRadius: `${Math.max(theme.borderRadius, 8)}px`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = `${colors.primary}08`;
          e.currentTarget.style.border = `2px solid ${colors.border}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.border = '2px solid transparent';
        }
      }}
    >
      {/* 썸네일 */}
      <ThemeThumbnail theme={theme} compact={compact} />

      {/* 테마 정보 */}
      <div style={{ marginTop: compact ? '8px' : '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontSize: compact ? '13px' : '15px',
              fontWeight: 600,
              color: '#1f2937',
            }}
          >
            {theme.nameKo}
          </span>
          {isSelected && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                background: colors.primary,
                color: isDarkTheme(theme.id) ? colors.background : '#ffffff',
                borderRadius: '4px',
                fontWeight: 500,
              }}
            >
              선택됨
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: compact ? '11px' : '12px',
            color: '#6b7280',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {theme.descriptionKo}
        </p>

        {/* 태그 */}
        {!compact && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginTop: '8px',
            }}
          >
            {theme.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  borderRadius: '4px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================
// 메인 ThemePreview 컴포넌트
// ============================================

export function ThemePreview({
  selectedTheme,
  onSelectTheme,
  compact = false,
  className = '',
}: ThemePreviewProps) {
  const themes = getAllThemes();

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
        gap: compact ? '12px' : '16px',
      }}
    >
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isSelected={selectedTheme === theme.id}
          onClick={() => onSelectTheme(theme.id)}
          compact={compact}
        />
      ))}
    </div>
  );
}

// ============================================
// 단일 테마 프리뷰 (선택된 테마 표시용)
// ============================================

export function SelectedThemePreview({
  themeId,
  className = '',
}: {
  themeId: string;
  className?: string;
}) {
  const theme = getTheme(themeId);

  return (
    <div className={className}>
      <ThemeThumbnail theme={theme} />
      <div style={{ marginTop: '8px' }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          {theme.nameKo}
        </span>
        <p
          style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '4px 0 0 0',
          }}
        >
          {theme.descriptionKo}
        </p>
      </div>
    </div>
  );
}

// ============================================
// 색상 팔레트 프리뷰
// ============================================

export function ThemeColorPalette({
  themeId,
  className = '',
}: {
  themeId: string;
  className?: string;
}) {
  const theme = getTheme(themeId);
  const { colors } = theme;

  const colorItems = [
    { name: '배경', value: colors.background },
    { name: '표면', value: colors.surface },
    { name: '주요', value: colors.primary },
    { name: '텍스트', value: colors.text },
    { name: '흐린', value: colors.textMuted },
    { name: '강조', value: colors.accent },
    { name: '테두리', value: colors.border },
  ];

  return (
    <div className={className}>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {colorItems.map((item) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: item.value,
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
              }}
              title={`${item.name}: ${item.value}`}
            />
            <span style={{ fontSize: '9px', color: '#6b7280' }}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThemePreview;
