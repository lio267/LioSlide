'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import GenerateForm from '../../components/GenerateForm';
import TemplatePreview from '../../components/TemplatePreview';

// 템플릿 데이터 (실제로는 API나 별도 파일에서 가져올 수 있음)
const TEMPLATES: Record<
  string,
  {
    id: string;
    name: string;
    nameKo: string;
    description: string;
    descriptionKo: string;
    tags: string[];
    category: string;
    preview: {
      gradient: string;
      accentColor: string;
      style: string;
    };
  }
> = {
  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    nameKo: '비즈니스 블루',
    description: 'Professional template for business presentations',
    descriptionKo: '전문적인 비즈니스 발표를 위한 블루 테마 템플릿',
    tags: ['비즈니스', '전문적', '기업'],
    category: 'business',
    preview: {
      gradient: 'from-blue-500 to-blue-600',
      accentColor: '#FF6B6B',
      style: 'professional',
    },
  },
  'minimal-white': {
    id: 'minimal-white',
    name: 'Minimal White',
    nameKo: '미니멀 화이트',
    description: 'Clean and minimal design for any purpose',
    descriptionKo: '깔끔하고 심플한 디자인의 범용 템플릿',
    tags: ['미니멀', '심플', '깔끔'],
    category: 'minimal',
    preview: {
      gradient: 'from-gray-100 to-gray-200',
      accentColor: '#3B82F6',
      style: 'minimal',
    },
  },
  'creative-yellow': {
    id: 'creative-yellow',
    name: 'Creative Yellow',
    nameKo: '크리에이티브 옐로우',
    description: 'Vibrant and energetic template for creative work',
    descriptionKo: '활기차고 창의적인 프레젠테이션을 위한 템플릿',
    tags: ['크리에이티브', '마케팅', '활기찬'],
    category: 'creative',
    preview: {
      gradient: 'from-yellow-400 to-orange-500',
      accentColor: '#7C3AED',
      style: 'creative',
    },
  },
  'dark-professional': {
    id: 'dark-professional',
    name: 'Dark Professional',
    nameKo: '다크 프로페셔널',
    description: 'Elegant dark theme for sophisticated presentations',
    descriptionKo: '세련되고 고급스러운 다크 테마 템플릿',
    tags: ['다크', '고급', '세련된'],
    category: 'business',
    preview: {
      gradient: 'from-slate-800 to-slate-900',
      accentColor: '#6366F1',
      style: 'dark',
    },
  },
  'soft-gradient': {
    id: 'soft-gradient',
    name: 'Soft Gradient',
    nameKo: '소프트 그라데이션',
    description: 'Beautiful gradient backgrounds for modern presentations',
    descriptionKo: '부드러운 그라데이션의 현대적인 템플릿',
    tags: ['그라데이션', '모던', '트렌디'],
    category: 'creative',
    preview: {
      gradient: 'from-purple-400 via-pink-400 to-rose-400',
      accentColor: '#14B8A6',
      style: 'gradient',
    },
  },
  'modern-teal': {
    id: 'modern-teal',
    name: 'Modern Teal',
    nameKo: '모던 틸',
    description: 'Fresh and modern template with teal accents',
    descriptionKo: '신선하고 현대적인 틸 컬러 템플릿',
    tags: ['모던', '스타트업', '테크'],
    category: 'business',
    preview: {
      gradient: 'from-teal-500 to-emerald-500',
      accentColor: '#F59E0B',
      style: 'modern',
    },
  },
  'toss-blue': {
    id: 'toss-blue',
    name: 'Toss Blue',
    nameKo: '토스 블루',
    description: 'Clean and modern Toss-style blue theme',
    descriptionKo: '토스 스타일의 깔끔한 블루 테마',
    tags: ['토스', '핀테크', '모던'],
    category: 'business',
    preview: {
      gradient: 'from-blue-400 to-blue-600',
      accentColor: '#3182F6',
      style: 'modern',
    },
  },
  'vercel-mono': {
    id: 'vercel-mono',
    name: 'Vercel Mono',
    nameKo: '버셀 모노',
    description: 'Minimal dark theme inspired by Vercel',
    descriptionKo: '버셀 스타일의 미니멀 다크 테마',
    tags: ['버셀', '미니멀', '다크'],
    category: 'minimal',
    preview: {
      gradient: 'from-black to-gray-900',
      accentColor: '#ffffff',
      style: 'dark',
    },
  },
  'supabase-green': {
    id: 'supabase-green',
    name: 'Supabase Green',
    nameKo: '수파베이스 그린',
    description: 'Developer-friendly green theme inspired by Supabase',
    descriptionKo: '수파베이스 스타일의 그린 테마',
    tags: ['수파베이스', '개발자', '모던'],
    category: 'business',
    preview: {
      gradient: 'from-emerald-500 to-green-600',
      accentColor: '#3ECF8E',
      style: 'modern',
    },
  },
  'claude-coral': {
    id: 'claude-coral',
    name: 'Claude Coral',
    nameKo: '클로드 코랄',
    description: 'Warm coral theme inspired by Claude AI',
    descriptionKo: '클로드 AI 스타일의 따뜻한 코랄 테마',
    tags: ['클로드', 'AI', '따뜻한'],
    category: 'creative',
    preview: {
      gradient: 'from-orange-300 to-red-400',
      accentColor: '#D97757',
      style: 'creative',
    },
  },
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    nameKo: '사이버펑크 네온',
    description: 'Bold neon-colored cyberpunk theme',
    descriptionKo: '네온 컬러의 사이버펑크 테마',
    tags: ['사이버펑크', '네온', '볼드'],
    category: 'creative',
    preview: {
      gradient: 'from-fuchsia-600 to-purple-900',
      accentColor: '#F0ABFC',
      style: 'creative',
    },
  },
  'twitter-blue': {
    id: 'twitter-blue',
    name: 'Twitter Blue',
    nameKo: '트위터 블루',
    description: 'Social media style blue theme',
    descriptionKo: '트위터 스타일의 소셜 미디어 테마',
    tags: ['트위터', '소셜', '모던'],
    category: 'business',
    preview: {
      gradient: 'from-blue-400 to-sky-500',
      accentColor: '#1D9BF0',
      style: 'modern',
    },
  },
  'mono-minimal': {
    id: 'mono-minimal',
    name: 'Mono Minimal',
    nameKo: '모노 미니멀',
    description: 'Monospace font minimal theme for developers',
    descriptionKo: '모노스페이스 폰트의 미니멀 테마',
    tags: ['모노', '미니멀', '개발자'],
    category: 'minimal',
    preview: {
      gradient: 'from-zinc-200 to-zinc-400',
      accentColor: '#71717A',
      style: 'minimal',
    },
  },
};

export default function CreatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const template = TEMPLATES[templateId];

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // 템플릿이 없는 경우
  if (!template) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            템플릿을 찾을 수 없습니다
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            요청하신 템플릿이 존재하지 않습니다.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Back */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="hidden sm:inline">템플릿 목록</span>
              </Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <Link href="/" className="flex items-center gap-2">
                <svg className="w-9 h-9" viewBox="0 0 32 32" fill="none">
                  <defs>
                    <linearGradient id="lioSlideGradCreate" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#a855f7"/>
                    </linearGradient>
                  </defs>
                  {/* Slide background */}
                  <rect x="4" y="2" width="24" height="28" rx="4" className="fill-indigo-100 dark:fill-indigo-900/50"/>
                  {/* L pointer with gradient */}
                  <path d="M10 8v16h12" stroke="url(#lioSlideGradCreate)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-bold text-xl text-slate-900 dark:text-white">
                  Lio<span className="text-primary-600">Slide</span>
                </span>
              </Link>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="다크모드 토글"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Template Preview */}
          <div className="space-y-6">
            {/* Template Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                  {template.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {template.nameKo}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {template.descriptionKo}
              </p>
            </div>

            {/* Preview Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  미리보기
                </h3>
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <TemplatePreview
                    templateId={template.id}
                    gradient={template.preview.gradient}
                    accentColor={template.preview.accentColor}
                    style={template.preview.style}
                  />
                </div>
              </div>

              {/* Template Tags */}
              <div className="px-6 pb-6">
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    좋은 PPT를 위한 팁
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• 명확하고 구체적인 주제를 입력하세요</li>
                    <li>• 청중을 정확히 지정하면 더 적합한 내용이 생성됩니다</li>
                    <li>• 원문/참고자료를 제공하면 더 풍부한 내용이 됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Generate Form */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                PPT 생성하기
              </h2>
              <GenerateForm templateId={template.id} templateName={template.nameKo} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              &copy; 2026 LioSlide. AI-Powered Presentation Generator.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                홈
              </Link>
              <Link
                href="/"
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                템플릿
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
