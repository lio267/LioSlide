# PPT 자동 생성기

AI 기반 프레젠테이션 자동 생성 엔진. 병렬 에이전트 파이프라인으로 고품질 PPT를 빠르게 생성합니다.

## 주요 기능

- **4개 전문 에이전트**: Outline, Content, Design, Review 에이전트가 각자의 역할 수행
- **병렬 처리**: Content + Design 에이전트 동시 실행으로 성능 최적화
- **스타일 가드**: 20+ 린트 규칙으로 디자인 품질 자동 검증
- **자동 수정**: 오버플로우, 대비 부족 등 자동 교정

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 병렬 모드로 PPT 생성
npm run generate:parallel

# 3. 순차 모드로 PPT 생성
npm run generate:sequential

# 4. 파이프라인 테스트
npm run test:pipeline
```

## 사용 예시

### 병렬 파이프라인 (권장)

```typescript
import { runParallelPipeline } from 'ppt-auto-generator';

const result = await runParallelPipeline({
  topic: '스타트업 투자 유치 전략',
  tone: 'professional',
  audience: '벤처캐피탈 투자자',
  slideCount: 10,
  sourceContent: '원문 내용...',
});

console.log(result.outputPath); // ./output/스타트업_투자_유치_전략.pptx
```

### 순차 파이프라인

```typescript
import { runParallelPipeline } from 'ppt-auto-generator';

const result = await runParallelPipeline(input, {
  parallel: false,  // 순차 실행
});
```

### LLM 연동

```typescript
import { runParallelPipeline } from 'ppt-auto-generator';

const result = await runParallelPipeline(input, {
  contentGenerator: async (prompt, system) => {
    // Claude API 호출
    return await callClaude(prompt, system);
  },
  designGenerator: async (prompt, system) => {
    return await callClaude(prompt, system);
  },
});
```

### 진행 상황 모니터링

```typescript
const result = await runParallelPipeline(input, {
  onProgress: (event) => {
    console.log(`[${event.progress}%] ${event.message}`);
  },
});
```

---

## 아키텍처

### 병렬 파이프라인 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 입력                           │
│  (주제, 톤, 청중, 슬라이드 수, 원문)                          │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Outline Agent                                      │
│  → 슬라이드 구조 + 핵심 메시지 설계                           │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│  Content Agent      │           │  Design Agent       │
│  → 텍스트 콘텐츠    │  병렬     │  → 레이아웃/색상    │
│  → 불릿 포인트      │  실행     │  → 밀도/배경        │
│  → 발표자 노트      │           │  → 강조색 결정      │
└─────────────────────┘           └─────────────────────┘
         │                                   │
         └─────────────────┬─────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: DeckSpec 병합                                       │
│  → Content + Design 결과를 SlideSpec으로 조합                 │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Layout Engine                                       │
│  → 좌표/크기 계산 (Grid System 적용)                          │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Style Guardian (Review Agent)                       │
│  → 린트 검사 → 위반 시 자동 수정 → 재검사 (최대 3회)          │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Renderer (pptxgenjs)                                │
│  → .pptx 파일 생성                                           │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      output.pptx                             │
└─────────────────────────────────────────────────────────────┘
```

### 3-Layer 아키텍처

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Spec Layer    │ → │  Layout Layer   │ → │  Render Layer   │
│  (의미/구조)     │   │   (좌표/크기)    │   │   (pptxgenjs)   │
└─────────────────┘   └─────────────────┘   └─────────────────┘

• Spec Layer: 콘텐츠, 슬라이드 타입, 의미적 구조 (좌표 X)
• Layout Layer: 좌표, 크기, 여백, 폰트 크기 계산
• Render Layer: pptxgenjs API 호출, 파일 생성
```

---

## 프로젝트 구조

```
ppt-auto-generator/
│
├── package.json                  # 프로젝트 설정
├── tsconfig.json                 # TypeScript 설정
├── README.md                     # 이 문서
│
├── src/
│   ├── index.ts                  # 메인 내보내기
│   ├── pipeline.ts               # 기존 파이프라인 (순차)
│   │
│   ├── orchestrator/             # 오케스트레이터
│   │   └── parallelOrchestrator.ts  # 병렬 파이프라인
│   │
│   ├── agents/                   # 에이전트
│   │   ├── outlineAgent.ts       # 아웃라인 에이전트
│   │   ├── contentAgent.ts       # 콘텐츠 에이전트
│   │   ├── designAgent.ts        # 디자인 에이전트
│   │   ├── styleGuardian.ts      # 스타일 가드 (Review)
│   │   └── refactorAgent.ts      # 리팩터 에이전트
│   │
│   ├── engine/                   # 레이아웃 엔진
│   │   └── layout/
│   │       └── layoutEngine.ts   # 좌표 계산
│   │
│   ├── renderer/                 # 렌더러
│   │   └── pptxRenderer.ts       # pptxgenjs 호출
│   │
│   ├── types/                    # 타입 정의
│   │   ├── slideSpec.ts          # SlideSpec/DeckSpec (Zod)
│   │   ├── lintRules.ts          # 린트 규칙
│   │   └── agents.ts             # 에이전트 타입
│   │
│   └── store/                    # 상태 관리
│       └── deckStore.ts          # Zustand 스토어
│
├── scripts/                      # 실행 스크립트
│   ├── generate-real.ts          # 실제 PPT 생성
│   └── test-parallel.ts          # 병렬 테스트
│
├── docs/                         # 문서
│   ├── SHARED_RULES.md           # 공통 규칙
│   └── agents/                   # 에이전트별 스킬 문서
│       ├── OUTLINE_AGENT.md
│       ├── CONTENT_AGENT.md
│       ├── DESIGN_AGENT.md
│       └── REVIEW_AGENT.md
│
└── output/                       # 출력 디렉토리
    └── *.pptx
```

---

## 에이전트 소개

### 1. Outline Agent

**역할**: 프레젠테이션의 전체 구조와 흐름 설계

```typescript
// 입력: 주제, 톤, 청중, 슬라이드 수
// 출력: SlideOutline[]

const outlines = await generateOutline({
  userInput: { topic, tone, audience, slideCount },
  theme,
});
```

- 슬라이드 순서 및 타입 결정
- 핵심 메시지(Key Message) 작성
- 콘텐츠 힌트 제공
- 섹션 구조 설계

### 2. Content Agent

**역할**: 각 슬라이드의 실제 텍스트 콘텐츠 작성

```typescript
// 입력: SlideOutline[], 톤, 청중
// 출력: ContentAgentOutput[] (블록 + 노트)

const contents = await generateAllSlideContent({
  outlines,
  userInput: { tone, audience },
});
```

- 톤별 문체 적용 (7종: professional, casual, academic 등)
- 글자 수 제한 자동 준수 (불릿 60자, 5개 이하)
- 발표자 노트 작성
- 슬라이드 타입별 콘텐츠 패턴 적용

### 3. Design Agent

**역할**: 레이아웃, 색상, 밀도 등 시각적 요소 결정

```typescript
// 입력: SlideOutline[], 톤, 브랜딩
// 출력: DesignAgentOutput[] (제약조건)

const designs = await generateAllSlideDesigns({
  outlines,
  userInput: { tone, branding },
});
```

- layoutHint: balanced, left-heavy, centered 등
- density: sparse, normal, dense
- backgroundStyle: solid, gradient, image
- useAccentColor: 강조색 사용 여부
- 테마 색상 참조 (hex 직접 지정 금지)

### 4. Review Agent (Style Guardian)

**역할**: 완성된 DeckSpec의 최종 품질 검토

```typescript
// 입력: DeckSpec, LayoutResult, Theme
// 출력: 린트 결과 + 패치 제안

const result = runStyleGuardian({
  deckSpec,
  layoutResult,
  theme,
});
```

- 20+ 린트 규칙 검사
- 자동 수정 가능한 문제 해결
- 수동 수정 필요 항목 리포트
- 최종 승인/거부 결정

---

## 스타일 규칙

### 필수 규칙

| 규칙 | 값 | 설명 |
|------|-----|------|
| 캔버스 | 13.333" × 7.5" | 16:9 비율 |
| 안전 마진 | 0.5" | 필수 준수 |
| 권장 마진 | 0.7" | 가독성 권장 |
| 제목 폰트 | 40-48pt | 최소 40pt |
| 본문 폰트 | 18-22pt | 기본 20pt |
| 최소 폰트 | 10pt | 이하 금지 |
| 최대 불릿 | 5개 | 권장 3개 |
| 대비 비율 | 4.5:1+ | WCAG AA |

### 린트 카테고리

```typescript
MARGIN_*      // 마진 규칙
TYPO_*        // 타이포그래피
DENSITY_*     // 콘텐츠 밀도
COLOR_*       // 색상/대비
OVERFLOW_*    // 오버플로우
CONSISTENCY_* // 일관성
A11Y_*        // 접근성
```

---

## 톤 (Presentation Tone)

| 톤 | 특징 | 용도 |
|----|------|------|
| `professional` | 명확, 객관적, 데이터 중심 | 기업 발표 |
| `casual` | 친근, 대화체, 쉬운 표현 | 팀 미팅 |
| `academic` | 정확, 근거 제시, 논리적 | 학술 발표 |
| `creative` | 감성적, 스토리텔링 | 마케팅 |
| `minimal` | 극도로 간결, 키워드 중심 | 피칭 |
| `energetic` | 열정적, 행동 유도 | 세일즈 |
| `luxury` | 우아, 절제, 품격 | 고급 브랜드 |

---

## 슬라이드 타입 (16종)

```typescript
type SlideType =
  | 'title'         // 표지
  | 'sectionTitle'  // 섹션 구분
  | 'agenda'        // 목차
  | 'content'       // 일반 콘텐츠
  | 'twoColumn'     // 2단 레이아웃
  | 'threeColumn'   // 3단 레이아웃
  | 'comparison'    // 비교
  | 'chart'         // 차트
  | 'imageHero'     // 이미지 강조
  | 'imageGallery'  // 이미지 갤러리
  | 'quote'         // 인용
  | 'timeline'      // 타임라인
  | 'process'       // 프로세스
  | 'summary'       // 요약
  | 'qna'           // Q&A
  | 'closing';      // 마무리
```

---

## 개발

### 스크립트

```bash
# 개발 서버 (Next.js)
npm run dev

# 타입 검사
npm run type-check

# 린트
npm run lint

# 테스트
npm test

# PPT 생성 (병렬)
npm run generate:parallel

# PPT 생성 (순차)
npm run generate:sequential

# 파이프라인 테스트
npm run test:pipeline
```

### 기술 스택

- **언어**: TypeScript
- **PPT 생성**: pptxgenjs
- **스키마 검증**: Zod
- **상태 관리**: Zustand
- **UI**: Next.js + Tailwind CSS

---

## 체크리스트

- [x] SlideSpec 스키마 정의 (Zod)
- [x] Style Guardian 린트 규칙 정의
- [x] Layout Engine 구현
- [x] pptxgenjs Renderer 구현
- [x] Outline Agent 구현
- [x] Content Agent 구현
- [x] Design Agent 구현
- [x] 병렬 오케스트레이터 구현
- [x] 파이프라인 테스트
- [ ] Next.js UI 컴포넌트
- [ ] MCP 실제 연동
- [ ] 단위 테스트 작성

---

## 라이선스

MIT
