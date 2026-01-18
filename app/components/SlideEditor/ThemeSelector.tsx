'use client';

import { useState, useRef, useEffect } from 'react';
import { THEME_OPTIONS } from './index';

interface ThemeSelectorProps {
  currentColor: string;
  onChange: (color: string) => void;
}

export default function ThemeSelector({ currentColor, onChange }: ThemeSelectorProps) {
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

  const currentTheme = THEME_OPTIONS.find(t => t.color === currentColor) || THEME_OPTIONS[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200
          bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
          border border-transparent
          ${isOpen ? 'ring-2 ring-primary-500' : ''}
        `}
      >
        <div
          className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-600 shadow-sm transition-transform duration-300"
          style={{ backgroundColor: `#${currentColor}` }}
        />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden lg:inline max-w-[100px] truncate">
          {currentTheme.name}
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
          py-2 min-w-[200px]
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
            테마 선택
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onChange(theme.color);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 transition-all duration-150
                  hover:bg-slate-50 dark:hover:bg-slate-700/50
                  ${currentColor === theme.color ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                `}
              >
                <div
                  className={`
                    w-6 h-6 rounded-full transition-transform duration-200
                    ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800
                    ${currentColor === theme.color ? 'ring-primary-500 scale-110' : 'ring-transparent'}
                  `}
                  style={{ backgroundColor: `#${theme.color}` }}
                />
                <div className="flex-1 text-left">
                  <span className={`
                    text-sm font-medium
                    ${currentColor === theme.color
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-700 dark:text-slate-200'
                    }
                  `}>
                    {theme.name}
                  </span>
                </div>
                {currentColor === theme.color && (
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* 커스텀 색상 입력 */}
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">#</span>
              <input
                type="text"
                value={currentColor}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                  if (value.length === 6) {
                    onChange(value);
                  }
                }}
                className="
                  flex-1 px-2 py-1 text-sm rounded
                  bg-slate-100 dark:bg-slate-700
                  text-slate-700 dark:text-slate-200
                  border border-slate-200 dark:border-slate-600
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  uppercase font-mono
                "
                placeholder="HEX 색상"
                maxLength={6}
              />
              <div
                className="w-8 h-8 rounded-lg shadow-inner"
                style={{ backgroundColor: `#${currentColor}` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
