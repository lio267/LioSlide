'use client';

import { useState, useEffect, useRef } from 'react';
import { PresentationHistory } from '../lib/historyStore';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: PresentationHistory;
}

export default function ShareModal({ isOpen, onClose, presentation }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/viewer/${presentation.id}`
    : '';

  const shareTitle = presentation.title;
  const shareText = `${presentation.title} - AI로 생성된 프레젠테이션`;

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 프레젠테이션 데이터 내보내기 (JSON)
  const handleExportData = async () => {
    const exportData = {
      title: presentation.title,
      topic: presentation.topic,
      audience: presentation.audience,
      templateId: presentation.templateId,
      templateName: presentation.templateName,
      themeColor: presentation.themeColor,
      slidesData: presentation.slidesData,
      slideCount: presentation.slideCount,
      exportedAt: new Date().toISOString(),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // JSON 파일로 다운로드
  const handleDownloadJson = () => {
    const exportData = {
      title: presentation.title,
      topic: presentation.topic,
      audience: presentation.audience,
      templateId: presentation.templateId,
      templateName: presentation.templateName,
      themeColor: presentation.themeColor,
      slidesData: presentation.slidesData,
      slideCount: presentation.slideCount,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentation.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 소셜 미디어 공유
  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareKakao = () => {
    // 카카오톡 공유는 SDK가 필요하므로 링크 복사로 대체
    const url = `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  // Web Share API 사용 (모바일)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">공유하기</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {presentation.title}
          </p>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-6">
          {/* 링크 복사 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              링크 복사
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                {copied ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 소셜 미디어 공유 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              소셜 미디어로 공유
            </label>
            <div className="grid grid-cols-4 gap-3">
              {/* Twitter/X */}
              <button
                onClick={handleShareTwitter}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">X</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={handleShareLinkedIn}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="w-10 h-10 bg-[#0A66C2] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">LinkedIn</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">Facebook</span>
              </button>

              {/* KakaoStory */}
              <button
                onClick={handleShareKakao}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="w-10 h-10 bg-[#FEE500] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#3C1E1E]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3c-5.52 0-10 3.48-10 7.77 0 2.74 1.82 5.14 4.56 6.52-.2.75-.73 2.73-.84 3.15-.13.52.19.51.4.37.17-.11 2.66-1.81 3.74-2.54.7.1 1.42.15 2.14.15 5.52 0 10-3.48 10-7.77S17.52 3 12 3z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">카카오</span>
              </button>
            </div>
          </div>

          {/* 네이티브 공유 (모바일) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="font-medium text-slate-700 dark:text-slate-300">다른 앱으로 공유</span>
            </button>
          )}

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">또는</span>
            </div>
          </div>

          {/* 데이터 내보내기 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              프레젠테이션 데이터 내보내기
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              JSON 형식으로 프레젠테이션 데이터를 내보내 다른 기기에서 가져올 수 있습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleExportData}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  exportCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                {exportCopied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    복사됨
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    JSON 복사
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadJson}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                파일 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
