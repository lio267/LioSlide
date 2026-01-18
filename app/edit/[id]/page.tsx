'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SlideEditor from '../../components/SlideEditor';
import { SlideData } from '../../components/SlidePreview';
import { getPresentation, updateHistory, PresentationHistory } from '../../lib/historyStore';

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const [presentation, setPresentation] = useState<PresentationHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 프레젠테이션 로드
  useEffect(() => {
    const id = params.id as string;
    const pres = getPresentation(id);
    if (pres) {
      setPresentation(pres);
    }
    setIsLoading(false);
  }, [params.id]);

  // 다크모드 상태 확인
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  // 다크모드 토글
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // 슬라이드 변경 처리
  const handleSlidesChange = useCallback((newSlides: SlideData[]) => {
    if (!presentation) return;

    setPresentation({
      ...presentation,
      slidesData: newSlides,
      slideCount: newSlides.length,
    });
    setHasUnsavedChanges(true);
  }, [presentation]);

  // 테마 변경 처리
  const handleThemeChange = useCallback((newThemeColor: string) => {
    if (!presentation) return;

    setPresentation({
      ...presentation,
      themeColor: newThemeColor,
    });
    setHasUnsavedChanges(true);
  }, [presentation]);

  // 저장
  const handleSave = useCallback(async () => {
    if (!presentation) return;

    setIsSaving(true);
    try {
      updateHistory(presentation.id, {
        slidesData: presentation.slidesData,
        slideCount: presentation.slidesData.length,
        themeColor: presentation.themeColor,
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [presentation]);

  // 자동 저장 (30초마다)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, handleSave]);

  // 페이지 떠날 때 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: 저장
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // 다운로드 핸들러
  const handleDownload = useCallback(async () => {
    if (!presentation) return;

    // TODO: 실제 PPT 다운로드 구현
    console.log('Downloading presentation:', presentation.id);
    alert('다운로드 기능은 곧 추가될 예정입니다.');
  }, [presentation]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full spinner" />
          <span className="text-slate-500 dark:text-slate-400">로딩 중...</span>
        </div>
      </div>
    );
  }

  // 프레젠테이션을 찾을 수 없음
  if (!presentation) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            프레젠테이션을 찾을 수 없습니다
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            요청하신 프레젠테이션이 존재하지 않거나 삭제되었습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/history"
              className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              히스토리로 이동
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              새 프레젠테이션
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* 좌측: 로고 & 뒤로가기 */}
          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline text-sm">뒤로</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-600" />

            <Link href="/" className="flex items-center gap-2">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="lioSlideGradEdit" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
                <rect x="4" y="2" width="24" height="28" rx="4" className="fill-indigo-100 dark:fill-indigo-900/50"/>
                <path d="M10 8v16h12" stroke="url(#lioSlideGradEdit)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-bold text-slate-900 dark:text-white hidden sm:inline">
                LioSlide
              </span>
            </Link>
          </div>

          {/* 중앙: 제목 */}
          <div className="flex-1 max-w-md mx-4">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate text-center">
              {presentation.title}
            </h1>
          </div>

          {/* 우측: 액션 버튼 */}
          <div className="flex items-center gap-2">
            {/* 저장 상태 */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full spinner" />
                  <span>저장 중...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  <span>저장되지 않음</span>
                </>
              ) : lastSaved ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>저장됨</span>
                </>
              ) : null}
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400
                hover:bg-green-100 dark:hover:bg-green-900/40
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">저장</span>
            </button>

            {/* 미리보기 */}
            <Link
              href={`/viewer/${presentation.id}`}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300
                hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">미리보기</span>
            </Link>

            {/* 다크모드 토글 */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="다크모드 토글"
            >
              {darkMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 메인 에디터 */}
      <main className="flex-1 overflow-hidden">
        <SlideEditor
          slides={presentation.slidesData}
          themeColor={presentation.themeColor}
          aspectRatio={presentation.aspectRatio || '16:9'}
          onSlidesChange={handleSlidesChange}
          onThemeChange={handleThemeChange}
          onDownload={handleDownload}
          presentationTitle={presentation.title}
        />
      </main>

      {/* 키보드 단축키 힌트 (모바일에서는 숨김) */}
      <div className="hidden lg:block fixed bottom-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span><kbd className="kbd">Ctrl+S</kbd> 저장</span>
          <span><kbd className="kbd">Delete</kbd> 삭제</span>
          <span><kbd className="kbd">Ctrl+D</kbd> 복제</span>
        </div>
      </div>
    </div>
  );
}
