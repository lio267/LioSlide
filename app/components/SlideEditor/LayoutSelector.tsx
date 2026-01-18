'use client';

import { useState, useRef, useEffect } from 'react';
import { SlideData } from '../SlidePreview';
import { LAYOUT_OPTIONS } from './index';

interface LayoutSelectorProps {
  currentType: SlideData['type'];
  onChange: (type: SlideData['type']) => void;
}

export default function LayoutSelector({ currentType, onChange }: LayoutSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const currentLayout = LAYOUT_OPTIONS.find(l => l.value === currentType) || LAYOUT_OPTIONS[2];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200
          bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
          ${isOpen ? 'ring-2 ring-primary-500' : ''}
        `}
      >
        <LayoutIcon iconPath={currentLayout.icon} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden lg:inline">
          {currentLayout.label}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="
          absolute top-full left-0 mt-2 z-50
          bg-white dark:bg-slate-800 rounded-xl shadow-xl
          border border-slate-200 dark:border-slate-700
          py-2 min-w-[220px]
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
            레이아웃 선택
          </div>

          <div className="grid grid-cols-3 gap-1 p-2">
            {LAYOUT_OPTIONS.map((layout) => (
              <button
                key={layout.value}
                onClick={() => {
                  onChange(layout.value);
                  setIsOpen(false);
                }}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-150
                  hover:bg-slate-50 dark:hover:bg-slate-700/50
                  ${currentType === layout.value
                    ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500'
                    : ''
                  }
                `}
                title={layout.label}
              >
                <div className={`
                  w-10 h-8 rounded border flex items-center justify-center
                  ${currentType === layout.value
                    ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
                    : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                  }
                `}>
                  <LayoutIcon iconPath={layout.icon} selected={currentType === layout.value} />
                </div>
                <span className={`
                  text-[10px] font-medium text-center
                  ${currentType === layout.value
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400'
                  }
                `}>
                  {layout.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 레이아웃 아이콘 컴포넌트
function LayoutIcon({ iconPath, selected = false }: { iconPath: string; selected?: boolean }) {
  return (
    <svg
      className={`w-4 h-4 ${selected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
    </svg>
  );
}
