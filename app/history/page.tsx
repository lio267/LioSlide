'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHistory, deleteFromHistory, PresentationHistory } from '../lib/historyStore';
import ShareModal from '../components/ShareModal';

export default function HistoryPage() {
  const [presentations, setPresentations] = useState<PresentationHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sharePresentation, setSharePresentation] = useState<PresentationHistory | null>(null);

  useEffect(() => {
    const history = getHistory();
    setPresentations(history);
    setIsLoading(false);
  }, []);

  const filteredPresentations = searchQuery
    ? presentations.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.topic.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : presentations;

  const handleDelete = (id: string) => {
    if (deleteFromHistory(id)) {
      setPresentations(prev => prev.filter(p => p.id !== id));
    }
    setDeleteConfirm(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 최근 프레젠테이션 (가장 최근 것)
  const recentPresentation = presentations[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-9 h-9" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="lioSlideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
                <rect x="4" y="2" width="24" height="28" rx="4" className="fill-indigo-100 dark:fill-indigo-900/50"/>
                <path d="M10 8v16h12" stroke="url(#lioSlideGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-bold text-xl text-slate-900 dark:text-white">
                LioSlide
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                홈
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                만들기
              </Link>
              <span className="flex items-center gap-2 text-primary-600 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                히스토리
              </span>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 최근 프레젠테이션 배너 */}
        {recentPresentation && (
          <div className="mb-8 p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
            <div className="flex items-center gap-6">
              <div
                className="w-32 h-20 rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-md"
                style={{ backgroundColor: `#${recentPresentation.themeColor}` }}
              >
                {recentPresentation.title.substring(0, 10)}...
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">최근 작업</p>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {recentPresentation.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {recentPresentation.topic}
                </p>
              </div>
              <Link
                href={`/edit/${recentPresentation.id}`}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                이어서 편집
              </Link>
            </div>
          </div>
        )}

        {/* 제목 및 새로 만들기 버튼 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              내 프리젠테이션
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {presentations.length}개의 프리젠테이션을 만들었어요
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새로 만들기
          </Link>
        </div>

        {/* 검색바 */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="프리젠테이션 검색해요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* 로딩 */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">로딩 중...</p>
          </div>
        ) : filteredPresentations.length === 0 ? (
          /* 빈 상태 */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
              {searchQuery ? '검색 결과가 없어요' : '아직 프리젠테이션이 없어요'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery ? '다른 검색어로 시도해보세요' : '첫 번째 프리젠테이션을 만들어보세요!'}
            </p>
            {!searchQuery && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                프리젠테이션 만들기
              </Link>
            )}
          </div>
        ) : (
          /* 프레젠테이션 그리드 */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPresentations.map((presentation) => (
              <div
                key={presentation.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* 썸네일 */}
                <div
                  className="h-40 flex items-center justify-center"
                  style={{ backgroundColor: `#${presentation.themeColor}` }}
                >
                  <div className="text-center text-white px-6">
                    <h3 className="text-xl font-bold mb-1">{presentation.title}</h3>
                    <p className="text-sm opacity-80">{presentation.topic}</p>
                  </div>
                </div>

                {/* 정보 */}
                <div className="p-5">
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                    {presentation.title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {presentation.slideCount}슬라이드
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(presentation.createdAt)}
                    </span>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/viewer/${presentation.id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      보기
                    </Link>
                    <Link
                      href={`/edit/${presentation.id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      편집
                    </Link>
                    <button
                      onClick={() => setSharePresentation(presentation)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      공유
                    </button>
                    {deleteConfirm === presentation.id ? (
                      <button
                        onClick={() => handleDelete(presentation.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        삭제 확인
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(presentation.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 공유 모달 */}
      {sharePresentation && (
        <ShareModal
          isOpen={!!sharePresentation}
          onClose={() => setSharePresentation(null)}
          presentation={sharePresentation}
        />
      )}
    </div>
  );
}
