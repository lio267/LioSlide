'use client';

import Link from 'next/link';

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  tags: string[];
  preview: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    style: 'modern' | 'minimal' | 'bold' | 'gradient';
  };
}

interface TemplateCardProps {
  template: TemplateInfo;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link href={`/create/${template.id}`} className="group block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-lg hover:border-gray-300 hover:-translate-y-1">
        {/* Preview */}
        <div className="aspect-video relative overflow-hidden">
          <TemplatePreview template={template} />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {template.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {template.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {template.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 pb-4">
          <div className="py-2.5 text-center rounded-lg bg-gray-50 text-gray-700 font-medium text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
            사용하기
          </div>
        </div>
      </div>
    </Link>
  );
}

function TemplatePreview({ template }: { template: TemplateInfo }) {
  const { primaryColor, secondaryColor, accentColor, style } = template.preview;

  return (
    <svg
      viewBox="0 0 320 180"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      {style === 'gradient' ? (
        <>
          <defs>
            <linearGradient id={`grad-${template.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill={`url(#grad-${template.id})`} />
        </>
      ) : style === 'bold' ? (
        <rect width="320" height="180" fill={primaryColor} />
      ) : (
        <rect width="320" height="180" fill={secondaryColor} />
      )}

      {/* Title area */}
      {style === 'minimal' ? (
        <>
          <rect x="20" y="60" width="160" height="8" rx="2" fill={primaryColor} />
          <rect x="20" y="75" width="100" height="5" rx="1" fill={primaryColor} opacity="0.3" />
          <rect x="20" y="100" width="280" height="3" rx="1" fill={primaryColor} opacity="0.15" />
          <rect x="20" y="110" width="260" height="3" rx="1" fill={primaryColor} opacity="0.15" />
          <rect x="20" y="120" width="240" height="3" rx="1" fill={primaryColor} opacity="0.15" />
        </>
      ) : style === 'bold' || style === 'gradient' ? (
        <>
          <rect x="30" y="55" width="180" height="12" rx="3" fill="white" opacity="0.95" />
          <rect x="30" y="75" width="120" height="6" rx="2" fill="white" opacity="0.6" />
          <rect x="30" y="100" width="260" height="4" rx="1" fill="white" opacity="0.3" />
          <rect x="30" y="112" width="240" height="4" rx="1" fill="white" opacity="0.3" />
          <rect x="30" y="124" width="200" height="4" rx="1" fill="white" opacity="0.3" />
        </>
      ) : (
        <>
          <rect x="20" y="20" width="200" height="10" rx="2" fill={primaryColor} />
          <rect x="20" y="40" width="120" height="5" rx="1" fill={primaryColor} opacity="0.4" />
          <rect x="20" y="60" width="280" height="1" fill={primaryColor} opacity="0.2" />
          <rect x="20" y="75" width="120" height="4" rx="1" fill={primaryColor} opacity="0.2" />
          <rect x="20" y="85" width="260" height="3" rx="1" fill={primaryColor} opacity="0.15" />
          <rect x="20" y="95" width="240" height="3" rx="1" fill={primaryColor} opacity="0.15" />
          <rect x="20" y="105" width="250" height="3" rx="1" fill={primaryColor} opacity="0.15" />
          <rect x="170" y="75" width="130" height="70" rx="4" fill={accentColor} opacity="0.2" />
        </>
      )}

      {/* Accent elements */}
      {style === 'modern' && (
        <rect x="0" y="0" width="6" height="180" fill={accentColor} />
      )}
      {style === 'minimal' && (
        <rect x="20" y="150" width="40" height="2" fill={primaryColor} />
      )}
    </svg>
  );
}
