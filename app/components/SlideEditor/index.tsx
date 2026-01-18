'use client';

import { useState, useCallback, useEffect } from 'react';
import { SlideData } from '../SlidePreview';
import SlideToolbar from './SlideToolbar';
import ThumbnailPanel from './ThumbnailPanel';
import SlideCanvas from './SlideCanvas';
import ActionBar from './ActionBar';
import ThemeSelector from './ThemeSelector';
import LayoutSelector from './LayoutSelector';
import ContextMenu from './ContextMenu';

// 테마 옵션
export const THEME_OPTIONS = [
  { id: 'corporate-blue', name: '비즈니스 블루', color: '1791e8' },
  { id: 'dark-professional', name: '다크 프로페셔널', color: '1e293b' },
  { id: 'minimal-white', name: '미니멀 화이트', color: '64748b' },
  { id: 'creative-yellow', name: '크리에이티브 옐로우', color: 'f59e0b' },
  { id: 'soft-gradient', name: '소프트 그라디언트', color: 'a855f7' },
  { id: 'modern-teal', name: '모던 틸', color: '14b8a6' },
  { id: 'toss-blue', name: '토스 블루', color: '3182f6' },
  { id: 'supabase-green', name: '수파베이스 그린', color: '3ecf8e' },
  { id: 'claude-coral', name: '클로드 코랄', color: 'd97757' },
];

// 레이아웃 옵션
export const LAYOUT_OPTIONS: { value: SlideData['type']; label: string; icon: string }[] = [
  { value: 'title', label: '표지', icon: 'M4 5h16v14H4z' },
  { value: 'sectionTitle', label: '섹션 제목', icon: 'M4 9h16M4 15h16' },
  { value: 'content', label: '콘텐츠', icon: 'M4 6h16M4 10h10M4 14h12M4 18h8' },
  { value: 'twoColumn', label: '2단 레이아웃', icon: 'M4 4h6v16H4zM14 4h6v16h-6z' },
  { value: 'agenda', label: '목차', icon: 'M4 6h2M8 6h12M4 12h2M8 12h12M4 18h2M8 18h12' },
  { value: 'comparison', label: '비교', icon: 'M12 4v16M4 4h6v16H4zM14 4h6v16h-6z' },
  { value: 'summary', label: '요약', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' },
  { value: 'closing', label: '마무리', icon: 'M5 13l4 4L19 7' },
  { value: 'qna', label: 'Q&A', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01' },
];

interface SlideEditorProps {
  slides: SlideData[];
  themeColor: string;
  aspectRatio?: string;
  onSlidesChange: (slides: SlideData[]) => void;
  onThemeChange: (themeColor: string) => void;
  onDownload?: () => void;
  presentationTitle?: string;
}

export default function SlideEditor({
  slides,
  themeColor,
  aspectRatio = '16:9',
  onSlidesChange,
  onThemeChange,
  onDownload,
  presentationTitle = '프레젠테이션',
}: SlideEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideIndex: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 선택된 슬라이드가 범위를 벗어나면 조정
  useEffect(() => {
    if (selectedIndex >= slides.length && slides.length > 0) {
      setSelectedIndex(slides.length - 1);
    }
  }, [slides.length, selectedIndex]);

  // 슬라이드 선택
  const handleSelectSlide = useCallback((index: number) => {
    setIsAnimating(true);
    setSelectedIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  // 슬라이드 편집
  const handleEditSlide = useCallback((index: number, updatedSlide: SlideData) => {
    const newSlides = [...slides];
    newSlides[index] = updatedSlide;
    onSlidesChange(newSlides);
  }, [slides, onSlidesChange]);

  // 슬라이드 추가
  const handleAddSlide = useCallback((afterIndex: number, type: SlideData['type']) => {
    const newSlide: SlideData = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: getDefaultTitle(type),
      subtitle: type === 'title' || type === 'sectionTitle' ? '부제목을 입력하세요' : undefined,
      bullets: ['content', 'summary', 'agenda'].includes(type) ? ['새 항목을 입력하세요'] : undefined,
      leftContent: ['twoColumn', 'comparison'].includes(type) ? ['왼쪽 내용'] : undefined,
      rightContent: ['twoColumn', 'comparison'].includes(type) ? ['오른쪽 내용'] : undefined,
      keyMessage: ['closing', 'qna'].includes(type) ? '메시지를 입력하세요' : undefined,
    };

    const newSlides = [...slides];
    newSlides.splice(afterIndex + 1, 0, newSlide);
    onSlidesChange(newSlides);
    setSelectedIndex(afterIndex + 1);
  }, [slides, onSlidesChange]);

  // 슬라이드 삭제
  const handleDeleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) return;

    const newSlides = slides.filter((_, i) => i !== index);
    onSlidesChange(newSlides);

    if (selectedIndex >= newSlides.length) {
      setSelectedIndex(newSlides.length - 1);
    } else if (selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [slides, selectedIndex, onSlidesChange]);

  // 슬라이드 복제
  const handleDuplicateSlide = useCallback((index: number) => {
    const slideToClone = slides[index];
    const clonedSlide: SlideData = {
      ...slideToClone,
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, clonedSlide);
    onSlidesChange(newSlides);
    setSelectedIndex(index + 1);
  }, [slides, onSlidesChange]);

  // 슬라이드 순서 변경
  const handleReorderSlides = useCallback((fromIndex: number, toIndex: number) => {
    const newSlides = [...slides];
    const [removed] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, removed);
    onSlidesChange(newSlides);
    setSelectedIndex(toIndex);
  }, [slides, onSlidesChange]);

  // 슬라이드 위로 이동
  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    handleReorderSlides(index, index - 1);
  }, [handleReorderSlides]);

  // 슬라이드 아래로 이동
  const handleMoveDown = useCallback((index: number) => {
    if (index >= slides.length - 1) return;
    handleReorderSlides(index, index + 1);
  }, [slides.length, handleReorderSlides]);

  // 레이아웃 변경
  const handleLayoutChange = useCallback((index: number, newType: SlideData['type']) => {
    const slide = slides[index];
    const updatedSlide: SlideData = {
      ...slide,
      type: newType,
      subtitle: newType === 'title' || newType === 'sectionTitle' ? slide.subtitle || '' : undefined,
      bullets: ['content', 'summary', 'agenda'].includes(newType) ? slide.bullets || ['새 항목'] : undefined,
      leftContent: ['twoColumn', 'comparison'].includes(newType) ? slide.leftContent || ['왼쪽 내용'] : undefined,
      rightContent: ['twoColumn', 'comparison'].includes(newType) ? slide.rightContent || ['오른쪽 내용'] : undefined,
      keyMessage: ['closing', 'qna'].includes(newType) ? slide.keyMessage || '' : undefined,
    };
    handleEditSlide(index, updatedSlide);
  }, [slides, handleEditSlide]);

  // 슬라이드별 테마 변경 (전체 테마 변경)
  const handleSlideThemeChange = useCallback((newThemeColor: string) => {
    onThemeChange(newThemeColor);
  }, [onThemeChange]);

  // 컨텍스트 메뉴
  const handleContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, slideIndex: index });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 컨텍스트 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu, closeContextMenu]);

  const selectedSlide = slides[selectedIndex];

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900">
      {/* 상단 툴바 */}
      <SlideToolbar
        currentIndex={selectedIndex}
        totalSlides={slides.length}
        currentSlide={selectedSlide}
        themeColor={themeColor}
        onPrevSlide={() => selectedIndex > 0 && handleSelectSlide(selectedIndex - 1)}
        onNextSlide={() => selectedIndex < slides.length - 1 && handleSelectSlide(selectedIndex + 1)}
        onThemeChange={handleSlideThemeChange}
        onLayoutChange={(type) => handleLayoutChange(selectedIndex, type)}
        onDuplicate={() => handleDuplicateSlide(selectedIndex)}
        onDelete={() => handleDeleteSlide(selectedIndex)}
        onMoveUp={() => handleMoveUp(selectedIndex)}
        onMoveDown={() => handleMoveDown(selectedIndex)}
        canDelete={slides.length > 1}
        canMoveUp={selectedIndex > 0}
        canMoveDown={selectedIndex < slides.length - 1}
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 썸네일 패널 */}
        <ThumbnailPanel
          slides={slides}
          selectedIndex={selectedIndex}
          themeColor={themeColor}
          aspectRatio={aspectRatio}
          onSelectSlide={handleSelectSlide}
          onReorderSlides={handleReorderSlides}
          onContextMenu={handleContextMenu}
          onAddSlide={() => handleAddSlide(slides.length - 1, 'content')}
        />

        {/* 중앙 슬라이드 캔버스 */}
        <SlideCanvas
          slide={selectedSlide}
          themeColor={themeColor}
          aspectRatio={aspectRatio}
          isAnimating={isAnimating}
          onEditSlide={(slide) => handleEditSlide(selectedIndex, slide)}
        />
      </div>

      {/* 하단 액션 바 */}
      <ActionBar
        onAddSlide={() => handleAddSlide(selectedIndex, 'content')}
        onChangeAllTheme={handleSlideThemeChange}
        onDownload={onDownload}
        currentTheme={themeColor}
        slideCount={slides.length}
        presentationTitle={presentationTitle}
      />

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDuplicate={() => {
            handleDuplicateSlide(contextMenu.slideIndex);
            closeContextMenu();
          }}
          onDelete={() => {
            handleDeleteSlide(contextMenu.slideIndex);
            closeContextMenu();
          }}
          onMoveUp={() => {
            handleMoveUp(contextMenu.slideIndex);
            closeContextMenu();
          }}
          onMoveDown={() => {
            handleMoveDown(contextMenu.slideIndex);
            closeContextMenu();
          }}
          onChangeLayout={(type) => {
            handleLayoutChange(contextMenu.slideIndex, type);
            closeContextMenu();
          }}
          canDelete={slides.length > 1}
          canMoveUp={contextMenu.slideIndex > 0}
          canMoveDown={contextMenu.slideIndex < slides.length - 1}
        />
      )}
    </div>
  );
}

// 슬라이드 타입별 기본 제목
function getDefaultTitle(type: SlideData['type']): string {
  const titles: Record<SlideData['type'], string> = {
    title: '프레젠테이션 제목',
    sectionTitle: '섹션 제목',
    content: '슬라이드 제목',
    twoColumn: '비교 제목',
    agenda: '목차',
    chart: '차트 제목',
    comparison: '비교 분석',
    closing: '감사합니다',
    qna: 'Q&A',
    summary: '요약',
  };
  return titles[type] || '새 슬라이드';
}
