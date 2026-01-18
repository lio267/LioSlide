'use client';

import { useState, useRef, useCallback } from 'react';
import { SlideData } from '../SlidePreview';

// 화면 비율별 aspect ratio CSS 값
const ASPECT_RATIO_CSS: Record<string, string> = {
  '16:9': '16/9',
  '4:3': '4/3',
  '16:10': '16/10',
  'A4': '794/1123',
};

interface ThumbnailPanelProps {
  slides: SlideData[];
  selectedIndex: number;
  themeColor: string;
  aspectRatio: string;
  onSelectSlide: (index: number) => void;
  onReorderSlides: (fromIndex: number, toIndex: number) => void;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
  onAddSlide: () => void;
}

export default function ThumbnailPanel({
  slides,
  selectedIndex,
  themeColor,
  aspectRatio,
  onSelectSlide,
  onReorderSlides,
  onContextMenu,
  onAddSlide,
}: ThumbnailPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));

    // 드래그 이미지 설정 (투명하게)
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  // 드래그 중
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorderSlides(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  }, [draggedIndex, dragOverIndex, onReorderSlides]);

  // 드롭
  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderSlides(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  }, [draggedIndex, onReorderSlides]);

  return (
    <div className="w-44 lg:w-52 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* 헤더 */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            슬라이드
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {slides.length}개
          </span>
        </div>
      </div>

      {/* 썸네일 리스트 */}
      <div
        ref={thumbnailsRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
            onContextMenu={(e) => onContextMenu(e, index)}
            className={`
              group relative cursor-pointer transition-all duration-200
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${dragOverIndex === index && draggedIndex !== index ? 'translate-y-2' : ''}
            `}
          >
            {/* 드롭 인디케이터 - 상단 */}
            {dragOverIndex === index && draggedIndex !== null && draggedIndex > index && (
              <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary-500 rounded-full z-10 animate-pulse" />
            )}

            <button
              onClick={() => onSelectSlide(index)}
              className={`
                w-full rounded-lg overflow-hidden transition-all duration-200
                border-2 hover:shadow-md
                ${selectedIndex === index
                  ? 'border-primary-500 ring-2 ring-primary-500/30 shadow-lg'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }
              `}
              style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || '16/9' }}
            >
              <ThumbnailContent slide={slide} themeColor={themeColor} />
            </button>

            {/* 슬라이드 번호 배지 */}
            <div className={`
              absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm
              transition-all duration-200
              ${selectedIndex === index
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }
            `}>
              {index + 1}
            </div>

            {/* 호버 액션 버튼 */}
            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* 드래그 핸들 */}
              <div className="p-1 bg-white dark:bg-slate-700 rounded shadow-sm cursor-grab active:cursor-grabbing">
                <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                </svg>
              </div>
            </div>

            {/* 드롭 인디케이터 - 하단 */}
            {dragOverIndex === index && draggedIndex !== null && draggedIndex < index && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-500 rounded-full z-10 animate-pulse" />
            )}
          </div>
        ))}

        {/* 슬라이드 추가 버튼 */}
        <button
          onClick={onAddSlide}
          className="
            w-full rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600
            hover:border-primary-500 dark:hover:border-primary-500
            hover:bg-primary-50 dark:hover:bg-primary-900/20
            transition-all duration-200
            flex items-center justify-center gap-2
            text-slate-400 hover:text-primary-600 dark:hover:text-primary-400
          "
          style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || '16/9' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-medium hidden lg:inline">추가</span>
        </button>
      </div>

      {/* 힌트 */}
      <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 text-center">
        드래그로 순서 변경
      </div>
    </div>
  );
}

// 썸네일 콘텐츠
function ThumbnailContent({ slide, themeColor }: { slide: SlideData; themeColor: string }) {
  const isFullColorBg = ['title', 'sectionTitle', 'closing', 'qna'].includes(slide.type);

  return (
    <div
      className="w-full h-full p-2 flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: isFullColorBg ? `#${themeColor}` : '#ffffff',
      }}
    >
      {isFullColorBg ? (
        // 전체 배경색 슬라이드
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-3/4 h-1.5 rounded-full bg-white/80 mb-1" />
          <div className="w-1/2 h-1 rounded-full bg-white/50" />
        </div>
      ) : (
        // 일반 콘텐츠 슬라이드
        <>
          {/* 제목 영역 */}
          <div
            className="h-1.5 rounded-full mb-2"
            style={{ backgroundColor: `#${themeColor}`, width: '70%' }}
          />
          {/* 콘텐츠 영역 */}
          <div className="flex-1 space-y-1">
            {slide.type === 'twoColumn' || slide.type === 'comparison' ? (
              // 2단 레이아웃
              <div className="flex gap-1 h-full">
                <div className="flex-1 bg-slate-100 dark:bg-slate-600 rounded p-1 space-y-0.5">
                  <div className="h-0.5 bg-slate-300 dark:bg-slate-500 rounded-full w-full" />
                  <div className="h-0.5 bg-slate-200 dark:bg-slate-400 rounded-full w-4/5" />
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-600 rounded p-1 space-y-0.5">
                  <div className="h-0.5 bg-slate-300 dark:bg-slate-500 rounded-full w-full" />
                  <div className="h-0.5 bg-slate-200 dark:bg-slate-400 rounded-full w-4/5" />
                </div>
              </div>
            ) : slide.type === 'agenda' ? (
              // 목차
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `#${themeColor}` }}
                    />
                    <div className="h-0.5 bg-slate-200 dark:bg-slate-400 rounded-full flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              // 일반 불릿 콘텐츠
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <div
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `#${themeColor}` }}
                  />
                  <div className="h-0.5 bg-slate-300 dark:bg-slate-500 rounded-full flex-1" />
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `#${themeColor}` }}
                  />
                  <div className="h-0.5 bg-slate-200 dark:bg-slate-400 rounded-full w-4/5" />
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `#${themeColor}` }}
                  />
                  <div className="h-0.5 bg-slate-200 dark:bg-slate-400 rounded-full w-3/5" />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 슬라이드 타입 라벨 */}
      <div className={`
        text-center text-[8px] font-medium mt-1 truncate
        ${isFullColorBg ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}
      `}>
        {getSlideTypeLabel(slide.type)}
      </div>
    </div>
  );
}

// 슬라이드 타입 라벨
function getSlideTypeLabel(type: SlideData['type']): string {
  const labels: Record<SlideData['type'], string> = {
    title: '표지',
    sectionTitle: '섹션',
    content: '콘텐츠',
    twoColumn: '2단',
    agenda: '목차',
    chart: '차트',
    comparison: '비교',
    closing: '마무리',
    qna: 'Q&A',
    summary: '요약',
  };
  return labels[type] || type;
}
