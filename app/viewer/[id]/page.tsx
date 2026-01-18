'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPresentation, updateHistory, PresentationHistory } from '../../lib/historyStore';
import { SlideData } from '../../components/SlidePreview';
import ShareModal from '../../components/ShareModal';

// 화면 비율별 aspect ratio CSS 값
const ASPECT_RATIO_CSS: Record<string, string> = {
  '16:9': '16/9',
  '4:3': '4/3',
  '16:10': '16/10',
  'A4': '794/1123', // A4 세로 비율
};

export default function ViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [presentation, setPresentation] = useState<PresentationHistory | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const pres = getPresentation(id);
    if (pres) {
      setPresentation(pres);
    }
    setIsLoading(false);
  }, [params.id]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentation) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex < presentation.slidesData.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          router.push('/history');
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation, currentIndex, isFullscreen, router]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">프레젠테이션을 찾을 수 없습니다</h1>
        <Link href="/history" className="text-primary-400 hover:text-primary-300">
          히스토리로 돌아가기
        </Link>
      </div>
    );
  }

  const currentSlide = presentation.slidesData[currentIndex];

  return (
    <div className={`min-h-screen bg-slate-900 flex flex-col ${isFullscreen ? 'cursor-none' : ''}`}>
      {/* 상단 바 */}
      {!isFullscreen && (
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/history"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                뒤로
              </Link>
              <span className="text-slate-400">|</span>
              <span className="text-white font-medium">{presentation.title}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{currentIndex + 1}</span>
              <span>/</span>
              <span>{presentation.slidesData.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* TODO: 저장 */}}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                저장됨
              </button>
              <button
                onClick={() => {/* TODO: 다운로드 */}}
                className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                다운로드
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                공유
              </button>
              <Link
                href={`/edit/${presentation.id}`}
                className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                편집
              </Link>
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <Link
                href="/history"
                className="px-3 py-1.5 text-red-400 text-sm hover:text-red-300 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                닫기
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* 슬라이드 뷰어 */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div
          className="w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: getSlideBackground(currentSlide, presentation.themeColor),
            aspectRatio: ASPECT_RATIO_CSS[presentation.aspectRatio || '16:9'] || '16/9',
          }}
        >
          <SlideContent slide={currentSlide} themeColor={presentation.themeColor} />
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <footer className="bg-slate-800 border-t border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전 페이지
          </button>

          <div className="text-center text-slate-400 text-sm">
            {presentation.title}
          </div>

          <button
            onClick={() => currentIndex < presentation.slidesData.length - 1 && setCurrentIndex(prev => prev + 1)}
            disabled={currentIndex === presentation.slidesData.length - 1}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            다음 페이지
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>

      {/* 풀스크린 힌트 */}
      {isFullscreen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity">
          ESC: 나가기 | ←→: 이동 | F: 전체화면
        </div>
      )}

      {/* 공유 모달 */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        presentation={presentation}
      />
    </div>
  );
}

// 슬라이드 배경색 계산
function getSlideBackground(slide: SlideData, themeColor: string): string {
  const isFullColorBg = ['title', 'sectionTitle', 'closing', 'qna'].includes(slide.type);
  return isFullColorBg ? `#${themeColor}` : '#ffffff';
}

// 슬라이드 콘텐츠 렌더링
function SlideContent({ slide, themeColor }: { slide: SlideData; themeColor: string }) {
  const isFullColorBg = ['title', 'sectionTitle', 'closing', 'qna'].includes(slide.type);

  if (isFullColorBg) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12 text-white">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">{slide.title}</h1>
        {slide.subtitle && (
          <p className="text-xl md:text-2xl opacity-90 text-center">{slide.subtitle}</p>
        )}
        {slide.keyMessage && (
          <p className="text-lg opacity-80 text-center mt-4">{slide.keyMessage}</p>
        )}
      </div>
    );
  }

  // 일반 콘텐츠 슬라이드
  return (
    <div className="w-full h-full p-10 flex flex-col">
      <div
        className="pb-3 mb-6 border-b-4"
        style={{ borderColor: `#${themeColor}` }}
      >
        <h2
          className="text-3xl font-bold"
          style={{ color: `#${themeColor}` }}
        >
          {slide.title}
        </h2>
      </div>

      {slide.type === 'agenda' && slide.bullets && (
        <div className="space-y-4">
          {slide.bullets.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: `#${themeColor}` }}
              >
                {String(idx + 1).padStart(2, '0')}
              </div>
              <span className="text-xl text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      )}

      {(slide.type === 'twoColumn' || slide.type === 'comparison') && (
        <div className="flex-1 grid grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-lg p-6">
            {slide.leftContent?.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: `#${themeColor}` }}
                />
                <span className="text-lg text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-lg p-6">
            {slide.rightContent?.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: `#${themeColor}` }}
                />
                <span className="text-lg text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(slide.type === 'content' || slide.type === 'summary') && slide.bullets && (
        <div className="space-y-4">
          {slide.bullets.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div
                className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: `#${themeColor}` }}
              />
              <span className="text-xl text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
