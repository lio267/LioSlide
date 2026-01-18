'use client';

import { useState } from 'react';
import { THEME_OPTIONS } from './index';

interface ActionBarProps {
  onAddSlide: () => void;
  onChangeAllTheme: (color: string) => void;
  onDownload?: () => void;
  currentTheme: string;
  slideCount: number;
  presentationTitle: string;
}

export default function ActionBar({
  onAddSlide,
  onChangeAllTheme,
  onDownload,
  currentTheme,
  slideCount,
  presentationTitle,
}: ActionBarProps) {
  const [showThemeModal, setShowThemeModal] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* 좌측: 프레젠테이션 정보 */}
          <div className="flex items-center gap-3 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `#${currentTheme}` }}
            />
            <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">
              {presentationTitle}
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              {slideCount}개 슬라이드
            </span>
          </div>

          {/* 중앙/우측: 액션 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 새 슬라이드 추가 */}
            <button
              onClick={onAddSlide}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
                text-slate-700 dark:text-slate-200 text-sm font-medium
                transition-all duration-200
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">새 슬라이드</span>
              <span className="sm:hidden">추가</span>
            </button>

            {/* 전체 테마 변경 */}
            <button
              onClick={() => setShowThemeModal(true)}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
                text-slate-700 dark:text-slate-200 text-sm font-medium
                transition-all duration-200
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="hidden sm:inline">전체 테마 변경</span>
              <span className="sm:hidden">테마</span>
            </button>

            {/* 구분선 */}
            <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-600" />

            {/* 다운로드 버튼 */}
            {onDownload && (
              <button
                onClick={onDownload}
                className="
                  flex items-center gap-2 px-5 py-2 rounded-lg
                  bg-gradient-to-r from-primary-600 to-primary-500
                  hover:from-primary-700 hover:to-primary-600
                  text-white text-sm font-semibold
                  shadow-lg shadow-primary-500/30
                  transition-all duration-200 hover:shadow-xl hover:shadow-primary-500/40
                  hover:-translate-y-0.5
                "
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>PPT 다운로드</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 전체 테마 변경 모달 */}
      {showThemeModal && (
        <ThemeModal
          currentTheme={currentTheme}
          onSelect={(color) => {
            onChangeAllTheme(color);
            setShowThemeModal(false);
          }}
          onClose={() => setShowThemeModal(false)}
        />
      )}
    </>
  );
}

// 테마 선택 모달
function ThemeModal({
  currentTheme,
  onSelect,
  onClose,
}: {
  currentTheme: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = (color: string) => {
    setIsAnimating(true);
    setSelectedTheme(color);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="
          bg-white dark:bg-slate-800 rounded-2xl shadow-2xl
          max-w-lg w-full overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            전체 테마 변경
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            모든 슬라이드에 적용될 테마 색상을 선택하세요
          </p>
        </div>

        {/* 미리보기 */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
          <div
            className={`
              aspect-video rounded-xl overflow-hidden shadow-lg
              transition-all duration-300
              ${isAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
            `}
          >
            <PreviewSlide themeColor={selectedTheme} />
          </div>
        </div>

        {/* 테마 선택 그리드 */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.color)}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200
                  hover:bg-slate-50 dark:hover:bg-slate-700/50
                  ${selectedTheme === theme.color
                    ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500'
                    : ''
                  }
                `}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full shadow-lg
                    transition-transform duration-200
                    ${selectedTheme === theme.color ? 'scale-110 ring-4 ring-white dark:ring-slate-700' : ''}
                  `}
                  style={{ backgroundColor: `#${theme.color}` }}
                />
                <span className={`
                  text-xs font-medium text-center leading-tight
                  ${selectedTheme === theme.color
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400'
                  }
                `}>
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded-lg
              bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
              text-slate-700 dark:text-slate-200 text-sm font-medium
              transition-colors
            "
          >
            취소
          </button>
          <button
            onClick={() => onSelect(selectedTheme)}
            className="
              px-5 py-2 rounded-lg
              bg-primary-600 hover:bg-primary-700
              text-white text-sm font-semibold
              transition-colors
            "
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
}

// 미리보기 슬라이드
function PreviewSlide({ themeColor }: { themeColor: string }) {
  return (
    <div className="w-full h-full flex">
      {/* 왼쪽: 표지 슬라이드 미리보기 */}
      <div
        className="w-1/2 h-full flex flex-col items-center justify-center p-4 transition-colors duration-300"
        style={{ backgroundColor: `#${themeColor}` }}
      >
        <div className="w-3/4 h-3 rounded-full bg-white/80 mb-2" />
        <div className="w-1/2 h-2 rounded-full bg-white/50" />
      </div>

      {/* 오른쪽: 콘텐츠 슬라이드 미리보기 */}
      <div className="w-1/2 h-full flex flex-col p-4 bg-white dark:bg-slate-800">
        <div
          className="h-2 rounded-full mb-3 w-2/3 transition-colors duration-300"
          style={{ backgroundColor: `#${themeColor}` }}
        />
        <div className="flex-1 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300"
                style={{ backgroundColor: `#${themeColor}` }}
              />
              <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full flex-1" style={{ width: `${100 - i * 15}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
