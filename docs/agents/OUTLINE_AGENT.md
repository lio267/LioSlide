# OUTLINE_AGENT.md - 아웃라인 에이전트 스킬

> **역할**: 프레젠테이션의 전체 구조와 흐름을 설계합니다.
>
> **레이어**: Spec Layer (좌표/크기 결정 금지)

---

## 1. 역할 정의

### 담당 업무
- 슬라이드 순서 및 개수 결정
- 각 슬라이드의 타입 선정
- 핵심 메시지(Key Message) 작성
- 콘텐츠 힌트 제공 (상세 콘텐츠는 Content Agent가 작성)
- 섹션 구조 설계

### 담당하지 않는 업무
- ❌ 상세 텍스트 작성 (Content Agent 담당)
- ❌ 레이아웃/색상/폰트 결정 (Design Agent 담당)
- ❌ 좌표/크기 계산 (Layout Engine 담당)
- ❌ 최종 품질 검토 (Review Agent 담당)

---

## 2. 입력 스키마

```typescript
interface OutlineAgentInput {
  userInput: {
    topic: string;           // 프레젠테이션 주제
    tone: PresentationTone;  // 톤/스타일
    audience: string;        // 대상 청중
    slideCount: number;      // 원하는 슬라이드 수
    sourceContent?: string;  // 원문/소스 자료
    additionalInstructions?: string;  // 추가 지시사항
  };
  theme: Theme;  // 참조용 (수정 불가)
}

type PresentationTone =
  | 'professional'  // 전문적
  | 'casual'        // 캐주얼
  | 'academic'      // 학술적
  | 'creative'      // 창의적
  | 'minimal'       // 미니멀
  | 'energetic'     // 활기찬
  | 'luxury';       // 고급스러운
```

---

## 3. 출력 스키마

```typescript
interface OutlineAgentOutput {
  outline: SlideOutline[];
  totalSlides: number;
  sections: SectionInfo[];
  thinkingLog?: string;  // MCP Sequential Thinking 로그
}

interface SlideOutline {
  order: number;              // 1부터 시작
  type: SlideType;            // 슬라이드 타입
  title: string;              // 제목 (10-20자 권장)
  keyMessage: string;         // 핵심 메시지 (한 문장)
  contentHints: string[];     // 콘텐츠 힌트 (3-5개)
  estimatedDensity: 'sparse' | 'normal' | 'dense';
}

interface SectionInfo {
  name: string;       // 섹션 이름
  startIndex: number; // 시작 슬라이드 인덱스 (0-based)
  endIndex: number;   // 종료 슬라이드 인덱스 (0-based)
}
```

---

## 4. 슬라이드 타입 선정 가이드

### 4.1 필수 슬라이드

| 순서 | 타입 | 용도 |
|------|------|------|
| 첫 번째 | `title` | 표지 |
| 두 번째 | `agenda` | 목차 (5장 이상일 때) |
| 마지막 | `closing` 또는 `qna` | 마무리 |

### 4.2 타입별 사용 조건

```
title         → 첫 슬라이드에만 사용
sectionTitle  → 3개 이상 섹션이 있을 때 섹션 시작에 사용
agenda        → 슬라이드 5장 이상일 때 사용
content       → 기본 콘텐츠 슬라이드
twoColumn     → 비교/대조 또는 텍스트+이미지 조합
threeColumn   → 3가지 항목 나열
comparison    → 명시적 비교 (A vs B)
chart         → 데이터 시각화 필요 시
imageHero     → 이미지가 핵심 메시지인 경우
quote         → 인용문 강조
timeline      → 시간 순서 표현
process       → 단계별 프로세스
summary       → 핵심 요약 (발표 후반부)
closing       → 마무리 슬라이드
qna           → Q&A 세션 안내
```

---

## 5. 핵심 메시지 작성 규칙

### 5.1 형식
- **한 문장**으로 작성
- 청중이 **기억해야 할 핵심**만 담기
- 20-40자 이내 권장

### 5.2 예시

```
✅ 좋은 예:
- "AI는 더 이상 선택이 아닌 필수입니다"
- "3단계 프로세스로 30% 효율 향상"
- "고객 만족도 95% 달성의 비결"

❌ 나쁜 예:
- "AI에 대해 알아봅시다" (너무 모호)
- "첫 번째로 시장 현황을 살펴보고..." (문장이 아님)
- "이 슬라이드에서는..." (메타 설명)
```

---

## 6. 콘텐츠 힌트 작성 규칙

### 6.1 목적
Content Agent에게 **무엇을 작성해야 하는지** 알려주는 역할

### 6.2 형식
- 3-5개의 짧은 문구
- 각 항목은 불릿 포인트로 변환될 수 있어야 함
- 구체적 데이터/수치 포함 권장

### 6.3 예시

```typescript
// 슬라이드: "AI 시장 현황"
contentHints: [
  "글로벌 AI 시장 5,000억 달러 규모",
  "연평균 성장률 37%",
  "Fortune 500 기업 90% AI 도입",
]

// 슬라이드: "도입 전략"
contentHints: [
  "1단계: 파일럿 프로젝트",
  "2단계: 성공 사례 확대",
  "3단계: 전사 적용",
]
```

---

## 7. 밀도 추정 가이드

| 밀도 | 조건 | 콘텐츠 힌트 수 |
|------|------|---------------|
| `sparse` | 제목/강조 슬라이드 | 0-2개 |
| `normal` | 일반 콘텐츠 | 3-4개 |
| `dense` | 데이터/상세 설명 | 5개 |

---

## 8. MCP Sequential Thinking 활용

### 8.1 사용 시점
- 복잡한 주제 분석 시
- 논리적 흐름 설계 시
- 청중 분석 시

### 8.2 사고 단계

```typescript
const THINKING_STEPS = [
  {
    name: 'extractKeyPoints',
    description: '원문에서 핵심 포인트 추출'
  },
  {
    name: 'analyzeAudience',
    description: '청중 분석 및 메시지 레벨 결정'
  },
  {
    name: 'designFlow',
    description: '논리적 흐름 설계 (서론-본론-결론)'
  },
  {
    name: 'assignSlideTypes',
    description: '각 포인트에 적합한 슬라이드 타입 배정'
  },
  {
    name: 'estimateDensity',
    description: '콘텐츠 밀도 추정'
  }
];
```

---

## 9. 출력 예시

```json
{
  "success": true,
  "data": {
    "outline": [
      {
        "order": 1,
        "type": "title",
        "title": "AI 기술 트렌드 2025",
        "keyMessage": "기업 경쟁력을 위한 AI 전략",
        "contentHints": ["기업 임원을 위한 AI 인사이트"],
        "estimatedDensity": "sparse"
      },
      {
        "order": 2,
        "type": "agenda",
        "title": "오늘의 핵심 아젠다",
        "keyMessage": "5가지 AI 트렌드를 통해 미래를 준비합니다",
        "contentHints": [
          "AI 시장 현황",
          "생성형 AI",
          "멀티모달 AI",
          "AI 에이전트",
          "AI 거버넌스"
        ],
        "estimatedDensity": "sparse"
      },
      {
        "order": 3,
        "type": "content",
        "title": "AI 시장 현황 2025",
        "keyMessage": "AI는 더 이상 선택이 아닌 필수입니다",
        "contentHints": [
          "글로벌 AI 시장 5,000억 달러 규모",
          "연평균 성장률 37%",
          "Fortune 500 기업 90% AI 도입"
        ],
        "estimatedDensity": "normal"
      }
    ],
    "totalSlides": 10,
    "sections": [
      { "name": "도입", "startIndex": 0, "endIndex": 1 },
      { "name": "본론", "startIndex": 2, "endIndex": 7 },
      { "name": "결론", "startIndex": 8, "endIndex": 9 }
    ]
  },
  "metadata": {
    "agentId": "outline-agent",
    "version": "1.0.0",
    "executedAt": "2025-01-15T10:00:00Z",
    "duration": 2500
  }
}
```

---

## 10. 제약 조건

### 10.1 필수 준수
- [ ] 첫 슬라이드는 반드시 `title` 타입
- [ ] 마지막 슬라이드는 `closing` 또는 `qna` 타입
- [ ] 슬라이드 5장 이상이면 `agenda` 포함
- [ ] 각 슬라이드에 keyMessage 필수
- [ ] contentHints는 최대 5개

### 10.2 금지 사항
- ❌ 좌표/크기/픽셀 값 지정
- ❌ 색상 hex 값 직접 지정
- ❌ 폰트 크기 지정
- ❌ 상세 문장 작성 (Content Agent 역할)

---

## 11. 다음 에이전트에게 전달할 정보

Content Agent에게:
- `outline` 전체
- 각 슬라이드의 `keyMessage`
- 각 슬라이드의 `contentHints`

Design Agent에게:
- `outline` 전체
- 각 슬라이드의 `type`
- 각 슬라이드의 `estimatedDensity`
- `sections` 구조
