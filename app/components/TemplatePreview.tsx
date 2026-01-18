'use client';

interface TemplatePreviewProps {
  templateId: string;
  gradient: string;
  accentColor: string;
  style: string;
  className?: string;
}

export default function TemplatePreview({
  templateId,
  gradient,
  accentColor,
  style,
  className = '',
}: TemplatePreviewProps) {
  // 각 스타일별 SVG 렌더링
  const renderPreview = () => {
    switch (style) {
      case 'professional':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <defs>
              <linearGradient id={`grad-${templateId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1791E8" />
                <stop offset="100%" stopColor="#1273BA" />
              </linearGradient>
            </defs>
            <rect width="320" height="180" fill={`url(#grad-${templateId})`} />
            <rect x="20" y="20" width="180" height="12" rx="2" fill="white" opacity="0.9" />
            <rect x="20" y="40" width="120" height="8" rx="2" fill="white" opacity="0.6" />
            <rect x="20" y="70" width="280" height="4" rx="1" fill="white" opacity="0.3" />
            <rect x="20" y="82" width="260" height="4" rx="1" fill="white" opacity="0.3" />
            <rect x="20" y="94" width="240" height="4" rx="1" fill="white" opacity="0.3" />
            <circle cx="280" cy="140" r="25" fill="white" opacity="0.2" />
            <rect x="20" y="150" width="60" height="16" rx="4" fill={accentColor} />
          </svg>
        );

      case 'minimal':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#FAFAFA" />
            <rect x="40" y="40" width="160" height="16" rx="2" fill="#18181B" />
            <rect x="40" y="65" width="100" height="8" rx="2" fill="#71717A" />
            <line x1="40" y1="100" x2="280" y2="100" stroke="#E4E4E7" strokeWidth="1" />
            <rect x="40" y="115" width="240" height="4" rx="1" fill="#D4D4D8" />
            <rect x="40" y="127" width="200" height="4" rx="1" fill="#D4D4D8" />
            <rect x="40" y="139" width="220" height="4" rx="1" fill="#D4D4D8" />
            <circle cx="260" cy="60" r="3" fill={accentColor} />
          </svg>
        );

      case 'creative':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <defs>
              <linearGradient id={`grad-${templateId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FACC15" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <rect width="320" height="180" fill={`url(#grad-${templateId})`} />
            <circle cx="260" cy="40" r="50" fill="white" opacity="0.2" />
            <circle cx="280" cy="60" r="30" fill="white" opacity="0.15" />
            <rect x="30" y="60" width="140" height="18" rx="4" fill="#422006" />
            <rect x="30" y="85" width="100" height="10" rx="2" fill="#713F12" opacity="0.8" />
            <rect x="30" y="120" width="180" height="6" rx="1" fill="#422006" opacity="0.5" />
            <rect x="30" y="134" width="160" height="6" rx="1" fill="#422006" opacity="0.5" />
            <rect x="240" y="140" width="50" height="20" rx="10" fill={accentColor} />
          </svg>
        );

      case 'dark':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#0F172A" />
            <rect x="0" y="0" width="320" height="4" fill={accentColor} />
            <rect x="30" y="40" width="180" height="14" rx="2" fill="#F8FAFC" />
            <rect x="30" y="62" width="120" height="8" rx="2" fill="#94A3B8" />
            <rect x="30" y="95" width="260" height="3" rx="1" fill="#334155" />
            <rect x="30" y="106" width="240" height="3" rx="1" fill="#334155" />
            <rect x="30" y="117" width="250" height="3" rx="1" fill="#334155" />
            <rect x="30" y="150" width="70" height="16" rx="4" fill={accentColor} />
            <circle cx="280" cy="50" r="20" fill="#1E293B" />
            <path d="M275 45 L280 55 L285 45" fill={accentColor} />
          </svg>
        );

      case 'gradient':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <defs>
              <linearGradient id={`grad-${templateId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="50%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
            </defs>
            <rect width="320" height="180" fill={`url(#grad-${templateId})`} />
            <ellipse cx="280" cy="30" rx="60" ry="40" fill="white" opacity="0.15" />
            <ellipse cx="40" cy="160" rx="50" ry="30" fill="white" opacity="0.1" />
            <rect x="30" y="50" width="160" height="16" rx="4" fill="white" opacity="0.95" />
            <rect x="30" y="75" width="100" height="8" rx="2" fill="white" opacity="0.7" />
            <rect x="30" y="110" width="200" height="4" rx="1" fill="white" opacity="0.4" />
            <rect x="30" y="122" width="180" height="4" rx="1" fill="white" opacity="0.4" />
            <rect x="220" y="145" width="70" height="20" rx="10" fill="white" opacity="0.9" />
          </svg>
        );

      case 'modern':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <defs>
              <linearGradient id={`grad-${templateId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <rect width="320" height="180" fill="#F0FDFA" />
            <rect x="0" y="0" width="8" height="180" fill={`url(#grad-${templateId})`} />
            <rect x="30" y="30" width="180" height="16" rx="2" fill="#134E4A" />
            <rect x="30" y="55" width="100" height="8" rx="2" fill="#0D9488" opacity="0.7" />
            <rect x="30" y="90" width="260" height="4" rx="1" fill="#99F6E4" />
            <rect x="30" y="102" width="240" height="4" rx="1" fill="#99F6E4" />
            <rect x="30" y="114" width="250" height="4" rx="1" fill="#99F6E4" />
            <circle cx="270" cy="145" r="20" fill={`url(#grad-${templateId})`} opacity="0.3" />
            <rect x="30" y="145" width="80" height="20" rx="4" fill={accentColor} />
          </svg>
        );

      case 'toss':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#FFFFFF" />
            <rect x="30" y="35" width="160" height="18" rx="2" fill="#191F28" />
            <rect x="30" y="60" width="100" height="10" rx="2" fill="#8B95A1" />
            <rect x="30" y="95" width="260" height="1" fill="#E5E8EB" />
            <rect x="30" y="115" width="120" height="40" rx="8" fill="#F2F4F6" />
            <rect x="40" y="125" width="60" height="8" rx="2" fill="#4E5968" />
            <rect x="40" y="138" width="40" height="6" rx="2" fill="#0064FF" />
            <rect x="165" y="115" width="120" height="40" rx="8" fill="#F2F4F6" />
            <rect x="175" y="125" width="60" height="8" rx="2" fill="#4E5968" />
            <rect x="175" y="138" width="40" height="6" rx="2" fill="#0064FF" />
          </svg>
        );

      case 'vercel':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#000000" />
            <rect x="30" y="35" width="140" height="16" rx="2" fill="#FFFFFF" />
            <rect x="30" y="58" width="80" height="8" rx="2" fill="#888888" />
            <rect x="30" y="90" width="260" height="1" fill="#333333" />
            <rect x="30" y="110" width="260" height="4" rx="1" fill="#222222" />
            <rect x="30" y="122" width="220" height="4" rx="1" fill="#222222" />
            <rect x="30" y="134" width="240" height="4" rx="1" fill="#222222" />
            <polygon points="270,150 285,170 255,170" fill="#FFFFFF" />
          </svg>
        );

      case 'supabase':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#1C1C1C" />
            <rect x="30" y="35" width="150" height="16" rx="2" fill="#3ECF8E" />
            <rect x="30" y="58" width="90" height="8" rx="2" fill="#FFFFFF" opacity="0.7" />
            <rect x="30" y="90" width="260" height="4" rx="1" fill="#2D2D2D" />
            <rect x="30" y="102" width="240" height="4" rx="1" fill="#2D2D2D" />
            <rect x="30" y="114" width="250" height="4" rx="1" fill="#2D2D2D" />
            <circle cx="270" cy="50" r="20" fill="#3ECF8E" opacity="0.3" />
            <rect x="30" y="145" width="70" height="20" rx="4" fill="#3ECF8E" />
          </svg>
        );

      case 'claude':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <defs>
              <linearGradient id={`grad-${templateId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5E6D8" />
                <stop offset="100%" stopColor="#EDD9C4" />
              </linearGradient>
            </defs>
            <rect width="320" height="180" fill={`url(#grad-${templateId})`} />
            <rect x="30" y="35" width="150" height="16" rx="4" fill="#1A1915" />
            <rect x="30" y="58" width="90" height="8" rx="2" fill="#5D5449" />
            <rect x="30" y="90" width="260" height="4" rx="2" fill="#D5C4B0" />
            <rect x="30" y="102" width="240" height="4" rx="2" fill="#D5C4B0" />
            <rect x="30" y="114" width="250" height="4" rx="2" fill="#D5C4B0" />
            <circle cx="270" cy="50" r="22" fill="#E07A5F" opacity="0.6" />
            <rect x="30" y="145" width="70" height="20" rx="10" fill="#E07A5F" />
          </svg>
        );

      case 'cyberpunk':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#0D0221" />
            <rect x="0" y="0" width="320" height="3" fill="#FF00FF" />
            <rect x="0" y="177" width="320" height="3" fill="#00FFFF" />
            <rect x="30" y="35" width="160" height="18" rx="2" fill="#FF00FF" />
            <rect x="30" y="60" width="100" height="10" rx="2" fill="#00FFFF" />
            <rect x="30" y="95" width="260" height="2" fill="#FF00FF" opacity="0.5" />
            <rect x="30" y="110" width="240" height="4" rx="1" fill="#1A0A2E" />
            <rect x="30" y="122" width="250" height="4" rx="1" fill="#1A0A2E" />
            <polygon points="280,140 290,160 270,160" fill="#FF00FF" />
            <polygon points="260,145 270,165 250,165" fill="#00FFFF" opacity="0.7" />
          </svg>
        );

      case 'twitter':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#FFFFFF" />
            <rect x="30" y="35" width="150" height="16" rx="2" fill="#0F1419" />
            <rect x="30" y="58" width="90" height="8" rx="2" fill="#536471" />
            <rect x="30" y="85" width="260" height="60" rx="12" fill="#F7F9F9" />
            <rect x="45" y="100" width="180" height="8" rx="2" fill="#0F1419" />
            <rect x="45" y="115" width="140" height="6" rx="2" fill="#536471" />
            <circle cx="275" cy="50" r="18" fill="#1D9BF0" opacity="0.2" />
            <rect x="30" y="155" width="60" height="16" rx="20" fill="#1D9BF0" />
          </svg>
        );

      case 'mono':
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#18181B" />
            <rect x="30" y="30" width="2" height="120" fill="#3F3F46" />
            <text x="40" y="50" fontFamily="monospace" fontSize="14" fill="#A1A1AA">const title =</text>
            <text x="40" y="70" fontFamily="monospace" fontSize="12" fill="#71717A">// presentation</text>
            <rect x="40" y="90" width="200" height="3" rx="1" fill="#27272A" />
            <rect x="40" y="100" width="180" height="3" rx="1" fill="#27272A" />
            <rect x="40" y="110" width="220" height="3" rx="1" fill="#27272A" />
            <rect x="40" y="120" width="160" height="3" rx="1" fill="#27272A" />
            <rect x="30" y="145" width="70" height="20" rx="2" fill="#3F3F46" />
            <text x="45" y="159" fontFamily="monospace" fontSize="10" fill="#A1A1AA">run()</text>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 320 180" className={`w-full h-full ${className}`}>
            <rect width="320" height="180" fill="#E5E7EB" />
            <rect x="30" y="30" width="160" height="14" rx="2" fill="#6B7280" />
            <rect x="30" y="55" width="100" height="8" rx="2" fill="#9CA3AF" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md">
      {renderPreview()}
    </div>
  );
}
