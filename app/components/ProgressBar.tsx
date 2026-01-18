'use client';

interface ProgressBarProps {
  progress: number;
  message: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  progress,
  message,
  showPercentage = true,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Progress Info */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {message}
        </span>
        {showPercentage && (
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 relative"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-slate-500">
        <span className={progress >= 15 ? 'text-primary-500' : ''}>아웃라인</span>
        <span className={progress >= 45 ? 'text-primary-500' : ''}>콘텐츠</span>
        <span className={progress >= 70 ? 'text-primary-500' : ''}>레이아웃</span>
        <span className={progress >= 85 ? 'text-primary-500' : ''}>검증</span>
        <span className={progress >= 100 ? 'text-primary-500' : ''}>완료</span>
      </div>
    </div>
  );
}
