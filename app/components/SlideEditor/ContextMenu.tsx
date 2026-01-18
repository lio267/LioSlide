'use client';

import { useEffect, useRef, useState } from 'react';
import { SlideData } from '../SlidePreview';
import { LAYOUT_OPTIONS } from './index';

interface ContextMenuProps {
  x: number;
  y: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onChangeLayout: (type: SlideData['type']) => void;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function ContextMenu({
  x,
  y,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onChangeLayout,
  canDelete,
  canMoveUp,
  canMoveDown,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showLayoutSubmenu, setShowLayoutSubmenu] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  // 메뉴가 화면 밖으로 나가지 않도록 위치 조정
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      // 오른쪽 경계 체크
      if (x + rect.width > viewportWidth - 10) {
        newX = viewportWidth - rect.width - 10;
      }

      // 아래쪽 경계 체크
      if (y + rect.height > viewportHeight - 10) {
        newY = viewportHeight - rect.height - 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="
        fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl
        border border-slate-200 dark:border-slate-700
        py-2 min-w-[180px]
        animate-in fade-in zoom-in-95 duration-150
      "
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {/* 복제 */}
      <MenuItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        }
        label="복제"
        shortcut="Ctrl+D"
        onClick={onDuplicate}
      />

      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

      {/* 위로 이동 */}
      <MenuItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        }
        label="위로 이동"
        onClick={onMoveUp}
        disabled={!canMoveUp}
      />

      {/* 아래로 이동 */}
      <MenuItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        }
        label="아래로 이동"
        onClick={onMoveDown}
        disabled={!canMoveDown}
      />

      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

      {/* 레이아웃 변경 (서브메뉴) */}
      <div
        className="relative"
        onMouseEnter={() => setShowLayoutSubmenu(true)}
        onMouseLeave={() => setShowLayoutSubmenu(false)}
      >
        <div className="
          flex items-center justify-between px-3 py-2 cursor-pointer
          hover:bg-slate-50 dark:hover:bg-slate-700/50
          text-slate-700 dark:text-slate-200
        ">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span className="text-sm font-medium">레이아웃 변경</span>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* 레이아웃 서브메뉴 */}
        {showLayoutSubmenu && (
          <div className="
            absolute left-full top-0 ml-1
            bg-white dark:bg-slate-800 rounded-xl shadow-2xl
            border border-slate-200 dark:border-slate-700
            py-2 min-w-[160px]
            animate-in fade-in slide-in-from-left-2 duration-150
          ">
            {LAYOUT_OPTIONS.map((layout) => (
              <button
                key={layout.value}
                onClick={() => onChangeLayout(layout.value)}
                className="
                  w-full flex items-center gap-3 px-3 py-2 text-left
                  hover:bg-slate-50 dark:hover:bg-slate-700/50
                  text-slate-700 dark:text-slate-200 text-sm
                "
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={layout.icon} />
                </svg>
                {layout.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

      {/* 삭제 */}
      <MenuItem
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
        label="삭제"
        shortcut="Delete"
        onClick={onDelete}
        disabled={!canDelete}
        danger
      />
    </div>
  );
}

// 메뉴 아이템 컴포넌트
function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
  disabled = false,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between px-3 py-2
        transition-colors duration-150
        ${disabled
          ? 'opacity-40 cursor-not-allowed'
          : danger
            ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {shortcut && (
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          {shortcut}
        </span>
      )}
    </button>
  );
}
