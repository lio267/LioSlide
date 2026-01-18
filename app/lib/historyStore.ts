'use client';

import { SlideData } from '../components/SlidePreview';

// 프레젠테이션 히스토리 타입
export interface PresentationHistory {
  id: string;
  title: string;
  topic: string;
  audience: string;
  templateId: string;
  templateName: string;
  themeColor: string;
  slidesData: SlideData[];
  slideCount: number;
  aspectRatio?: string; // 화면 비율 (16:9, 4:3, 16:10, A4)
  createdAt: string;
  updatedAt: string;
  thumbnail?: string; // Base64 thumbnail image
}

const HISTORY_KEY = 'ppt_maker_history';

// 히스토리 불러오기
export function getHistory(): PresentationHistory[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 히스토리 저장
export function saveToHistory(presentation: Omit<PresentationHistory, 'id' | 'createdAt' | 'updatedAt'>): PresentationHistory {
  const history = getHistory();

  const newPresentation: PresentationHistory = {
    ...presentation,
    id: `ppt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 최신 항목을 맨 앞에 추가
  history.unshift(newPresentation);

  // 최대 50개까지만 보관
  if (history.length > 50) {
    history.pop();
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return newPresentation;
}

// 히스토리 업데이트
export function updateHistory(id: string, updates: Partial<PresentationHistory>): PresentationHistory | null {
  const history = getHistory();
  const index = history.findIndex(p => p.id === id);

  if (index === -1) return null;

  history[index] = {
    ...history[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history[index];
}

// 히스토리에서 삭제
export function deleteFromHistory(id: string): boolean {
  const history = getHistory();
  const filtered = history.filter(p => p.id !== id);

  if (filtered.length === history.length) return false;

  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  return true;
}

// 특정 프레젠테이션 가져오기
export function getPresentation(id: string): PresentationHistory | null {
  const history = getHistory();
  return history.find(p => p.id === id) || null;
}

// 검색
export function searchHistory(query: string): PresentationHistory[] {
  const history = getHistory();
  const lowerQuery = query.toLowerCase();

  return history.filter(p =>
    p.title.toLowerCase().includes(lowerQuery) ||
    p.topic.toLowerCase().includes(lowerQuery)
  );
}
