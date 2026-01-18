'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  placeholder?: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
  multiline?: boolean;
  style?: React.CSSProperties;
}

export default function EditableText({
  value,
  onChange,
  className = '',
  placeholder = '클릭하여 편집',
  as: Tag = 'span',
  multiline = false,
  style,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // value prop이 변경되면 editValue도 업데이트
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (editValue.trim() !== value) {
      onChange(editValue.trim());
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    const inputClassName = `
      w-full px-2 py-1 rounded
      bg-yellow-50 dark:bg-yellow-900/30
      border-2 border-blue-500
      text-inherit font-inherit
      outline-none
      ${className}
    `;

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${inputClassName} resize-none min-h-[60px]`}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />
    );
  }

  return (
    <Tag
      onClick={handleClick}
      className={`
        cursor-pointer
        hover:bg-blue-50 dark:hover:bg-blue-900/20
        hover:outline hover:outline-2 hover:outline-blue-400
        rounded px-1 -mx-1
        transition-all duration-150
        ${!value ? 'text-slate-400 italic' : ''}
        ${className}
      `}
      style={style}
      title="클릭하여 편집"
    >
      {value || placeholder}
    </Tag>
  );
}
