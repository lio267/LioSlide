'use client';

import { useState, useEffect } from 'react';
import { SlideData } from '../SlidePreview';
import EditableText from '../EditableText';
import EditableBullet from '../EditableBullet';

// 화면 비율별 aspect ratio CSS 값
const ASPECT_RATIO_CSS: Record<string, string> = {
  '16:9': '16/9',
  '4:3': '4/3',
  '16:10': '16/10',
  'A4': '794/1123',
};

interface SlideCanvasProps {
  slide: SlideData;
  themeColor: string;
  aspectRatio: string;
  isAnimating: boolean;
  onEditSlide: (slide: SlideData) => void;
}

export default function SlideCanvas({
  slide,
  themeColor,
  aspectRatio,
  isAnimating,
  onEditSlide,
}: SlideCanvasProps) {
  const [localSlide, setLocalSlide] = useState<SlideData>(slide);

  // 슬라이드 변경 시 로컬 상태 업데이트
  useEffect(() => {
    setLocalSlide(slide);
  }, [slide]);

  // 필드 업데이트 헬퍼
  const updateField = <K extends keyof SlideData>(field: K, value: SlideData[K]) => {
    const updated = { ...localSlide, [field]: value };
    setLocalSlide(updated);
    onEditSlide(updated);
  };

  const isFullColorBg = ['title', 'sectionTitle', 'closing', 'qna'].includes(slide.type);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-auto">
      {/* 캔버스 컨테이너 */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`
            w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden
            transition-all duration-300
            ${isAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
          `}
          style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || '16/9' }}
        >
          <div
            className="w-full h-full transition-colors duration-300"
            style={{
              backgroundColor: isFullColorBg ? `#${themeColor}` : '#ffffff',
            }}
          >
            {renderEditableContent(localSlide, themeColor, updateField, isFullColorBg)}
          </div>
        </div>
      </div>

      {/* 편집 힌트 */}
      <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        클릭하여 텍스트 편집 | ESC로 편집 종료 | Tab으로 다음 항목
      </div>
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
        <div className="w-full h-full flex flex-col items-center justify-center p-8 md:p-12 text-white">
          <EditableText
            value={slide.title}
            onChange={(v) => updateField('title', v)}
            as="h1"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-white"
            placeholder="제목을 입력하세요"
          />
          <EditableText
            value={slide.subtitle || ''}
            onChange={(v) => updateField('subtitle', v)}
            as="p"
            className="text-lg sm:text-xl md:text-2xl opacity-90 text-center text-white/90"
            placeholder="부제목을 입력하세요"
          />
        </div>
      );

    case 'closing':
    case 'qna':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 md:p-12 text-white">
          <div className="mb-6">
            <svg className="w-16 h-16 md:w-20 md:h-20 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {slide.type === 'qna' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              )}
            </svg>
          </div>
          <EditableText
            value={slide.title}
            onChange={(v) => updateField('title', v)}
            as="h1"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 text-white"
            placeholder="제목을 입력하세요"
          />
          <EditableText
            value={slide.keyMessage || ''}
            onChange={(v) => updateField('keyMessage', v)}
            as="p"
            className="text-base sm:text-lg md:text-xl opacity-85 text-center text-white/85 max-w-2xl"
            placeholder="메시지를 입력하세요"
          />
        </div>
      );

    case 'agenda':
      return (
        <div className="w-full h-full p-6 md:p-10 flex flex-col bg-white">
          <div
            className="pb-3 mb-6 border-b-4"
            style={{ borderColor: `#${themeColor}` }}
          >
            <EditableText
              value={slide.title}
              onChange={(v) => updateField('title', v)}
              as="h2"
              className="text-xl sm:text-2xl md:text-3xl font-bold"
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
        <div className="w-full h-full p-6 md:p-10 flex flex-col bg-white">
          <div
            className="pb-3 mb-6 border-b-4"
            style={{ borderColor: `#${themeColor}` }}
          >
            <EditableText
              value={slide.title}
              onChange={(v) => updateField('title', v)}
              as="h2"
              className="text-xl sm:text-2xl md:text-3xl font-bold"
              style={{ color: `#${themeColor}` }}
              placeholder="제목을 입력하세요"
            />
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-slate-50 dark:bg-slate-100 rounded-xl p-4 md:p-6">
              <div className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                {slide.type === 'comparison' ? '장점 / 찬성' : '왼쪽'}
              </div>
              <EditableBullet
                items={slide.leftContent || ['왼쪽 내용']}
                onChange={(items) => updateField('leftContent', items)}
                themeColor={themeColor}
              />
            </div>
            <div className="bg-slate-50 dark:bg-slate-100 rounded-xl p-4 md:p-6">
              <div className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                {slide.type === 'comparison' ? '단점 / 반대' : '오른쪽'}
              </div>
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
        <div className="w-full h-full p-6 md:p-10 flex flex-col bg-white">
          <div
            className="pb-3 mb-6 border-b-4"
            style={{ borderColor: `#${themeColor}` }}
          >
            <EditableText
              value={slide.title}
              onChange={(v) => updateField('title', v)}
              as="h2"
              className="text-xl sm:text-2xl md:text-3xl font-bold"
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
          {slide.footnote && (
            <div className="mt-auto pt-4 border-t border-slate-200">
              <EditableText
                value={slide.footnote}
                onChange={(v) => updateField('footnote', v)}
                as="p"
                className="text-xs text-slate-400"
                placeholder="각주"
              />
            </div>
          )}
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
    if (items.length >= 8) return;
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
    <div className="space-y-3 md:space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-4 group">
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold flex-shrink-0 shadow-md transition-transform group-hover:scale-110"
            style={{ backgroundColor: `#${themeColor}` }}
          >
            {String(idx + 1).padStart(2, '0')}
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
                className="w-full px-3 py-2 text-base md:text-lg rounded-lg bg-yellow-50 border-2 border-blue-500 outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleItemClick(idx)}
                className="text-slate-800 text-base md:text-lg cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-400 rounded-lg px-3 py-2 -mx-3 -my-2 transition-all block"
              >
                {item}
              </span>
            )}
          </div>
          {items.length > 1 && (
            <button
              onClick={() => handleDelete(idx)}
              className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {items.length < 8 && (
        <button
          onClick={handleAdd}
          className="flex items-center gap-3 text-sm md:text-base text-slate-400 hover:text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors ml-12 md:ml-14"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          섹션 추가
        </button>
      )}
    </div>
  );
}
