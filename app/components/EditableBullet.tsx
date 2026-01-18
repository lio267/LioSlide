'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface EditableBulletProps {
  items: string[];
  onChange: (items: string[]) => void;
  themeColor?: string;
  maxItems?: number;
}

export default function EditableBullet({
  items,
  onChange,
  themeColor = '1791e8',
  maxItems = 7,
}: EditableBulletProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleItemClick = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index] || '');
  };

  const handleSave = () => {
    if (editingIndex === null) return;

    const newItems = [...items];
    const trimmedValue = (editValue || '').trim();

    if (trimmedValue) {
      newItems[editingIndex] = trimmedValue;
    } else {
      // 빈 값이면 삭제
      newItems.splice(editingIndex, 1);
    }

    onChange(newItems);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
      // 다음 항목으로 이동
      if (index < items.length - 1) {
        setTimeout(() => handleItemClick(index + 1), 50);
      }
    } else if (e.key === 'Backspace' && !editValue && items.length > 1) {
      e.preventDefault();
      handleDelete(index);
    }
  };

  const handleAdd = (afterIndex: number) => {
    if (items.length >= maxItems) return;

    const newItems = [...items];
    newItems.splice(afterIndex + 1, 0, '새 항목');
    onChange(newItems);

    // 새로 추가된 항목 편집 모드
    setTimeout(() => {
      handleItemClick(afterIndex + 1);
    }, 50);
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
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-2 group"
        >
          {/* 불릿 마커 */}
          <div
            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
            style={{ backgroundColor: `#${themeColor}` }}
          />

          {/* 텍스트 영역 */}
          <div className="flex-1 min-w-0">
            {editingIndex === index ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="
                  w-full px-2 py-1 text-sm rounded
                  bg-yellow-50 dark:bg-yellow-900/30
                  border-2 border-blue-500
                  text-slate-700 dark:text-slate-200
                  outline-none
                "
                placeholder="내용 입력..."
              />
            ) : (
              <span
                onClick={() => handleItemClick(index)}
                className="
                  block text-sm text-slate-700 dark:text-slate-300
                  cursor-pointer
                  hover:bg-blue-50 dark:hover:bg-blue-900/20
                  hover:outline hover:outline-2 hover:outline-blue-400
                  rounded px-2 py-1 -mx-2 -my-1
                  transition-all duration-150
                "
                title="클릭하여 편집"
              >
                {item}
              </span>
            )}
          </div>

          {/* 액션 버튼 (호버 시 표시) */}
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* 추가 버튼 */}
            {items.length < maxItems && (
              <button
                onClick={() => handleAdd(index)}
                className="
                  w-6 h-6 flex items-center justify-center
                  text-green-600 hover:text-green-700
                  hover:bg-green-100 dark:hover:bg-green-900/30
                  rounded transition-colors
                "
                title="아래에 항목 추가"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}

            {/* 삭제 버튼 */}
            {items.length > 1 && (
              <button
                onClick={() => handleDelete(index)}
                className="
                  w-6 h-6 flex items-center justify-center
                  text-red-500 hover:text-red-600
                  hover:bg-red-100 dark:hover:bg-red-900/30
                  rounded transition-colors
                "
                title="항목 삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* 새 항목 추가 버튼 (리스트 끝) */}
      {items.length < maxItems && (
        <button
          onClick={() => handleAdd(items.length - 1)}
          className="
            flex items-center gap-2 text-sm
            text-slate-400 hover:text-slate-600
            dark:text-slate-500 dark:hover:text-slate-400
            py-1 px-2 -mx-2
            rounded hover:bg-slate-100 dark:hover:bg-slate-800
            transition-colors
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          항목 추가
        </button>
      )}
    </div>
  );
}
