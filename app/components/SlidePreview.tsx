'use client';

import { useState, useEffect, useRef } from 'react';
import EditableText from './EditableText';
import EditableBullet from './EditableBullet';

// 슬라이드 데이터 타입
export interface SlideData {
  id: string;
  type: 'title' | 'sectionTitle' | 'content' | 'twoColumn' | 'agenda' | 'chart' | 'comparison' | 'closing' | 'qna' | 'summary';
  title: string;
  subtitle?: string;
  bullets?: string[];
  keyMessage?: string;
  leftContent?: string[];
  rightContent?: string[];
  footnote?: string;
}

// 슬라이드 타입 옵션
const SLIDE_TYPE_OPTIONS: { value: SlideData['type']; label: string; description: string }[] = [
  { value: 'content', label: '콘텐츠', description: '기본 불릿 포인트' },
  { value: 'title', label: '표지', description: '제목 슬라이드' },
  { value: 'sectionTitle', label: '섹션 제목', description: '섹션 구분' },
  { value: 'twoColumn', label: '2단 레이아웃', description: '좌우 비교' },
  { value: 'agenda', label: '목차', description: '번호 리스트' },
  { value: 'comparison', label: '비교', description: '장단점 비교' },
  { value: 'summary', label: '요약', description: '핵심 정리' },
  { value: 'closing', label: '마무리', description: '감사 인사' },
  { value: 'qna', label: 'Q&A', description: '질의응답' },
];

// 화면 비율별 aspect ratio CSS 값
const ASPECT_RATIO_CSS: Record<string, string> = {
  '16:9': '16/9',
  '4:3': '4/3',
  '16:10': '16/10',
  'A4': '794/1123', // A4 세로 비율
};

interface SlidePreviewProps {
  slides: SlideData[];
  selectedIndex: number;
  onSelectSlide: (index: number) => void;
  onEditSlide?: (index: number, slide: SlideData) => void;
  onAddSlide?: (afterIndex: number, slideType: SlideData['type']) => void;
  onDeleteSlide?: (index: number) => void;
  onReorderSlides?: (fromIndex: number, toIndex: number) => void;
  themeColor?: string;
  aspectRatio?: string;
}

export default function SlidePreview({
  slides,
  selectedIndex,
  onSelectSlide,
  onEditSlide,
  onAddSlide,
  onDeleteSlide,
  onReorderSlides,
  themeColor = '1791e8',
  aspectRatio = '16:9',
}: SlidePreviewProps) {
  const selectedSlide = slides[selectedIndex];
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAfterIndex, setAddAfterIndex] = useState(-1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 슬라이드 추가 핸들러
  const handleAddClick = (afterIndex: number) => {
    setAddAfterIndex(afterIndex);
    setShowAddModal(true);
  };

  const handleAddSlide = (type: SlideData['type']) => {
    onAddSlide?.(addAfterIndex, type);
    setShowAddModal(false);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onReorderSlides?.(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && selectedIndex > 0) {
      onSelectSlide(selectedIndex - 1);
    } else if (e.key === 'ArrowDown' && selectedIndex < slides.length - 1) {
      onSelectSlide(selectedIndex + 1);
    } else if (e.key === 'Delete' && slides.length > 1) {
      onDeleteSlide?.(selectedIndex);
    }
  };

  return (
    <div className="flex gap-4 h-full" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* 왼쪽: 썸네일 리스트 */}
      <div className="w-36 flex-shrink-0 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`group relative ${
              dragOverIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
            draggable={!!onReorderSlides}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <button
              onClick={() => onSelectSlide(index)}
              className={`w-full rounded-lg border-2 transition-all overflow-hidden ${
                selectedIndex === index
                  ? 'border-primary-500 ring-2 ring-primary-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
              style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || '16/9' }}
            >
              <SlideThumbnail slide={slide} themeColor={themeColor} index={index} />
            </button>

            {/* 삭제 버튼 */}
            {onDeleteSlide && slides.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSlide(index);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:bg-red-600"
                title="슬라이드 삭제"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* 드래그 핸들 */}
            {onReorderSlides && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* 슬라이드 추가 버튼 */}
        {onAddSlide && (
          <button
            onClick={() => handleAddClick(slides.length - 1)}
            className="w-full rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors flex items-center justify-center text-slate-400 hover:text-primary-500"
            style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || '16/9' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* 오른쪽: 선택된 슬라이드 미리보기 */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* 이전/다음 네비게이션 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => selectedIndex > 0 && onSelectSlide(selectedIndex - 1)}
                disabled={selectedIndex === 0}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[80px] text-center">
                {selectedIndex + 1} / {slides.length}
              </span>
              <button
                onClick={() => selectedIndex < slides.length - 1 && onSelectSlide(selectedIndex + 1)}
                disabled={selectedIndex === slides.length - 1}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 슬라이드 타입 표시 */}
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
              {SLIDE_TYPE_OPTIONS.find(t => t.value === selectedSlide?.type)?.label || selectedSlide?.type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 현재 슬라이드 다음에 추가 */}
            {onAddSlide && (
              <button
                onClick={() => handleAddClick(selectedIndex)}
                className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                슬라이드 추가
              </button>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              클릭하여 편집
            </span>
          </div>
        </div>

        <div className="flex-1 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
          <EditableSlideView
            slide={selectedSlide}
            themeColor={themeColor}
            aspectRatio={aspectRatio}
            onUpdate={onEditSlide ? (slide) => onEditSlide(selectedIndex, slide) : undefined}
          />
        </div>
      </div>

      {/* 슬라이드 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
              슬라이드 추가
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SLIDE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAddSlide(option.value)}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left"
                >
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{option.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{option.description}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 썸네일 컴포넌트
function SlideThumbnail({
  slide,
  themeColor,
  index,
}: {
  slide: SlideData;
  themeColor: string;
  index: number;
}) {
  const isFullColorBg = ['title', 'sectionTitle', 'closing', 'qna'].includes(slide.type);

  return (
    <div
      className="w-full h-full p-1.5 flex flex-col"
      style={{
        backgroundColor: isFullColorBg ? `#${themeColor}` : '#ffffff',
      }}
    >
      {isFullColorBg ? (
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-3/4 h-1.5 rounded-full bg-white/80"
            style={{ maxWidth: '60px' }}
          />
        </div>
      ) : (
        <>
          <div
            className="h-1 rounded-full mb-1"
            style={{ backgroundColor: `#${themeColor}`, width: '60%' }}
          />
          <div className="flex-1 space-y-0.5">
            <div className="h-0.5 bg-slate-300 rounded-full w-full" />
            <div className="h-0.5 bg-slate-200 rounded-full w-4/5" />
            <div className="h-0.5 bg-slate-200 rounded-full w-3/5" />
          </div>
        </>
      )}
      <div className="text-[8px] text-center mt-1 text-slate-400 font-medium">
        {index + 1}
      </div>
    </div>
  );
}

// 인라인 편집 가능한 슬라이드 뷰
function EditableSlideView({
  slide,
  themeColor,
  aspectRatio = '16:9',
  onUpdate,
}: {
  slide: SlideData;
  themeColor: string;
  aspectRatio?: string;
  onUpdate?: (slide: SlideData) => void;
}) {
  const [localSlide, setLocalSlide] = useState<SlideData>(slide);

  // 슬라이드가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalSlide(slide);
  }, [slide]);

  // 필드 업데이트 헬퍼
  const updateField = <K extends keyof SlideData>(field: K, value: SlideData[K]) => {
    const updated = { ...localSlide, [field]: value };
    setLocalSlide(updated);
    onUpdate?.(updated);
  };

  const isFullColorBg = ['title', 'sectionTitle', 'closing', 'qna'].includes(slide.type);

  return (
    <div
      className="w-full h-full"
      style={{
        backgroundColor: isFullColorBg ? `#${themeColor}` : '#ffffff',
        aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || '16/9',
      }}
    >
      {renderEditableContent(localSlide, themeColor, updateField, isFullColorBg)}
    </div>
  );
}

// 편집 가능한 슬라이드 콘텐츠 렌더링
function renderEditableContent(
  slide: SlideData,
  themeColor: string,
  updateField: <K extends keyof SlideData>(field: K, value: SlideData[K]) => void,
  isFullColorBg: boolean
) {
  switch (slide.type) {
    case 'title':
    case 'sectionTitle':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white">
          <EditableText
            value={slide.title}
            onChange={(v) => updateField('title', v)}
            as="h1"
            className="text-2xl md:text-3xl font-bold text-center mb-3 text-white"
            placeholder="제목을 입력하세요"
          />
          <EditableText
            value={slide.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            as="p"
            className="text-lg opacity-90 text-center text-white/90"
            placeholder="부제목을 입력하세요"
          />
        </div>
      );

    case 'closing':
    case 'qna':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white">
          <EditableText
            value={slide.title}
            onChange={(v) => updateField('title', v)}
            as="h1"
            className="text-2xl md:text-3xl font-bold text-center mb-3 text-white"
            placeholder="제목을 입력하세요"
          />
          <EditableText
            value={slide.keyMessage || ''}
            onChange={(v) => updateField('keyMessage', v)}
            as="p"
            className="text-base opacity-85 text-center text-white/85"
            placeholder="메시지를 입력하세요"
          />
        </div>
      );

    case 'agenda':
      return (
        <div className="w-full h-full p-6 flex flex-col bg-white">
          <div
            className="pb-2 mb-4 border-b-2"
            style={{ borderColor: `#${themeColor}` }}
          >
            <EditableText
              value={slide.title}
              onChange={(v) => updateField('title', v)}
              as="h2"
              className="text-xl font-semibold"
              style={{ color: `#${themeColor}` }}
              placeholder="목차 제목"
            />
          </div>
          <div className="flex-1">
            <EditableAgendaList
              items={slide.bullets || []}
              onChange={(items) => updateField('bullets', items)}
              themeColor={themeColor}
            />
          </div>
        </div>
      );

    case 'twoColumn':
    case 'comparison':
      return (
        <div className="w-full h-full p-6 flex flex-col bg-white">
          <div
            className="pb-2 mb-4 border-b-2"
            style={{ borderColor: `#${themeColor}` }}
          >
            <EditableText
              value={slide.title}
              onChange={(v) => updateField('title', v)}
              as="h2"
              className="text-xl font-semibold"
              style={{ color: `#${themeColor}` }}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <EditableBullet
                items={slide.leftContent || ['왼쪽 내용']}
                onChange={(items) => updateField('leftContent', items)}
                themeColor={themeColor}
              />
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <EditableBullet
                items={slide.rightContent || ['오른쪽 내용']}
                onChange={(items) => updateField('rightContent', items)}
                themeColor={themeColor}
              />
            </div>
          </div>
        </div>
      );

    case 'content':
    case 'summary':
    default:
      return (
        <div className="w-full h-full p-6 flex flex-col bg-white">
          <div
            className="pb-2 mb-4 border-b-2"
            style={{ borderColor: `#${themeColor}` }}
          >
            <EditableText
              value={slide.title}
              onChange={(v) => updateField('title', v)}
              as="h2"
              className="text-xl font-semibold"
              style={{ color: `#${themeColor}` }}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div className="flex-1">
            <EditableBullet
              items={slide.bullets || ['내용을 입력하세요']}
              onChange={(items) => updateField('bullets', items)}
              themeColor={themeColor}
            />
          </div>
        </div>
      );
  }
}

// 목차용 편집 가능한 리스트 (번호 표시)
function EditableAgendaList({
  items,
  onChange,
  themeColor,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  themeColor: string;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleItemClick = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const handleSave = () => {
    if (editingIndex === null) return;

    const newItems = [...items];
    const trimmedValue = editValue.trim();

    if (trimmedValue) {
      newItems[editingIndex] = trimmedValue;
    } else {
      newItems.splice(editingIndex, 1);
    }

    onChange(newItems);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (items.length >= 7) return;
    onChange([...items, '새 섹션']);
    setTimeout(() => handleItemClick(items.length), 50);
  };

  const handleDelete = (index: number) => {
    if (items.length <= 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3 group">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: `#${themeColor}` }}
          >
            {idx + 1}
          </div>
          <div className="flex-1">
            {editingIndex === idx ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setEditingIndex(null);
                }}
                className="w-full px-2 py-1 text-sm rounded bg-yellow-50 border-2 border-blue-500 outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleItemClick(idx)}
                className="text-slate-800 text-sm cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-400 rounded px-2 py-1 -mx-2 -my-1 transition-all block"
              >
                {item}
              </span>
            )}
          </div>
          {items.length > 1 && (
            <button
              onClick={() => handleDelete(idx)}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-100 rounded transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {items.length < 7 && (
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 py-1 px-2 rounded hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          섹션 추가
        </button>
      )}
    </div>
  );
}
