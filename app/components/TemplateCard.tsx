'use client';

import Link from 'next/link';
import TemplatePreview from './TemplatePreview';

interface Template {
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

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Preview Image */}
      <div className="relative overflow-hidden">
        <TemplatePreview
          templateId={template.id}
          gradient={template.preview.gradient}
          accentColor={template.preview.accentColor}
          style={template.preview.style}
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Link
            href={`/create/${template.id}`}
            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-transform duration-300 hover:bg-slate-100"
          >
            사용하기
          </Link>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Template Name */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          {template.nameKo}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
          {template.descriptionKo}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="px-5 pb-5">
        <Link
          href={`/create/${template.id}`}
          className="block w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          이 템플릿으로 만들기
        </Link>
      </div>
    </div>
  );
}
