'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TemplateCard from './components/TemplateCard';

// 템플릿 데이터 (pptmaker 스타일 테마 추가)
const TEMPLATES = [
  // 기존 템플릿
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    nameKo: '비즈니스 블루',
    description: 'Professional blue theme for corporate presentations',
    descriptionKo: '기업 발표에 적합한 전문적인 블루 테마',
    tags: ['비즈니스', '전문적', '기업'],
    category: 'business',
    preview: {
      gradient: 'from-blue-500 to-blue-600',
      accentColor: '#FF6B6B',
      style: 'professional',
    },
  },
  // Toss 스타일
  {
    id: 'toss-blue',
    name: 'Toss',
    nameKo: '토스 블루',
    description: 'Apple system + professional style inspired by Toss',
    descriptionKo: '토스 스타일의 깔끔한 블루 테마',
    tags: ['토스', '핀테크', '모던'],
    category: 'tech',
    preview: {
      gradient: 'from-blue-600 to-blue-700',
      accentColor: '#0064FF',
      style: 'toss',
    },
  },
  // Vercel 스타일
  {
    id: 'vercel-mono',
    name: 'Vercel',
    nameKo: '버셀 모노',
    description: 'Geist Sans + minimal style inspired by Vercel',
    descriptionKo: '버셀 스타일의 미니멀 다크 테마',
    tags: ['버셀', '미니멀', '다크'],
    category: 'dark',
    preview: {
      gradient: 'from-black to-zinc-900',
      accentColor: '#FFFFFF',
      style: 'vercel',
    },
  },
  // Supabase 스타일
  {
    id: 'supabase-green',
    name: 'Supabase',
    nameKo: '수파베이스 그린',
    description: 'Inter + modern style inspired by Supabase',
    descriptionKo: '수파베이스 스타일의 그린 테마',
    tags: ['수파베이스', '개발자', '모던'],
    category: 'tech',
    preview: {
      gradient: 'from-emerald-500 to-green-600',
      accentColor: '#3ECF8E',
      style: 'supabase',
    },
  },
  // Claude 스타일
  {
    id: 'claude-coral',
    name: 'Claude',
    nameKo: '클로드 코랄',
    description: 'Inter + playful style inspired by Claude AI',
    descriptionKo: '클로드 AI 스타일의 따뜻한 코랄 테마',
    tags: ['클로드', 'AI', '따뜻한'],
    category: 'creative',
    preview: {
      gradient: 'from-orange-400 to-rose-500',
      accentColor: '#E07A5F',
      style: 'claude',
    },
  },
  // Cyberpunk 스타일
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk',
    nameKo: '사이버펑크 네온',
    description: 'Orbitron + bold style with neon colors',
    descriptionKo: '네온 컬러의 사이버펑크 테마',
    tags: ['사이버펑크', '네온', '볼드'],
    category: 'creative',
    preview: {
      gradient: 'from-fuchsia-600 via-purple-600 to-cyan-500',
      accentColor: '#FF00FF',
      style: 'cyberpunk',
    },
  },
  // Twitter/X 스타일
  {
    id: 'twitter-blue',
    name: 'Twitter',
    nameKo: '트위터 블루',
    description: 'Apple system + modern social media style',
    descriptionKo: '트위터 스타일의 소셜 미디어 테마',
    tags: ['트위터', '소셜', '모던'],
    category: 'business',
    preview: {
      gradient: 'from-sky-400 to-blue-500',
      accentColor: '#1DA1F2',
      style: 'twitter',
    },
  },
  // Mono 스타일
  {
    id: 'mono-minimal',
    name: 'Mono',
    nameKo: '모노 미니멀',
    description: 'IBM Plex Mono + minimal monospace style',
    descriptionKo: '모노스페이스 폰트의 미니멀 테마',
    tags: ['모노', '미니멀', '개발자'],
    category: 'minimal',
    preview: {
      gradient: 'from-gray-800 to-gray-900',
      accentColor: '#9CA3AF',
      style: 'mono',
    },
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    nameKo: '미니멀 화이트',
    description: 'Clean and minimal white theme with subtle accents',
    descriptionKo: '깔끔하고 간결한 화이트 테마',
    tags: ['미니멀', '깔끔', '심플'],
    category: 'minimal',
    preview: {
      gradient: 'from-zinc-100 to-white',
      accentColor: '#3B82F6',
      style: 'minimal',
    },
  },
  {
    id: 'creative-yellow',
    name: 'Creative Yellow',
    nameKo: '크리에이티브 옐로우',
    description: 'Vibrant yellow theme for creative presentations',
    descriptionKo: '창의적인 발표를 위한 생동감 있는 옐로우 테마',
    tags: ['크리에이티브', '활기찬', '마케팅'],
    category: 'creative',
    preview: {
      gradient: 'from-yellow-400 to-amber-500',
      accentColor: '#EC4899',
      style: 'creative',
    },
  },
  {
    id: 'dark-professional',
    name: 'Dark Professional',
    nameKo: '다크 프로페셔널',
    description: 'Elegant dark theme for impactful presentations',
    descriptionKo: '임팩트 있는 발표를 위한 세련된 다크 테마',
    tags: ['다크', '세련된', '임팩트'],
    category: 'dark',
    preview: {
      gradient: 'from-slate-900 to-slate-800',
      accentColor: '#22D3EE',
      style: 'dark',
    },
  },
  {
    id: 'soft-gradient',
    name: 'Soft Gradient',
    nameKo: '소프트 그라데이션',
    description: 'Soft pastel gradient theme for gentle presentations',
    descriptionKo: '부드러운 파스텔 그라데이션 테마',
    tags: ['부드러운', '파스텔', '그라데이션'],
    category: 'gradient',
    preview: {
      gradient: 'from-violet-400 via-purple-400 to-pink-400',
      accentColor: '#F472B6',
      style: 'gradient',
    },
  },
  {
    id: 'modern-teal',
    name: 'Modern Teal',
    nameKo: '모던 틸',
    description: 'Modern teal theme for tech and startup presentations',
    descriptionKo: '테크/스타트업 발표에 적합한 모던 틸 테마',
    tags: ['모던', '테크', '스타트업'],
    category: 'tech',
    preview: {
      gradient: 'from-teal-500 to-emerald-500',
      accentColor: '#F97316',
      style: 'modern',
    },
  },
];

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 다크 모드 초기화
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  // 다크 모드 토글
  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // 카테고리 필터
  const categories = [
    { id: null, label: '전체' },
    { id: 'business', label: '비즈니스' },
    { id: 'minimal', label: '미니멀' },
    { id: 'creative', label: '크리에이티브' },
    { id: 'dark', label: '다크' },
    { id: 'gradient', label: '그라데이션' },
    { id: 'tech', label: '테크' },
  ];

  const filteredTemplates = selectedCategory
    ? TEMPLATES.filter((t) => t.category === selectedCategory)
    : TEMPLATES;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-9 h-9" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="lioSlideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
                {/* Slide background */}
                <rect x="4" y="2" width="24" height="28" rx="4" className="fill-indigo-100 dark:fill-indigo-900/50"/>
                {/* L pointer with gradient */}
                <path d="M10 8v16h12" stroke="url(#lioSlideGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-bold text-xl text-slate-900 dark:text-white">
                LioSlide
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-sm font-medium text-primary-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                만들기
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                히스토리
              </Link>
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="다크 모드 토글"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              AI PPT{' '}
              <span className="bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
                자동 생성기
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              원하는 템플릿을 선택하고, 주제만 입력하면
              <br className="hidden sm:block" />
              AI가 전문적인 프레젠테이션을 자동으로 생성합니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#templates"
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-primary-500/30"
              >
                템플릿 둘러보기
              </a>
              <Link
                href="/create/corporate-blue"
                className="px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold transition-colors border border-slate-200 dark:border-slate-700"
              >
                바로 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                빠른 생성
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                병렬 처리로 몇 초 만에 완성되는 프레젠테이션
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                다양한 테마
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                비즈니스부터 크리에이티브까지 6가지 템플릿
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                품질 검증
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                자동 스타일 검사로 일관된 디자인 보장
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Template Gallery Section */}
      <section id="templates" className="py-16 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              템플릿 갤러리
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              원하는 스타일의 템플릿을 선택하세요
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((category) => (
              <button
                key={category.id || 'all'}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-primary-100 mb-10">
            무료로 AI 기반 프레젠테이션을 생성해보세요
          </p>
          <Link
            href="/create/corporate-blue"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-100 text-primary-600 rounded-xl font-semibold transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            PPT 만들기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            Powered by AI &bull; pptxgenjs &bull; Next.js
          </p>
        </div>
      </footer>
    </main>
  );
}
