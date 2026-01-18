/**
 * Content Parser - 원문/참고자료에서 콘텐츠 추출
 *
 * 역할:
 * - 원문 텍스트를 섹션별로 분리
 * - 핵심 포인트 추출 (문장 단위)
 * - 문단 요약
 * - 주제/키워드 감지
 */

// ============================================
// 1. 타입 정의
// ============================================

export interface ParsedSection {
  title?: string;
  content: string;
  keyPoints: string[];
  keywords: string[];
}

export interface ParsedContent {
  sections: ParsedSection[];
  allKeyPoints: string[];
  allKeywords: string[];
  summary: string;
}

// ============================================
// 2. 문장 분리 유틸리티
// ============================================

/**
 * 텍스트를 문장 단위로 분리
 */
export function splitIntoSentences(text: string): string[] {
  // 한국어/영어 문장 종결 패턴
  const sentencePattern = /[^.!?。？！\n]+[.!?。？！]?/g;
  const matches = text.match(sentencePattern) || [];

  return matches
    .map(s => s.trim())
    .filter(s => s.length > 5); // 너무 짧은 문장 제외
}

/**
 * 텍스트를 문단 단위로 분리
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map(p => p.trim())
    .filter(p => p.length > 10);
}

/**
 * 텍스트를 줄 단위로 분리
 */
export function splitIntoLines(text: string): string[] {
  return text
    .split(/\n|\r\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

// ============================================
// 3. 핵심 포인트 추출
// ============================================

/**
 * 텍스트에서 핵심 포인트 추출
 */
export function extractKeyPoints(text: string, maxPoints: number = 5): string[] {
  const sentences = splitIntoSentences(text);
  const keyPoints: string[] = [];

  // 중요도 점수 기준
  const importanceMarkers = [
    /중요한?|핵심|주요|필수|반드시|꼭|특히|가장/,
    /\d+%|\d+억|\d+만|증가|감소|성장|하락/,
    /첫째|둘째|셋째|1\.|2\.|3\.|•|·|-/,
    /결론|요약|정리|핵심은|포인트는/,
    /전략|방향|목표|비전|미션/,
  ];

  // 문장별 점수 계산
  const scoredSentences = sentences.map(sentence => {
    let score = 0;

    // 중요도 마커 체크
    importanceMarkers.forEach(marker => {
      if (marker.test(sentence)) score += 2;
    });

    // 숫자/데이터 포함 시 가산점
    if (/\d+/.test(sentence)) score += 1;

    // 너무 긴 문장은 감점
    if (sentence.length > 100) score -= 1;

    // 적절한 길이 가산점
    if (sentence.length >= 20 && sentence.length <= 80) score += 1;

    return { sentence, score };
  });

  // 점수 순으로 정렬 후 상위 추출
  scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPoints)
    .forEach(item => {
      // 문장 정제
      let cleaned = item.sentence
        .replace(/^[-•·\d.)\s]+/, '') // 앞 번호/불릿 제거
        .replace(/\s+/g, ' ')
        .trim();

      // 너무 길면 자르기
      if (cleaned.length > 60) {
        cleaned = cleaned.substring(0, 57) + '...';
      }

      if (cleaned.length >= 5) {
        keyPoints.push(cleaned);
      }
    });

  return keyPoints;
}

/**
 * 불릿 포인트로 변환 가능한 라인 추출
 */
export function extractBulletPoints(text: string, maxPoints: number = 5): string[] {
  const lines = splitIntoLines(text);
  const bullets: string[] = [];

  // 불릿 패턴 (이미 불릿 형태인 라인 우선)
  const bulletPattern = /^[-•·▪▸►→⇒★☆✓✔]\s*|^\d+[.)]\s*|^[가-힣][.)]\s*/;

  // 불릿 형태 라인 먼저 추출
  lines.forEach(line => {
    if (bulletPattern.test(line) && bullets.length < maxPoints) {
      const cleaned = line.replace(bulletPattern, '').trim();
      if (cleaned.length >= 5 && cleaned.length <= 80) {
        bullets.push(cleaned);
      }
    }
  });

  // 부족하면 일반 문장에서 추출
  if (bullets.length < maxPoints) {
    const keyPoints = extractKeyPoints(text, maxPoints - bullets.length);
    keyPoints.forEach(point => {
      if (!bullets.includes(point)) {
        bullets.push(point);
      }
    });
  }

  return bullets.slice(0, maxPoints);
}

// ============================================
// 4. 키워드 추출
// ============================================

/**
 * 텍스트에서 키워드/주제 감지
 */
export function detectTopics(text: string, maxKeywords: number = 10): string[] {
  const keywords: Map<string, number> = new Map();

  // 명사 패턴 (한국어)
  const nounPattern = /[가-힣]{2,10}(?=은|는|이|가|을|를|의|에|로|와|과|도|만|까지)?/g;

  // 영문 단어 패턴
  const englishPattern = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|[A-Z]{2,}(?:\s+[A-Z]{2,})*/g;

  // 숫자+단위 패턴
  const numberPattern = /\d+(?:\.\d+)?(?:%|억|만|천|원|달러|건|개|명|회|년|월|일)/g;

  // 한국어 명사 추출
  const koreanMatches = text.match(nounPattern) || [];
  koreanMatches.forEach(word => {
    if (word.length >= 2 && !isStopWord(word)) {
      keywords.set(word, (keywords.get(word) || 0) + 1);
    }
  });

  // 영문 추출
  const englishMatches = text.match(englishPattern) || [];
  englishMatches.forEach(word => {
    if (word.length >= 2) {
      keywords.set(word, (keywords.get(word) || 0) + 1);
    }
  });

  // 숫자+단위 추출
  const numberMatches = text.match(numberPattern) || [];
  numberMatches.forEach(num => {
    keywords.set(num, (keywords.get(num) || 0) + 2); // 가중치
  });

  // 빈도순 정렬
  const sorted = Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return sorted;
}

/**
 * 불용어 체크
 */
function isStopWord(word: string): boolean {
  const stopWords = [
    '것', '수', '등', '때', '그', '이', '저', '우리', '여러',
    '하는', '있는', '되는', '위한', '통한', '대한', '관한',
    '정도', '이상', '이하', '경우', '때문', '통해', '위해',
  ];
  return stopWords.includes(word);
}

// ============================================
// 5. 섹션 분리
// ============================================

/**
 * 텍스트를 섹션으로 분리
 */
export function parseIntoSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  // 섹션 구분자 패턴
  const sectionPattern = /^(?:#{1,3}\s*|[IVX]+\.\s*|\d+\.\s*|[가-힣]\.\s*)?(.+)$/gm;
  const headerPattern = /^(?:#{1,3}\s+|[IVX]+\.\s+|\d+\.\s+|[가-힣]\.\s+)(.+)$/;

  const paragraphs = splitIntoParagraphs(text);
  let currentSection: ParsedSection | null = null;

  for (const para of paragraphs) {
    const isHeader = headerPattern.test(para) || para.length < 50;

    if (isHeader && para.length < 50) {
      // 새 섹션 시작
      if (currentSection && currentSection.content) {
        sections.push(currentSection);
      }
      currentSection = {
        title: para.replace(/^[\d#IVX가-힣.)\s]+/, '').trim(),
        content: '',
        keyPoints: [],
        keywords: [],
      };
    } else {
      // 콘텐츠 추가
      if (!currentSection) {
        currentSection = {
          content: '',
          keyPoints: [],
          keywords: [],
        };
      }
      currentSection.content += (currentSection.content ? '\n\n' : '') + para;
    }
  }

  // 마지막 섹션 추가
  if (currentSection && currentSection.content) {
    sections.push(currentSection);
  }

  // 섹션이 없으면 전체를 하나의 섹션으로
  if (sections.length === 0 && text.trim()) {
    sections.push({
      content: text.trim(),
      keyPoints: extractKeyPoints(text, 5),
      keywords: detectTopics(text, 5),
    });
  }

  // 각 섹션의 키포인트/키워드 추출
  sections.forEach(section => {
    if (section.keyPoints.length === 0) {
      section.keyPoints = extractKeyPoints(section.content, 5);
    }
    if (section.keywords.length === 0) {
      section.keywords = detectTopics(section.content, 5);
    }
  });

  return sections;
}

// ============================================
// 6. 요약 생성
// ============================================

/**
 * 텍스트 요약 (첫 문장들 추출)
 */
export function summarizeText(text: string, maxLength: number = 200): string {
  const sentences = splitIntoSentences(text);
  let summary = '';

  for (const sentence of sentences) {
    if (summary.length + sentence.length + 1 <= maxLength) {
      summary += (summary ? ' ' : '') + sentence;
    } else {
      break;
    }
  }

  return summary || text.substring(0, maxLength).trim() + '...';
}

/**
 * 문단 요약
 */
export function summarizeParagraph(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;

  // 첫 문장 우선
  const firstSentence = splitIntoSentences(text)[0];
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence;
  }

  // 강제 자르기
  return text.substring(0, maxLength - 3).trim() + '...';
}

// ============================================
// 7. 메인 파싱 함수
// ============================================

/**
 * 원문 전체 파싱 (메인 진입점)
 *
 * @example
 * const parsed = parseSourceContent(`
 *   # AI 트렌드 2025
 *
 *   생성형 AI가 업무 생산성을 30% 향상시킵니다.
 *   멀티모달 AI가 텍스트, 이미지, 음성을 통합 처리합니다.
 *
 *   ## 주요 기술
 *   - LLM 에이전트
 *   - RAG 시스템
 *   - 코드 생성
 * `);
 *
 * console.log(parsed.sections);
 * console.log(parsed.allKeyPoints);
 */
export function parseSourceContent(text: string): ParsedContent {
  if (!text || !text.trim()) {
    return {
      sections: [],
      allKeyPoints: [],
      allKeywords: [],
      summary: '',
    };
  }

  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .trim();

  const sections = parseIntoSections(cleanedText);

  // 전체 키포인트 합치기 (중복 제거)
  const allKeyPoints = new Set<string>();
  const allKeywords = new Set<string>();

  sections.forEach(section => {
    section.keyPoints.forEach(kp => allKeyPoints.add(kp));
    section.keywords.forEach(kw => allKeywords.add(kw));
  });

  // 추가: 불릿 포인트 직접 추출 (최대 20개)
  const bulletPoints = extractBulletPoints(cleanedText, 20);
  bulletPoints.forEach(bp => allKeyPoints.add(bp));

  // 추가: 더 많은 핵심 문장 추출 (섹션별 키포인트가 부족할 경우)
  if (allKeyPoints.size < 10) {
    const moreKeyPoints = extractKeyPoints(cleanedText, 15);
    moreKeyPoints.forEach(kp => allKeyPoints.add(kp));
  }

  return {
    sections,
    allKeyPoints: Array.from(allKeyPoints),
    allKeywords: Array.from(allKeywords),
    summary: summarizeText(cleanedText, 200),
  };
}

/**
 * 슬라이드별 콘텐츠 분배
 *
 * @param parsed 파싱된 콘텐츠
 * @param slideCount 슬라이드 수
 * @returns 슬라이드별 불릿 포인트 배열
 */
export function distributeContentToSlides(
  parsed: ParsedContent,
  slideCount: number
): string[][] {
  const result: string[][] = [];
  const allPoints = parsed.allKeyPoints;

  // 슬라이드 수에 맞게 분배
  const pointsPerSlide = Math.max(1, Math.ceil(allPoints.length / Math.max(1, slideCount - 2)));

  for (let i = 0; i < slideCount; i++) {
    const startIdx = i * pointsPerSlide;
    const endIdx = Math.min(startIdx + pointsPerSlide, allPoints.length);

    if (startIdx < allPoints.length) {
      result.push(allPoints.slice(startIdx, endIdx));
    } else {
      result.push([]);
    }
  }

  return result;
}

/**
 * 주제별로 콘텐츠 그룹화
 */
export function groupContentByTopic(parsed: ParsedContent): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  parsed.sections.forEach(section => {
    const topic = section.title || '일반';
    const existing = groups.get(topic) || [];
    groups.set(topic, [...existing, ...section.keyPoints]);
  });

  return groups;
}
