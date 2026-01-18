# PPT 자동 생성기 - 프로젝트 규칙

> 이 문서는 프로젝트의 핵심 원칙과 규칙을 정의합니다.
> 모든 기여자는 이 규칙을 준수해야 합니다.

## 🎯 목표 아키텍처

```
사용자 입력 → Outline Agent → SlideSpec Builder → Layout Engine → Renderer → Style Guardian → 출력
                    ↑                                                              ↓
                    └────────────────── 수정 반복 ←───────────────────────────────┘
```

## 📐 필수 원칙 (절대 위반 금지)

### 1. SlideSpec이 단일 진실 (Single Source of Truth)

```typescript
// ✅ 올바른 방식
const deckSpec: DeckSpec = loadFromSpec();
renderPresentation(deckSpec);

// ❌ 금지
const slide = pptx.addSlide(); // spec 없이 직접 생성 금지
```

### 2. 레이아웃 좌표는 Layout Engine만 결정

```typescript
// ✅ 올바른 방식 (Layout Engine)
function calculateLayout(spec: SlideSpec): LayoutedSlide {
  return {
    blocks: spec.blocks.map(block => ({
      blockIndex: index,
      box: { x: 0.7, y: 1.5, width: 5, height: 2 }, // 여기서만 좌표 결정
    }))
  };
}

// ❌ 금지 (Outline Agent, SpecBuilder에서)
const block: TextBlock = {
  type: 'text',
  content: '내용',
  x: 0.7, // 금지! 좌표는 Layout Engine만
  y: 1.5,
};
```

### 3. pptxgenjs 호출은 Renderer 레이어에서만

```typescript
// ✅ 올바른 방식 (renderer/pptxRenderer.ts)
import PptxGenJS from 'pptxgenjs';

export function render(deckSpec: DeckSpec, layoutResult: LayoutResult) {
  const pptx = new PptxGenJS();
  // ...pptx 호출
}

// ❌ 금지 (types/, agents/, engine/에서)
import PptxGenJS from 'pptxgenjs'; // 이 레이어에서 import 자체가 금지
```

### 4. Style Guardian 린트를 통과해야 export 가능

```typescript
// 파이프라인 강제 적용
async function generatePresentation(input: UserInput) {
  const spec = await buildSpec(input);
  const layout = calculateLayout(spec);
  
  // 린트 필수
  const lintResult = runStyleGuardian({ spec, layout });
  
  if (!lintResult.passed && !config.allowWarningsOnly) {
    throw new Error('Style Guardian 검사 실패');
  }
  
  return render(spec, layout);
}
```

### 5. 폰트 줄이기보다 슬라이드 분할이 우선

오버플로우 해결 우선순위:
1. **문장 압축** - 동의어/군더더기 제거
2. **불릿 수 줄이기** - 핵심만 남기기
3. **2단 레이아웃 전환** - 수평 공간 활용
4. **슬라이드 분할** - 콘텐츠 분리
5. **폰트 축소** - 최후의 수단 (최소 10pt까지만)

### 6. 템플릿(테마)은 JSON으로 버전관리

```
themes/
├── default.json
├── corporate-blue.json
├── minimal-dark.json
└── custom/
    └── my-company.json
```

---

## 🏗 레이어 아키텍처

### Spec Layer (스펙 레이어)
- **위치**: `src/types/`, `src/agents/outline/`, `src/agents/specBuilder/`
- **역할**: 슬라이드 구조 정의, 스펙 변환
- **금지**: pptxgenjs import, 좌표 직접 지정

### Layout Layer (레이아웃 레이어)
- **위치**: `src/engine/layout/`
- **역할**: 좌표 계산, 크기 배치
- **금지**: pptxgenjs import

### Render Layer (렌더 레이어)
- **위치**: `src/renderer/`
- **역할**: pptxgenjs로 실제 PPT 생성
- **허용**: pptxgenjs import (유일하게 허용)

---

## 📏 스타일 규율 상세

### 슬라이드 기본 (16:9)

| 항목 | 값 | 비고 |
|------|-----|------|
| 캔버스 크기 | 13.333in × 7.5in | widescreen |
| 안전 마진 | 0.5in | 절대 준수 |
| 권장 마진 | 0.7in | 가독성 향상 |
| 그리드 컬럼 | 12 | gutter 0.2in |

### 타이포그래피 스케일

| 요소 | 크기 범위 | 기본값 | 행간 |
|------|-----------|--------|------|
| Title | 40-48pt | 44pt | 1.05-1.15 |
| Section Title | 32-36pt | 34pt | 1.05-1.15 |
| Body | 18-22pt | 20pt | 1.2-1.35 |
| Caption | 12-14pt | 12pt | 1.2-1.35 |
| Footnote | 10-12pt | 10pt | 1.2-1.35 |

**최소 폰트**: 10pt 미만 금지 (발표용)

### 콘텐츠 밀도

| 제한 | 최대값 | 권장값 |
|------|--------|--------|
| 슬라이드당 불릿 | 5개 | 3개 |
| 불릿당 줄 수 | 1.5줄 | 1줄 |
| 본문 줄 길이 | 60자 | 35-60자 |

### 색상/대비

- 텍스트 대비: **4.5:1 이상** (WCAG AA)
- 슬라이드당 강조색: **최대 2개**
- 차트/도형 색상: **테마 팔레트에서만 선택**

---

## 🔧 린트 규칙 ID 목록

### 마진 (MARGIN_*)
- `MARGIN_SAFE_BOUNDARY` [ERROR] - 안전 마진 위반
- `MARGIN_READABLE_RECOMMENDED` [WARNING] - 가독 마진 권장

### 타이포그래피 (TYPO_*)
- `TYPO_TITLE_SIZE` [ERROR] - 제목 폰트 크기
- `TYPO_SECTION_TITLE_SIZE` [ERROR] - 섹션 제목 폰트 크기
- `TYPO_BODY_SIZE` [ERROR] - 본문 폰트 크기
- `TYPO_MIN_FONT_SIZE` [ERROR] - 최소 폰트 크기
- `TYPO_LINE_HEIGHT_TITLE` [WARNING] - 제목 행간
- `TYPO_LINE_HEIGHT_BODY` [WARNING] - 본문 행간
- `TYPO_LINE_LENGTH` [WARNING] - 줄 길이

### 콘텐츠 밀도 (DENSITY_*)
- `DENSITY_MAX_BULLETS` [ERROR] - 최대 불릿 수
- `DENSITY_RECOMMENDED_BULLETS` [WARNING] - 권장 불릿 수
- `DENSITY_BULLET_LENGTH` [WARNING] - 불릿 길이
- `DENSITY_SLIDE_OVERFLOW` [ERROR] - 슬라이드 오버플로우

### 색상 (COLOR_*)
- `COLOR_CONTRAST` [ERROR] - 색상 대비
- `COLOR_ACCENT_LIMIT` [WARNING] - 강조색 개수
- `COLOR_THEME_PALETTE` [INFO] - 테마 팔레트 사용

### 오버플로우 (OVERFLOW_*)
- `OVERFLOW_TEXT_BOX` [ERROR] - 텍스트 박스 오버플로우
- `OVERFLOW_IMAGE_CROP` [WARNING] - 이미지 크롭 보호 영역

### 일관성 (CONSISTENCY_*)
- `CONSISTENCY_FONT_FAMILY` [WARNING] - 폰트 패밀리 수
- `CONSISTENCY_SPACING` [INFO] - 간격 통일성

### 접근성 (A11Y_*)
- `A11Y_ALT_TEXT` [WARNING] - 이미지 대체 텍스트
- `A11Y_HEADING_HIERARCHY` [INFO] - 제목 계층 구조

---

## 🧪 테스트 요구사항

### Golden Test
- 같은 DeckSpec → 같은 PPT 결과 (레이아웃/폰트 크기 동일)

```typescript
describe('Golden Test', () => {
  it('should produce consistent output', async () => {
    const spec = loadFixture('sample-spec.json');
    const result1 = await generatePPT(spec);
    const result2 = await generatePPT(spec);
    
    expect(result1.hash).toBe(result2.hash);
  });
});
```

### Lint Test
- 규칙 위반 케이스가 정상적으로 탐지되는지 검증

```typescript
describe('Lint Rules', () => {
  it('should detect margin violation', () => {
    const spec = createSpecWithMarginViolation();
    const result = runStyleGuardian({ spec, layout });
    
    expect(result.violations).toContainEqual(
      expect.objectContaining({ ruleId: 'MARGIN_SAFE_BOUNDARY' })
    );
  });
});
```

---

## 📁 디렉토리 구조

```
ppt-auto-generator/
├── src/
│   ├── types/              # 타입 정의 (Spec Layer)
│   │   ├── slideSpec.ts    # SlideSpec 스키마
│   │   ├── lintRules.ts    # 린트 규칙
│   │   └── agents.ts       # 에이전트 타입
│   │
│   ├── agents/             # 에이전트 (Spec Layer)
│   │   ├── outlineAgent.ts
│   │   ├── specBuilder.ts
│   │   ├── styleGuardian.ts
│   │   └── refactorAgent.ts
│   │
│   ├── engine/             # 엔진 (Layout Layer)
│   │   └── layout/
│   │       ├── layoutEngine.ts
│   │       └── gridSystem.ts
│   │
│   ├── renderer/           # 렌더러 (Render Layer)
│   │   ├── pptxRenderer.ts
│   │   └── components/     # 슬라이드 컴포넌트
│   │
│   ├── store/              # Zustand 스토어
│   │   └── deckStore.ts
│   │
│   ├── components/         # React 컴포넌트
│   ├── hooks/              # Custom Hooks
│   └── utils/              # 유틸리티
│
├── themes/                 # 테마 JSON
├── docs/                   # 문서
├── tests/                  # 테스트
└── output/                 # 생성된 파일
```

---

## 🔌 MCP 도구 통합

| 도구 | 용도 | 사용 시점 |
|------|------|----------|
| Sequence Thinking | 아웃라인 생성 | Outline Agent |
| Context7 | API 제약 확인 | SpecBuilder, Renderer |
| GitHub | 템플릿 관리 | 테마 버전 관리 |
| Chrome DevTools | 레이아웃 디버깅 | HTML 프리뷰 검사 |

---

## ✅ PR 체크리스트

- [ ] SlideSpec 스키마 변경 시 zod 검증 추가
- [ ] 새로운 컴포넌트는 레이어 규칙 준수
- [ ] Style Guardian 린트 통과
- [ ] Golden Test 통과
- [ ] Lint Test 추가 (새 규칙 시)
- [ ] 문서 업데이트
