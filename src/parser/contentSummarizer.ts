/**
 * 콘텐츠 요약기 (Enhanced Version)
 * 원문 텍스트를 PPT에 적합한 핵심 포인트로 추출
 *
 * 지원 기능:
 * - 마크다운 헤더(#, ##, ###) 인식 → 섹션 분리
 * - 불릿(-, *, •) 인식 → 그대로 사용
 * - 숫자 리스트 인식
 * - **강조** 텍스트 인식 → 키 메시지로 추출
 * - 문단 구분 → 슬라이드 분리 기준
 */

// ============================================
// 타입 정의
// ============================================

export interface SummarizeOptions {
  slideCount?: number;
  maxBulletsPerSlide?: number;
  topic?: string;
  autoSlideCount?: boolean; // 콘텐츠 기반 자동 슬라이드 수 결정
}

export interface ParsedSection {
  title: string;
  level: number; // 1 = #, 2 = ##, 3 = ###
  content: ParsedContent;
  keyMessage?: string;
}

export interface ParsedContent {
  bullets: BulletItem[];
  paragraphs: string[];
  emphasis: string[]; // **강조** 텍스트들
  stats: StatItem[]; // 숫자/통계 데이터
  quotes: QuoteItem[]; // 인용문
  hasComparison: boolean;
  hasTimeline: boolean;
  hasProcess: boolean;
}

export interface BulletItem {
  text: string;
  level: number; // 들여쓰기 레벨 (0, 1, 2)
  isNumbered: boolean;
  number?: number;
}

export interface StatItem {
  value: string;
  unit?: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface QuoteItem {
  text: string;
  author?: string;
}

export interface SummarizedContent {
  title: string;
  subtitle?: string;
  sections: ParsedSection[];
  keyPoints: string[];
  agendaItems: string[];
  summaryPoints: string[];
  totalSlideCount: number;
}

// ============================================
// 메인 파싱 함수
// ============================================

/**
 * 원문을 슬라이드용 콘텐츠로 요약
 */
export function summarizeContent(rawText: string, options: SummarizeOptions = {}): SummarizedContent {
  const { maxBulletsPerSlide = 5 } = options;

  // 1. 텍스트 전처리
  const cleanedText = preprocessText(rawText);

  // 2. 마크다운 구조 파싱
  const { title, subtitle, sections } = parseMarkdownStructure(cleanedText);

  // 3. 각 섹션의 콘텐츠 파싱
  const parsedSections = sections.map(section => ({
    ...section,
    content: parseContentDetails(section.content as unknown as string),
    keyMessage: extractKeyMessage(section.content as unknown as string),
  }));

  // 4. 전체 키포인트 추출
  const keyPoints = extractGlobalKeyPoints(parsedSections, maxBulletsPerSlide * 3);

  // 5. 목차 생성
  const agendaItems = parsedSections
    .filter(s => s.level <= 2)
    .map(s => s.title);

  // 6. 요약 포인트 생성
  const summaryPoints = generateSummaryPoints(parsedSections);

  // 7. 슬라이드 수 계산
  const totalSlideCount = calculateSlideCount(parsedSections, options);

  return {
    title: title || options.topic || '프레젠테이션',
    subtitle,
    sections: parsedSections,
    keyPoints,
    agendaItems,
    summaryPoints,
    totalSlideCount,
  };
}

// ============================================
// 전처리 함수
// ============================================

/**
 * 텍스트 전처리
 */
function preprocessText(text: string): string {
  return text
    // 특수 따옴표 정규화
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Windows 줄바꿈 정규화
    .replace(/\r\n/g, '\n')
    // 탭을 공백으로
    .replace(/\t/g, '  ')
    // 3개 이상 연속 빈 줄을 2개로
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================
// 마크다운 파싱
// ============================================

interface MarkdownStructure {
  title: string;
  subtitle?: string;
  sections: Array<{
    title: string;
    level: number;
    content: string;
  }>;
}

/**
 * 마크다운 구조 파싱
 */
function parseMarkdownStructure(text: string): MarkdownStructure {
  const lines = text.split('\n');
  const result: MarkdownStructure = {
    title: '',
    sections: [],
  };

  let currentSection: { title: string; level: number; content: string[] } | null = null;
  let contentBeforeFirstHeader: string[] = [];
  let foundFirstHeader = false;

  for (const line of lines) {
    // 헤더 매칭 (# ~ ###)
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headerMatch) {
      const level = headerMatch[1].length;
      const headerText = headerMatch[2].trim();

      // 이전 섹션 저장
      if (currentSection) {
        result.sections.push({
          ...currentSection,
          content: currentSection.content.join('\n'),
        });
      }

      // 첫 번째 # 헤더를 제목으로
      if (!foundFirstHeader && level === 1) {
        result.title = headerText;
        foundFirstHeader = true;
        currentSection = null;
      } else {
        // 새 섹션 시작
        currentSection = {
          title: headerText,
          level,
          content: [],
        };
      }
    } else {
      // 헤더가 아닌 라인은 콘텐츠로
      if (currentSection) {
        currentSection.content.push(line);
      } else if (!foundFirstHeader) {
        contentBeforeFirstHeader.push(line);
      }
    }
  }

  // 마지막 섹션 저장
  if (currentSection) {
    result.sections.push({
      ...currentSection,
      content: currentSection.content.join('\n'),
    });
  }

  // 제목이 없으면 첫 줄에서 추출
  if (!result.title && contentBeforeFirstHeader.length > 0) {
    const firstNonEmpty = contentBeforeFirstHeader.find(l => l.trim());
    if (firstNonEmpty) {
      result.title = firstNonEmpty.trim();
    }
  }

  // 섹션이 없으면 전체를 하나의 섹션으로
  if (result.sections.length === 0) {
    const allContent = contentBeforeFirstHeader.join('\n').trim();
    if (allContent) {
      // 빈 줄로 분리하여 여러 섹션 생성
      const paragraphs = allContent.split(/\n\n+/).filter(p => p.trim());
      paragraphs.forEach((para, idx) => {
        result.sections.push({
          title: `섹션 ${idx + 1}`,
          level: 2,
          content: para,
        });
      });
    }
  }

  return result;
}

// ============================================
// 콘텐츠 상세 파싱
// ============================================

/**
 * 섹션 콘텐츠의 상세 구조 파싱
 */
function parseContentDetails(content: string): ParsedContent {
  const bullets = parseBullets(content);
  const paragraphs = parseParagraphs(content);
  const emphasis = parseEmphasis(content);
  const stats = parseStats(content);
  const quotes = parseQuotes(content);

  return {
    bullets,
    paragraphs,
    emphasis,
    stats,
    quotes,
    hasComparison: detectComparison(content),
    hasTimeline: detectTimeline(content),
    hasProcess: detectProcess(content),
  };
}

/**
 * 불릿 리스트 파싱
 */
function parseBullets(content: string): BulletItem[] {
  const bullets: BulletItem[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // 불릿 리스트 (-, *, •)
    const bulletMatch = line.match(/^(\s*)([-*•])\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const level = Math.floor(indent / 2);
      bullets.push({
        text: cleanBulletText(bulletMatch[3]),
        level: Math.min(level, 2),
        isNumbered: false,
      });
      continue;
    }

    // 숫자 리스트 (1. 2. 3.)
    const numberedMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      const indent = numberedMatch[1].length;
      const level = Math.floor(indent / 2);
      bullets.push({
        text: cleanBulletText(numberedMatch[3]),
        level: Math.min(level, 2),
        isNumbered: true,
        number: parseInt(numberedMatch[2]),
      });
    }
  }

  return bullets;
}

/**
 * 불릿 텍스트 정리
 */
function cleanBulletText(text: string): string {
  return text
    // 마크다운 강조 제거 (텍스트는 유지)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // 링크 텍스트만 유지
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .trim();
}

/**
 * 문단 파싱 (불릿이 아닌 텍스트)
 */
function parseParagraphs(content: string): string[] {
  const paragraphs: string[] = [];
  const lines = content.split('\n');
  let currentPara: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 불릿이나 숫자 리스트가 아닌 경우
    if (trimmed && !trimmed.match(/^[-*•]\s/) && !trimmed.match(/^\d+[.)]\s/)) {
      currentPara.push(trimmed);
    } else if (currentPara.length > 0) {
      paragraphs.push(currentPara.join(' '));
      currentPara = [];
    }
  }

  if (currentPara.length > 0) {
    paragraphs.push(currentPara.join(' '));
  }

  return paragraphs.filter(p => p.length > 10);
}

/**
 * **강조** 텍스트 추출
 */
function parseEmphasis(content: string): string[] {
  const emphasis: string[] = [];

  // **bold** 패턴
  const boldRegex = /\*\*(.+?)\*\*/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(content)) !== null) {
    emphasis.push(boldMatch[1]);
  }

  // __bold__ 패턴
  const underscoreRegex = /__(.+?)__/g;
  let underscoreMatch;
  while ((underscoreMatch = underscoreRegex.exec(content)) !== null) {
    emphasis.push(underscoreMatch[1]);
  }

  return Array.from(new Set(emphasis)); // 중복 제거
}

/**
 * 숫자/통계 추출
 */
function parseStats(content: string): StatItem[] {
  const stats: StatItem[] = [];

  // 퍼센트 패턴
  const percentRegex = /(\d+(?:\.\d+)?)\s*%\s*([가-힣a-zA-Z]*)/g;
  let percentMatch;
  while ((percentMatch = percentRegex.exec(content)) !== null) {
    const context = extractStatContext(content, percentMatch.index || 0);
    stats.push({
      value: percentMatch[1],
      unit: '%',
      description: context || percentMatch[2] || '증가',
      trend: detectTrend(context),
    });
  }

  // 숫자 + 단위 패턴 (배, 원, 명, 개 등)
  const numberUnitRegex = /(\d+(?:,\d+)*(?:\.\d+)?)\s*(배|원|억|만|천|명|개|건|회|년)/g;
  let numberMatch;
  while ((numberMatch = numberUnitRegex.exec(content)) !== null) {
    const context = extractStatContext(content, numberMatch.index || 0);
    stats.push({
      value: numberMatch[1],
      unit: numberMatch[2],
      description: context,
      trend: detectTrend(context),
    });
  }

  return stats.slice(0, 5); // 최대 5개
}

/**
 * 통계 주변 문맥 추출
 */
function extractStatContext(content: string, position: number): string {
  const start = Math.max(0, position - 50);
  const end = Math.min(content.length, position + 50);
  const context = content.slice(start, end);

  // 문장 경계 찾기
  const sentenceMatch = context.match(/[^.!?]*[.!?]/);
  return sentenceMatch ? sentenceMatch[0].trim() : context.trim();
}

/**
 * 트렌드 감지
 */
function detectTrend(text: string): 'up' | 'down' | 'neutral' {
  if (/증가|상승|성장|향상|개선/.test(text)) return 'up';
  if (/감소|하락|축소|저하|악화/.test(text)) return 'down';
  return 'neutral';
}

/**
 * 인용문 추출
 */
function parseQuotes(content: string): QuoteItem[] {
  const quotes: QuoteItem[] = [];

  // "인용문" 패턴
  const quoteRegex = /"([^"]{20,})"(?:\s*[-—]\s*(.+))?/g;
  let quoteMatch;
  while ((quoteMatch = quoteRegex.exec(content)) !== null) {
    quotes.push({
      text: quoteMatch[1],
      author: quoteMatch[2],
    });
  }

  // > blockquote 패턴
  const blockquoteRegex = /^>\s*(.+)$/gm;
  let blockMatch;
  while ((blockMatch = blockquoteRegex.exec(content)) !== null) {
    if (blockMatch[1].length > 20) {
      quotes.push({ text: blockMatch[1] });
    }
  }

  return quotes;
}

// ============================================
// 콘텐츠 특성 감지
// ============================================

/**
 * 비교 콘텐츠 감지
 */
function detectComparison(content: string): boolean {
  const comparisonKeywords = [
    'vs', 'VS', '비교', '대비', '차이',
    '장점', '단점', '장단점',
    '전', '후', '이전', '이후',
    'Before', 'After',
    '과거', '현재', '미래',
  ];
  return comparisonKeywords.some(kw => content.includes(kw));
}

/**
 * 타임라인 콘텐츠 감지
 */
function detectTimeline(content: string): boolean {
  // 연도 패턴
  if (/\b(19|20)\d{2}년?/.test(content)) return true;

  // 단계 패턴
  if (/(1단계|2단계|Phase\s*\d|Step\s*\d)/i.test(content)) return true;

  // 시간 순서 키워드
  const timelineKeywords = ['먼저', '다음', '그 후', '마지막으로', '최종적으로'];
  return timelineKeywords.filter(kw => content.includes(kw)).length >= 2;
}

/**
 * 프로세스 콘텐츠 감지
 */
function detectProcess(content: string): boolean {
  const processKeywords = [
    '단계', '과정', '절차', '프로세스', 'flow',
    '→', '->', '➜', '➡',
  ];
  return processKeywords.some(kw => content.includes(kw));
}

// ============================================
// 키 메시지 추출
// ============================================

/**
 * 섹션에서 키 메시지 추출
 */
function extractKeyMessage(content: string): string | undefined {
  // 1. 강조 텍스트 우선
  const emphasis = parseEmphasis(content);
  if (emphasis.length > 0) {
    return emphasis[0];
  }

  // 2. 짧고 임팩트 있는 문장
  const sentences = content
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 15 && s.length <= 80);

  if (sentences.length > 0) {
    // 숫자가 포함된 문장 우선
    const withNumbers = sentences.find(s => /\d+/.test(s));
    if (withNumbers) return withNumbers;

    // 키워드가 포함된 문장
    const keywords = ['핵심', '중요', '결론', '결과', '효과'];
    const withKeyword = sentences.find(s => keywords.some(kw => s.includes(kw)));
    if (withKeyword) return withKeyword;

    return sentences[0];
  }

  return undefined;
}

/**
 * 전체 문서에서 키포인트 추출
 */
function extractGlobalKeyPoints(sections: ParsedSection[], maxCount: number): string[] {
  const allPoints: Array<{ text: string; score: number }> = [];

  for (const section of sections) {
    // 불릿에서 추출
    for (const bullet of section.content.bullets) {
      allPoints.push({
        text: bullet.text,
        score: calculateImportanceScore(bullet.text),
      });
    }

    // 문단에서 문장 추출
    for (const para of section.content.paragraphs) {
      const sentences = para.split(/[.!?]\s+/).filter(s => s.length > 15);
      for (const sentence of sentences) {
        allPoints.push({
          text: sentence.trim(),
          score: calculateImportanceScore(sentence),
        });
      }
    }

    // 강조 텍스트 (높은 점수)
    for (const emp of section.content.emphasis) {
      allPoints.push({
        text: emp,
        score: calculateImportanceScore(emp) + 5,
      });
    }
  }

  // 점수순 정렬 및 중복 제거
  allPoints.sort((a, b) => b.score - a.score);

  const selected: string[] = [];
  const seen = new Set<string>();

  for (const item of allPoints) {
    const normalized = item.text.toLowerCase().trim();
    if (!seen.has(normalized) && selected.length < maxCount) {
      selected.push(item.text);
      seen.add(normalized);
    }
  }

  return selected;
}

/**
 * 문장 중요도 점수 계산
 */
function calculateImportanceScore(sentence: string): number {
  let score = 0;

  // 숫자 포함 (통계, 데이터)
  if (/\d+/.test(sentence)) score += 3;

  // 퍼센트 포함
  if (/%/.test(sentence)) score += 3;

  // 금액 포함
  if (/억|만원|천원/.test(sentence)) score += 2;

  // 중요 키워드
  const highKeywords = ['핵심', '중요', '결론', '결과', '효과', '성과', '혁신'];
  for (const kw of highKeywords) {
    if (sentence.includes(kw)) score += 3;
  }

  // 일반 키워드
  const normalKeywords = [
    '전략', '목표', '성장', '개선', '증가', '감소',
    'AI', '디지털', '데이터', '기술', '트렌드',
  ];
  for (const kw of normalKeywords) {
    if (sentence.includes(kw)) score += 1;
  }

  // 적절한 길이 (30-100자)
  if (sentence.length >= 30 && sentence.length <= 100) {
    score += 2;
  } else if (sentence.length >= 15 && sentence.length <= 120) {
    score += 1;
  }

  return score;
}

// ============================================
// 요약 및 목차 생성
// ============================================

/**
 * 요약 포인트 생성
 */
function generateSummaryPoints(sections: ParsedSection[]): string[] {
  const summaryPoints: string[] = [];

  for (const section of sections) {
    // 키 메시지가 있으면 추가
    if (section.keyMessage) {
      summaryPoints.push(section.keyMessage);
      continue;
    }

    // 첫 번째 불릿 추가
    if (section.content.bullets.length > 0) {
      summaryPoints.push(section.content.bullets[0].text);
      continue;
    }

    // 강조 텍스트 추가
    if (section.content.emphasis.length > 0) {
      summaryPoints.push(section.content.emphasis[0]);
    }
  }

  // 최대 5개
  return summaryPoints.slice(0, 5);
}

/**
 * 필요 슬라이드 수 계산
 */
function calculateSlideCount(sections: ParsedSection[], options: SummarizeOptions): number {
  if (options.slideCount && !options.autoSlideCount) {
    return options.slideCount;
  }

  const maxBullets = options.maxBulletsPerSlide || 5;

  // 기본: 타이틀(1) + 목차(1) + 콘텐츠 + 요약(1) + 클로징(1)
  let contentSlides = 0;

  for (const section of sections) {
    const bulletCount = section.content.bullets.length;
    const paraCount = section.content.paragraphs.length;
    const totalItems = bulletCount + paraCount;

    if (totalItems === 0) {
      contentSlides += 1;
    } else {
      contentSlides += Math.ceil(totalItems / maxBullets);
    }

    // 특수 슬라이드
    if (section.content.quotes.length > 0) contentSlides += 1;
    if (section.content.stats.length >= 3) contentSlides += 1;
  }

  // 최소 4장, 최대 15장
  const total = Math.min(Math.max(contentSlides + 4, 4), 15);
  return options.slideCount ? Math.min(total, options.slideCount) : total;
}

// ============================================
// 유틸리티 및 레거시 지원
// ============================================

/**
 * 주제 기반 기본 콘텐츠 생성 (원문이 없을 때)
 */
export function generateDefaultContent(topic: string, slideCount: number): string[] {
  const contentSlides = slideCount - 2;
  const defaultPoints: string[] = [];

  const templates = [
    `${topic}의 현황과 배경을 살펴봅니다.`,
    `${topic}의 핵심 특징과 장점을 분석합니다.`,
    `${topic} 도입의 기대 효과를 검토합니다.`,
    `${topic} 관련 시장 동향을 파악합니다.`,
    `${topic}의 성공 사례를 소개합니다.`,
    `${topic} 구현을 위한 전략을 제시합니다.`,
    `${topic}의 향후 발전 방향을 전망합니다.`,
    `${topic} 도입 시 고려사항을 정리합니다.`,
  ];

  const pointsNeeded = contentSlides * 4;
  for (let i = 0; i < pointsNeeded; i++) {
    defaultPoints.push(templates[i % templates.length]);
  }

  return defaultPoints;
}

/**
 * 레거시 호환: 간단한 요약 반환
 */
export function summarizeContentLegacy(
  rawText: string,
  options: { slideCount: number; maxBulletsPerSlide?: number; topic?: string }
): { sections: string[][]; keyPoints: string[] } {
  const result = summarizeContent(rawText, options);

  // 섹션을 불릿 배열로 변환
  const sections = result.sections.map(section => {
    if (section.content.bullets.length > 0) {
      return section.content.bullets.map(b => b.text);
    }
    return section.content.paragraphs.slice(0, options.maxBulletsPerSlide || 5);
  });

  return {
    sections,
    keyPoints: result.keyPoints,
  };
}
