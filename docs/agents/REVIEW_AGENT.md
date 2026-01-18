# REVIEW_AGENT.md - 리뷰 에이전트 스킬

> **역할**: 완성된 DeckSpec의 최종 품질을 검토하고 수정합니다.
>
> **권한**: 모든 레이어에 대한 읽기 권한, 제한적 수정 권한

---

## 1. 역할 정의

### 담당 업무
- 전체 DeckSpec 품질 검증
- 린트 규칙 위반 탐지
- 자동 수정 가능한 문제 해결
- 수동 수정 필요 항목 리포트
- 최종 승인/거부 결정

### 담당하지 않는 업무
- ❌ 새로운 콘텐츠 작성
- ❌ 슬라이드 구조 재설계
- ❌ 대규모 레이아웃 변경

---

## 2. 입력 스키마

```typescript
interface ReviewAgentInput {
  deckSpec: DeckSpec;           // 완성된 DeckSpec
  layoutResult: LayoutResult;   // Layout Engine 출력
  theme: Theme;                 // 적용된 테마
  options: {
    autoFix: boolean;           // 자동 수정 활성화
    maxIterations: number;      // 최대 수정 반복 횟수
    categories?: RuleCategory[]; // 검사할 카테고리 필터
  };
}

type RuleCategory =
  | 'margin'       // 마진 규칙
  | 'typography'   // 타이포그래피 규칙
  | 'density'      // 콘텐츠 밀도 규칙
  | 'color'        // 색상/대비 규칙
  | 'overflow'     // 오버플로우 규칙
  | 'consistency'  // 일관성 규칙
  | 'accessibility'; // 접근성 규칙
```

---

## 3. 출력 스키마

```typescript
interface ReviewAgentOutput {
  lintResult: LintResult;
  patches: LintPatch[];
  fixedDeckSpec?: DeckSpec;  // autoFix가 true일 때
  approved: boolean;         // 최종 승인 여부
}

interface LintResult {
  violations: LintViolation[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passed: boolean;
  executedAt: string;
}

interface LintViolation {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  category: RuleCategory;
  slideIndex: number;
  blockIndex?: number;
  message: string;
  details?: string;
  suggestedFix?: LintPatch;
}

interface LintPatch {
  type: 'modify' | 'split' | 'remove' | 'rearrange';
  path: string;          // JSON Pointer 형식
  value?: unknown;
  description: string;
}
```

---

## 4. 검사 체크리스트

### 4.1 마진 규칙 (MARGIN_*)

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `MARGIN_SAFE_BOUNDARY` | error | 모든 콘텐츠가 안전 마진(0.5") 내에 있어야 함 |
| `MARGIN_READABLE_RECOMMENDED` | warning | 가독성 마진(0.7") 권장 |

```typescript
// 검사 로직
function checkSafeMargin(block: LayoutedBlock, theme: Theme): boolean {
  const margin = theme.grid.safeMargin;  // 0.5"
  const { x, y, width, height } = block.box;
  return (
    x >= margin &&
    y >= margin &&
    x + width <= 13.333 - margin &&
    y + height <= 7.5 - margin
  );
}
```

### 4.2 타이포그래피 규칙 (TYPO_*)

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `TYPO_MIN_FONT_SIZE` | error | 최소 폰트 크기 10pt |
| `TYPO_TITLE_SIZE` | error | 제목 폰트 40-48pt |
| `TYPO_BODY_SIZE` | error | 본문 폰트 18-22pt |
| `TYPO_LINE_HEIGHT_BODY` | warning | 본문 행간 1.2-1.35 |
| `TYPO_LINE_LENGTH` | warning | 줄 길이 35-60자 |

### 4.3 콘텐츠 밀도 규칙 (DENSITY_*)

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `DENSITY_MAX_BULLETS` | error | 불릿 최대 5개 |
| `DENSITY_RECOMMENDED_BULLETS` | warning | 불릿 3개 이하 권장 |
| `DENSITY_BULLET_LENGTH` | warning | 불릿당 1.5줄 이내 |
| `DENSITY_SLIDE_OVERFLOW` | error | 콘텐츠 오버플로우 금지 |

### 4.4 색상/대비 규칙 (COLOR_*)

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `COLOR_CONTRAST` | error | 텍스트-배경 대비 4.5:1 이상 |
| `COLOR_ACCENT_LIMIT` | warning | 강조색 슬라이드당 2개 이하 |
| `COLOR_THEME_PALETTE` | info | 테마 팔레트 색상 사용 권장 |

### 4.5 오버플로우 규칙 (OVERFLOW_*)

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `OVERFLOW_TEXT_BOX` | error | 텍스트가 박스 영역 초과 금지 |
| `OVERFLOW_IMAGE_CROP` | warning | 이미지 크롭 시 보호 영역 확인 |

### 4.6 일관성 규칙 (CONSISTENCY_*)

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `CONSISTENCY_FONT_FAMILY` | warning | 폰트 패밀리 3개 이하 |
| `CONSISTENCY_SPACING` | info | 간격 4px 배수 권장 |

### 4.7 접근성 규칙 (A11Y_*)

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `A11Y_ALT_TEXT` | warning | 이미지 대체 텍스트 필수 |
| `A11Y_HEADING_HIERARCHY` | info | 제목 계층 구조 유지 |

---

## 5. 자동 수정 권한 범위

### 5.1 자동 수정 가능 (autoApplicable: true)

```typescript
const AUTO_FIXABLE_RULES = [
  'MARGIN_SAFE_BOUNDARY',       // 마진 내로 위치 조정
  'MARGIN_READABLE_RECOMMENDED',
  'TYPO_MIN_FONT_SIZE',         // 최소 폰트로 조정
  'TYPO_LINE_HEIGHT_TITLE',
  'TYPO_LINE_HEIGHT_BODY',
  'CONSISTENCY_SPACING',        // 4px 배수로 조정
];
```

### 5.2 수동 수정 필요 (autoApplicable: false)

```typescript
const MANUAL_FIX_RULES = [
  'DENSITY_MAX_BULLETS',        // 콘텐츠 삭제 필요
  'DENSITY_SLIDE_OVERFLOW',     // 구조 변경 필요
  'COLOR_CONTRAST',             // 색상 선택 필요
  'OVERFLOW_TEXT_BOX',          // 콘텐츠 압축 필요
];
```

---

## 6. 오버플로우 해결 우선순위

```
1. COMPRESS_TEXT      - 문장 압축 (동의어/군더더기 제거)
2. REDUCE_BULLETS     - 불릿 수 줄이기
3. TWO_COLUMN_LAYOUT  - 2단 레이아웃 전환
4. SPLIT_SLIDE        - 슬라이드 분할
5. REDUCE_FONT_SIZE   - 폰트 축소 (최후 수단, 10pt까지만)
```

### 6.1 자동 압축 예시

```typescript
// 원본
"인공지능 기술의 발전으로 인하여 업무 효율성이 크게 향상되었습니다"

// 1단계: 군더더기 제거
"AI 기술 발전으로 업무 효율성이 향상되었습니다"

// 2단계: 동의어 치환
"AI로 업무 효율 향상"
```

---

## 7. 대비 비율 계산

```typescript
function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// 사용 예
const ratio = calculateContrastRatio('1791e8', 'ffffff');
// 결과: 3.36 (❌ 4.5 미만)

const ratio2 = calculateContrastRatio('1273ba', 'ffffff');
// 결과: 5.2 (✅ 4.5 이상)
```

---

## 8. 출력 예시

### 8.1 린트 통과

```json
{
  "success": true,
  "data": {
    "lintResult": {
      "violations": [],
      "errorCount": 0,
      "warningCount": 0,
      "infoCount": 0,
      "passed": true,
      "executedAt": "2025-01-15T10:05:00Z"
    },
    "patches": [],
    "approved": true
  },
  "metadata": {
    "agentId": "review-agent",
    "version": "1.0.0",
    "executedAt": "2025-01-15T10:05:00Z",
    "duration": 300
  }
}
```

### 8.2 린트 실패 (자동 수정 가능)

```json
{
  "success": true,
  "data": {
    "lintResult": {
      "violations": [
        {
          "ruleId": "COLOR_CONTRAST",
          "severity": "error",
          "category": "color",
          "slideIndex": 2,
          "blockIndex": 0,
          "message": "텍스트와 배경의 명도 대비는 4.5:1 이상이어야 합니다",
          "details": "대비 비율: 3.36:1",
          "suggestedFix": {
            "type": "modify",
            "path": "/slides/2/blocks/0/style/color",
            "value": { "theme": "primary-dark" },
            "description": "텍스트 색상을 primary-dark로 변경"
          }
        }
      ],
      "errorCount": 1,
      "warningCount": 0,
      "infoCount": 0,
      "passed": false,
      "executedAt": "2025-01-15T10:05:00Z"
    },
    "patches": [
      {
        "slideIndex": 2,
        "blockIndex": 0,
        "patch": {
          "type": "modify",
          "path": "/slides/2/blocks/0/style/color",
          "value": { "theme": "primary-dark" },
          "description": "텍스트 색상을 primary-dark로 변경"
        },
        "autoApplicable": false
      }
    ],
    "approved": false
  }
}
```

---

## 9. 승인/거부 기준

### 9.1 자동 승인 조건

```typescript
approved = (
  lintResult.errorCount === 0 &&
  !violations.some(v => v.severity === 'error')
);
```

### 9.2 자동 거부 조건

```typescript
rejected = (
  lintResult.errorCount > 0 ||
  violations.some(v =>
    v.ruleId === 'OVERFLOW_TEXT_BOX' ||
    v.ruleId === 'DENSITY_SLIDE_OVERFLOW'
  )
);
```

### 9.3 경고만 있는 경우

```
- warningCount > 0 && errorCount === 0
- approved = true (경고와 함께 승인)
- 경고 내용을 리포트에 포함
```

---

## 10. 반복 수정 프로세스

```typescript
async function reviewWithAutoFix(
  input: ReviewAgentInput
): Promise<ReviewAgentOutput> {
  let iteration = 0;
  let currentSpec = input.deckSpec;

  while (iteration < input.options.maxIterations) {
    iteration++;

    // 1. 린트 실행
    const result = runLint(currentSpec, input.layoutResult, input.theme);

    // 2. 에러 없으면 승인
    if (result.errorCount === 0) {
      return { ...result, approved: true, fixedDeckSpec: currentSpec };
    }

    // 3. 자동 수정 비활성화면 종료
    if (!input.options.autoFix) {
      return { ...result, approved: false };
    }

    // 4. 자동 수정 가능한 패치 적용
    const autoPatches = result.patches.filter(p => p.autoApplicable);
    if (autoPatches.length === 0) {
      // 수동 수정만 남음
      return { ...result, approved: false };
    }

    currentSpec = applyPatches(currentSpec, autoPatches);
  }

  // 최대 반복 도달
  return { ...lastResult, approved: false };
}
```

---

## 11. 제약 조건

### 11.1 필수 준수
- [ ] 모든 error 심각도 위반은 반드시 리포트
- [ ] 자동 수정 시 원본 보존 (별도 fixedDeckSpec 반환)
- [ ] 수정 내역 로깅

### 11.2 금지 사항
- ❌ 에러 무시/숨김
- ❌ 사용자 동의 없이 콘텐츠 삭제
- ❌ 원본 DeckSpec 직접 수정 (복사본에서 수정)

---

## 12. 다른 에이전트와의 상호작용

### 12.1 오버플로우 시 Content Agent 요청

```typescript
// Content Agent에게 콘텐츠 압축 요청
{
  requestTo: 'content-agent',
  type: 'compress',
  slideIndex: 2,
  targetReduction: 20,  // 20% 감소 요청
  reason: 'OVERFLOW_TEXT_BOX'
}
```

### 12.2 색상 문제 시 Design Agent 요청

```typescript
// Design Agent에게 색상 조정 요청
{
  requestTo: 'design-agent',
  type: 'adjust-color',
  slideIndex: 2,
  issue: 'COLOR_CONTRAST',
  currentRatio: 3.36,
  requiredRatio: 4.5
}
```

---

## 13. 실행 위치

```
Outline Agent
     ↓
Content Agent + Design Agent (병렬)
     ↓
DeckSpec 조립
     ↓
Layout Engine
     ↓
┌─────────────────┐
│  Review Agent   │ ← 최종 검토 단계
└─────────────────┘
     ↓
승인 → Renderer → PPT 출력
거부 → 에러 리포트 / 재수정 요청
```
