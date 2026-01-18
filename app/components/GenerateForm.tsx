'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProgressBar from './ProgressBar';
import SlidePreview, { SlideData } from './SlidePreview';
import { saveToHistory, updateHistory } from '../lib/historyStore';

// 톤 옵션
const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: '전문적, 비즈니스 발표' },
  { value: 'casual', label: 'Casual', description: '친근한, 팀 미팅' },
  { value: 'creative', label: 'Creative', description: '창의적, 마케팅' },
  { value: 'academic', label: 'Academic', description: '학술적, 연구 발표' },
  { value: 'minimal', label: 'Minimal', description: '간결한, 피칭' },
] as const;

// 슬라이드 수 옵션
const SLIDE_COUNT_OPTIONS = [5, 8, 10, 15, 20] as const;

// 화면 비율 옵션
const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9', description: '와이드스크린 (권장)', width: 1920, height: 1080 },
  { value: '4:3', label: '4:3', description: '표준 (구형 프로젝터)', width: 1024, height: 768 },
  { value: '16:10', label: '16:10', description: '와이드 (맥북)', width: 1920, height: 1200 },
  { value: 'A4', label: 'A4', description: '인쇄용 (세로)', width: 794, height: 1123 },
] as const;

// 입력 타입 자동 감지 함수
function detectInputType(content: string): 'simple' | 'detailed' {
  if (!content.trim()) return 'simple';

  // 마크다운 패턴 감지
  const markdownPatterns = [
    /^#{1,3}\s+/m,        // # 헤딩
    /^[-*]\s+.+/m,        // - 또는 * 리스트
    /^\d+\.\s+/m,         // 1. 번호 리스트
  ];

  // 긴 텍스트 기준 (100자 이상이고 줄바꿈 있음)
  const isLongContent = content.length > 100 && content.includes('\n');

  // 마크다운 패턴이 있거나 긴 텍스트면 detailed
  const hasMarkdown = markdownPatterns.some(p => p.test(content));

  return (hasMarkdown || isLongContent) ? 'detailed' : 'simple';
}

interface FormData {
  content: string;        // 통합 입력 (주제 또는 상세 내용)
  audience: string;
  tone: string;
  slideCount: number;
  customSlideCount: string;  // 직접 입력용
  aspectRatio: string;
}

interface GenerationState {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
  downloadUrl: string | null;
  fileName: string | null;
  slidesData: SlideData[] | null;
  themeColor: string;
  isEdited: boolean;
  isRegenerating: boolean;
  historyId: string | null;
}

interface GenerateFormProps {
  templateId: string;
  templateName: string;
  onGenerate?: (data: FormData) => void;
}

export default function GenerateForm({
  templateId,
  templateName,
}: GenerateFormProps) {
  const [formData, setFormData] = useState<FormData>({
    content: '',
    audience: '',
    tone: 'professional',
    slideCount: 10,
    customSlideCount: '',
    aspectRatio: '16:9',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(150, Math.min(400, textarea.scrollHeight))}px`;
    }
  }, []);

  // content 변경 시 높이 조절
  useEffect(() => {
    adjustTextareaHeight();
  }, [formData.content, adjustTextareaHeight]);


  const [generation, setGeneration] = useState<GenerationState>({
    isLoading: false,
    progress: 0,
    message: '',
    error: null,
    downloadUrl: null,
    fileName: null,
    slidesData: null,
    themeColor: '1791e8',
    isEdited: false,
    isRegenerating: false,
    historyId: null,
  });

  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 다운로드 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

  // 폼 입력 핸들러
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 슬라이드 수 선택 핸들러
  const handleSlideCountSelect = (count: number) => {
    setFormData((prev) => ({
      ...prev,
      slideCount: count,
      customSlideCount: '',
    }));
  };

  // 직접 입력 슬라이드 수 핸들러
  const handleCustomSlideCount = (value: string) => {
    const num = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      customSlideCount: value,
      slideCount: num >= 3 && num <= 30 ? num : prev.slideCount,
    }));
  };

  // 제목 추출 헬퍼 함수
  const extractTitleFromContent = (content: string): string => {
    // # 헤딩에서 제목 추출
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) return headingMatch[1];

    // 첫 줄을 제목으로 사용
    const firstLine = content.split('\n')[0].trim();
    return firstLine.slice(0, 50) || '프레젠테이션';
  };

  // PPT 생성
  const handleGenerate = async () => {
    if (!formData.content.trim()) {
      setGeneration((prev) => ({ ...prev, error: '주제 또는 내용을 입력해주세요.' }));
      return;
    }

    // 입력 타입 자동 감지
    const inputType = detectInputType(formData.content);

    // API 전송용 데이터 준비
    const apiData = {
      topic: inputType === 'simple' ? formData.content : extractTitleFromContent(formData.content),
      sourceContent: inputType === 'detailed' ? formData.content : '',
      audience: formData.audience || '일반 청중',
      tone: formData.tone,
      slideCount: formData.slideCount,
      aspectRatio: formData.aspectRatio,
      templateId,
    };

    if (generation.downloadUrl) {
      URL.revokeObjectURL(generation.downloadUrl);
    }

    setGeneration({
      isLoading: true,
      progress: 0,
      message: '아웃라인 생성 중...',
      error: null,
      downloadUrl: null,
      fileName: null,
      slidesData: null,
      themeColor: '1791e8',
      isEdited: false,
      isRegenerating: false,
      historyId: null,
    });
    setSelectedSlideIndex(0);

    const progressInterval = setInterval(() => {
      setGeneration((prev) => {
        if (prev.progress >= 90) return prev;
        const nextProgress = prev.progress + Math.random() * 15;
        let message = '아웃라인 생성 중...';
        if (nextProgress > 15) message = '콘텐츠/디자인 생성 중...';
        if (nextProgress > 45) message = 'DeckSpec 병합 중...';
        if (nextProgress > 55) message = '레이아웃 계산 중...';
        if (nextProgress > 70) message = '스타일 검증 중...';
        if (nextProgress > 85) message = 'PPT 렌더링 중...';
        return {
          ...prev,
          progress: Math.min(nextProgress, 90),
          message,
        };
      });
    }, 400);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PPT 생성에 실패했습니다.');
      }

      const data = await response.json();

      // Base64 디코딩 및 Blob 생성
      const binaryString = atob(data.fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      const downloadUrl = URL.createObjectURL(blob);

      // 히스토리에 저장
      let historyId: string | null = null;
      if (data.slidesData) {
        const savedPresentation = saveToHistory({
          title: apiData.topic,
          topic: apiData.topic,
          audience: apiData.audience,
          templateId,
          templateName,
          themeColor: data.themeColor || '1791e8',
          slidesData: data.slidesData,
          slideCount: data.slidesData.length,
          aspectRatio: apiData.aspectRatio,
        });
        historyId = savedPresentation.id;
      }

      setGeneration({
        isLoading: false,
        progress: 100,
        message: 'PPT 생성 완료!',
        error: null,
        downloadUrl,
        fileName: data.fileName,
        slidesData: data.slidesData || null,
        themeColor: data.themeColor || '1791e8',
        isEdited: false,
        isRegenerating: false,
        historyId,
      });
    } catch (error) {
      clearInterval(progressInterval);
      setGeneration((prev) => ({
        ...prev,
        isLoading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'PPT 생성에 실패했습니다.',
      }));
    }
  };

  // 슬라이드 편집 핸들러
  const handleEditSlide = (index: number, updatedSlide: SlideData) => {
    if (!generation.slidesData) return;

    const newSlidesData = [...generation.slidesData];
    newSlidesData[index] = updatedSlide;

    setGeneration((prev) => ({
      ...prev,
      slidesData: newSlidesData,
      isEdited: true,
    }));
  };

  // 슬라이드 추가 핸들러
  const handleAddSlide = (afterIndex: number, slideType: SlideData['type']) => {
    if (!generation.slidesData) return;

    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      type: slideType,
      title: getDefaultTitleForType(slideType),
      bullets: ['새로운 내용을 입력하세요'],
      subtitle: slideType === 'title' || slideType === 'sectionTitle' ? '부제목을 입력하세요' : undefined,
      keyMessage: slideType === 'closing' || slideType === 'qna' ? '메시지를 입력하세요' : undefined,
      leftContent: slideType === 'twoColumn' || slideType === 'comparison' ? ['왼쪽 내용'] : undefined,
      rightContent: slideType === 'twoColumn' || slideType === 'comparison' ? ['오른쪽 내용'] : undefined,
    };

    const newSlidesData = [...generation.slidesData];
    newSlidesData.splice(afterIndex + 1, 0, newSlide);

    setGeneration((prev) => ({
      ...prev,
      slidesData: newSlidesData,
      isEdited: true,
    }));

    // 새로 추가된 슬라이드 선택
    setSelectedSlideIndex(afterIndex + 1);
  };

  // 슬라이드 삭제 핸들러
  const handleDeleteSlide = (index: number) => {
    if (!generation.slidesData || generation.slidesData.length <= 1) return;

    const newSlidesData = [...generation.slidesData];
    newSlidesData.splice(index, 1);

    setGeneration((prev) => ({
      ...prev,
      slidesData: newSlidesData,
      isEdited: true,
    }));

    // 선택 인덱스 조정
    if (selectedSlideIndex >= newSlidesData.length) {
      setSelectedSlideIndex(newSlidesData.length - 1);
    } else if (selectedSlideIndex === index && index > 0) {
      setSelectedSlideIndex(index - 1);
    }
  };

  // 슬라이드 순서 변경 핸들러
  const handleReorderSlides = (fromIndex: number, toIndex: number) => {
    if (!generation.slidesData) return;

    const newSlidesData = [...generation.slidesData];
    const [movedSlide] = newSlidesData.splice(fromIndex, 1);
    newSlidesData.splice(toIndex, 0, movedSlide);

    setGeneration((prev) => ({
      ...prev,
      slidesData: newSlidesData,
      isEdited: true,
    }));

    // 선택 인덱스 조정
    if (selectedSlideIndex === fromIndex) {
      setSelectedSlideIndex(toIndex);
    } else if (fromIndex < selectedSlideIndex && toIndex >= selectedSlideIndex) {
      setSelectedSlideIndex(selectedSlideIndex - 1);
    } else if (fromIndex > selectedSlideIndex && toIndex <= selectedSlideIndex) {
      setSelectedSlideIndex(selectedSlideIndex + 1);
    }
  };

  // 슬라이드 타입별 기본 제목
  const getDefaultTitleForType = (type: SlideData['type']): string => {
    const titles: Record<SlideData['type'], string> = {
      title: '프레젠테이션 제목',
      sectionTitle: '섹션 제목',
      content: '콘텐츠 제목',
      twoColumn: '비교 분석',
      agenda: '목차',
      chart: '차트 분석',
      comparison: '장단점 비교',
      closing: '감사합니다',
      qna: 'Q&A',
      summary: '요약',
    };
    return titles[type];
  };

  // 편집 내용 저장 (PPT 재생성)
  const handleSaveEdits = async () => {
    if (!generation.slidesData || !generation.isEdited) return;

    setGeneration((prev) => ({ ...prev, isRegenerating: true }));

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slidesData: generation.slidesData,
          templateId,
          topic: extractTitleFromContent(formData.content),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PPT 재생성에 실패했습니다.');
      }

      const data = await response.json();

      // 기존 URL 정리
      if (generation.downloadUrl) {
        URL.revokeObjectURL(generation.downloadUrl);
      }

      // 새 Blob 생성
      const binaryString = atob(data.fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      const downloadUrl = URL.createObjectURL(blob);

      // 히스토리 업데이트
      if (generation.historyId && generation.slidesData) {
        updateHistory(generation.historyId, {
          slidesData: generation.slidesData,
          slideCount: generation.slidesData.length,
        });
      }

      setGeneration((prev) => ({
        ...prev,
        downloadUrl,
        fileName: data.fileName,
        isEdited: false,
        isRegenerating: false,
      }));
    } catch (error) {
      setGeneration((prev) => ({
        ...prev,
        isRegenerating: false,
        error: error instanceof Error ? error.message : 'PPT 재생성에 실패했습니다.',
      }));
    }
  };

  // PPTX 다운로드 핸들러
  const handleDownload = () => {
    if (generation.downloadUrl && generation.fileName) {
      const a = document.createElement('a');
      a.href = generation.downloadUrl;
      a.download = generation.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setShowDownloadMenu(false);
  };

  // PDF 다운로드 핸들러
  const handleDownloadPdf = async () => {
    if (!generation.slidesData) return;

    setIsPdfGenerating(true);
    setShowDownloadMenu(false);

    try {
      // 동적으로 jspdf와 html2canvas 임포트
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720],
      });

      // 임시 컨테이너 생성
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '1280px';
      container.style.height = '720px';
      document.body.appendChild(container);

      for (let i = 0; i < generation.slidesData.length; i++) {
        const slide = generation.slidesData[i];

        // 슬라이드 HTML 생성
        container.innerHTML = generateSlideHtml(slide, generation.themeColor);

        // html2canvas로 캡처
        const canvas = await html2canvas(container, {
          width: 1280,
          height: 720,
          scale: 2,
          backgroundColor: null,
        });

        if (i > 0) {
          pdf.addPage([1280, 720], 'landscape');
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
      }

      document.body.removeChild(container);

      // PDF 다운로드
      const pdfFileName = generation.fileName?.replace('.pptx', '.pdf') || 'presentation.pdf';
      pdf.save(pdfFileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      setGeneration((prev) => ({
        ...prev,
        error: 'PDF 생성에 실패했습니다. PPTX로 다운로드해주세요.',
      }));
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // 슬라이드 HTML 생성 함수
  const generateSlideHtml = (slide: SlideData, themeColor: string): string => {
    const isFullColorBg = ['title', 'sectionTitle', 'closing', 'qna'].includes(slide.type);
    const bgColor = isFullColorBg ? `#${themeColor}` : '#ffffff';
    const textColor = isFullColorBg ? '#ffffff' : '#1e293b';

    let content = '';

    if (isFullColorBg) {
      content = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 80px;">
          <h1 style="font-size: 56px; font-weight: bold; margin-bottom: 24px; text-align: center;">${slide.title}</h1>
          ${slide.subtitle ? `<p style="font-size: 28px; opacity: 0.9; text-align: center;">${slide.subtitle}</p>` : ''}
          ${slide.keyMessage ? `<p style="font-size: 24px; opacity: 0.85; text-align: center; margin-top: 20px;">${slide.keyMessage}</p>` : ''}
        </div>
      `;
    } else {
      content = `
        <div style="padding: 60px;">
          <h2 style="font-size: 40px; font-weight: bold; margin-bottom: 40px; padding-bottom: 16px; border-bottom: 4px solid #${themeColor}; color: #${themeColor};">${slide.title}</h2>
          ${slide.bullets ? `
            <ul style="font-size: 24px; line-height: 2; list-style: none; padding: 0;">
              ${slide.bullets.map(b => `
                <li style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px;">
                  <span style="width: 12px; height: 12px; background: #${themeColor}; border-radius: 50%; flex-shrink: 0; margin-top: 10px;"></span>
                  <span>${b}</span>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    }

    return `
      <div style="width: 1280px; height: 720px; background-color: ${bgColor}; color: ${textColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        ${content}
      </div>
    `;
  };

  // 리셋
  const handleReset = () => {
    if (generation.downloadUrl) {
      URL.revokeObjectURL(generation.downloadUrl);
    }
    setGeneration({
      isLoading: false,
      progress: 0,
      message: '',
      error: null,
      downloadUrl: null,
      fileName: null,
      slidesData: null,
      themeColor: '1791e8',
      isEdited: false,
      isRegenerating: false,
      historyId: null,
    });
    setSelectedSlideIndex(0);
  };

  // 생성 완료 후 미리보기 화면
  if (generation.slidesData && generation.slidesData.length > 0) {
    return (
      <div className="space-y-6">
        {/* 성공 메시지 */}
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-green-700 dark:text-green-400">
              PPT 생성 완료! 슬라이드를 미리보고 편집할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 편집 안내 */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-blue-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {generation.isEdited
                ? '수정된 내용이 있습니다. "편집 저장"을 눌러 PPT에 반영하세요.'
                : '텍스트를 클릭하여 직접 편집하세요. + 버튼으로 항목을 추가할 수 있습니다.'}
            </p>
          </div>
        </div>

        {/* 슬라이드 미리보기 */}
        <div className="h-[450px]">
          <SlidePreview
            slides={generation.slidesData}
            selectedIndex={selectedSlideIndex}
            onSelectSlide={setSelectedSlideIndex}
            onEditSlide={handleEditSlide}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onReorderSlides={handleReorderSlides}
            themeColor={generation.themeColor}
            aspectRatio={formData.aspectRatio}
          />
        </div>

        {/* 에러 메시지 */}
        {generation.error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              {generation.error}
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          {generation.isEdited ? (
            // 편집된 경우: 편집 저장 버튼을 주요 버튼으로
            <>
              <button
                onClick={handleSaveEdits}
                disabled={generation.isRegenerating}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {generation.isRegenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    저장 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    편집 저장 (PPT 적용)
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                disabled={generation.isRegenerating}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                다운로드
              </button>
            </>
          ) : (
            // 편집 안 된 경우: 다운로드 버튼을 주요 버튼으로
            <div className="relative flex-1" ref={downloadMenuRef}>
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={generation.isRegenerating || isPdfGenerating}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isPdfGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    PDF 생성 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    다운로드
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {/* 다운로드 메뉴 */}
              {showDownloadMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-10">
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                  >
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">PPTX 다운로드</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">파워포인트에서 편집 가능</div>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 border-t border-slate-100 dark:border-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">PDF 다운로드</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">바로 공유/인쇄 가능</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={generation.isRegenerating}
            className="btn-secondary"
          >
            새로 만들기
          </button>
        </div>
      </div>
    );
  }

  // 기본 폼 화면
  return (
    <div className="space-y-5">
      {/* 1. 통합 입력 영역 (맨 위) */}
      <div>
        <textarea
          ref={textareaRef}
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          placeholder="주제나 내용을 입력하세요... 예: AI 기술 트렌드 2025"
          className="input-field resize-none text-sm leading-relaxed"
          style={{ minHeight: '120px', maxHeight: '400px' }}
          disabled={generation.isLoading}
        />
        {formData.content.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {formData.content.length}자 입력됨
          </p>
        )}
      </div>

      {/* 2. 청중 */}
      <div>
        <label htmlFor="audience" className="input-label">
          청중
        </label>
        <input
          type="text"
          id="audience"
          name="audience"
          value={formData.audience}
          onChange={handleInputChange}
          placeholder="예: 기업 임원, 마케팅 팀, 대학생"
          className="input-field"
          disabled={generation.isLoading}
        />
      </div>

      {/* 3. 톤/스타일 + 슬라이드 수 (한 줄) */}
      <div className="grid grid-cols-2 gap-4">
        {/* 톤/스타일 드롭다운 */}
        <div>
          <label htmlFor="tone" className="input-label">
            톤/스타일
          </label>
          <select
            id="tone"
            name="tone"
            value={formData.tone}
            onChange={handleInputChange}
            className="input-field"
            disabled={generation.isLoading}
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* 슬라이드 수 */}
        <div>
          <label htmlFor="slideCount" className="input-label">
            슬라이드 수
          </label>
          <div className="flex items-center gap-2">
            {SLIDE_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => handleSlideCountSelect(count)}
                disabled={generation.isLoading}
                className={`flex-1 h-[42px] rounded-lg text-sm font-medium transition-all border ${
                  formData.slideCount === count && !formData.customSlideCount
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                } ${generation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. 화면 비율 카드 */}
      <div>
        <label className="input-label">
          화면 비율
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, aspectRatio: option.value }))}
              disabled={generation.isLoading}
              className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                formData.aspectRatio === option.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              } ${generation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* 비율 미리보기 */}
              <div
                className={`mb-2 rounded ${
                  formData.aspectRatio === option.value
                    ? 'bg-primary-400 dark:bg-primary-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
                style={{
                  width: option.value === 'A4' ? '24px' : '40px',
                  height: option.value === '16:9' ? '22px' : option.value === '4:3' ? '30px' : option.value === '16:10' ? '25px' : '34px',
                }}
              />
              <span className={`text-sm font-medium ${
                formData.aspectRatio === option.value
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {option.label}
              </span>
              <span className={`text-xs ${
                formData.aspectRatio === option.value
                  ? 'text-primary-500 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {option.description}
              </span>
              {formData.aspectRatio === option.value && (
                <div className="absolute top-1 right-1">
                  <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {generation.error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            {generation.error}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {generation.isLoading && (
        <ProgressBar progress={generation.progress} message={generation.message} />
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generation.isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
      >
        {generation.isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            생성 중...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            PPT 생성하기
          </>
        )}
      </button>
    </div>
  );
}
