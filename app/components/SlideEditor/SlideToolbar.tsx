'use client';

import { useState, useRef, useEffect } from 'react';
import { SlideData } from '../SlidePreview';
import ThemeSelector from './ThemeSelector';
import LayoutSelector from './LayoutSelector';

interface SlideToolbarProps {
  currentIndex: number;
  totalSlides: number;
  currentSlide: SlideData;
  themeColor: string;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onThemeChange: (color: string) => void;
  onLayoutChange: (type: SlideData['type']) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function SlideToolbar({
  currentIndex,
  totalSlides,
  currentSlide,
  themeColor,
  onPrevSlide,
  onNextSlide,
  onThemeChange,
  onLayoutChange,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canDelete,
  canMoveUp,
  canMoveDown,
}: SlideToolbarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* 좌측: 네비게이션 */}
        <div className="flex items-center gap-2">
          {/* 이전/다음 버튼 */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={onPrevSlide}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm
                text-slate-700 dark:text-slate-200"
              title="이전 슬라이드 (Alt+Left)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">이전</span>
            </button>

            <div className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 min-w-[80px] text-center">
              <span className="text-primary-600 dark:text-primary-400">{currentIndex + 1}</span>
              <span className="mx-1">/</span>
              <span>{totalSlides}</span>
            </div>

            <button
              onClick={onNextSlide}
              disabled={currentIndex === totalSlides - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm
                text-slate-700 dark:text-slate-200"
              title="다음 슬라이드 (Alt+Right)"
            >
              <span className="hidden sm:inline">다음</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 구분선 */}
          <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-600" />

          {/* 테마 선택 */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">테마:</span>
            <ThemeSelector currentColor={themeColor} onChange={onThemeChange} />
          </div>

          {/* 레이아웃 선택 */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">레이아웃:</span>
            <LayoutSelector currentType={currentSlide?.type} onChange={onLayoutChange} />
          </div>
        </div>

        {/* 우측: 액션 버튼 */}
        <div className="flex items-center gap-1">
          {/* 순서 변경 버튼 */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-1.5 rounded-md transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm
                text-slate-600 dark:text-slate-300"
              title="위로 이동"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-1.5 rounded-md transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm
                text-slate-600 dark:text-slate-300"
              title="아래로 이동"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* 구분선 */}
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-600" />

          {/* 복제 버튼 */}
          <button
            onClick={onDuplicate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all
              bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
              text-slate-700 dark:text-slate-200"
            title="슬라이드 복제 (Ctrl+D)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">복제</span>
          </button>

          {/* 삭제 버튼 */}
          <button
            onClick={onDelete}
            disabled={!canDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40
              text-red-600 dark:text-red-400"
            title="슬라이드 삭제 (Delete)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">삭제</span>
          </button>
        </div>
      </div>

      {/* 모바일용 추가 컨트롤 */}
      <div className="md:hidden mt-3 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">테마:</span>
          <ThemeSelector currentColor={themeColor} onChange={onThemeChange} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">레이아웃:</span>
          <LayoutSelector currentType={currentSlide?.type} onChange={onLayoutChange} />
        </div>
      </div>
    </div>
  );
}
