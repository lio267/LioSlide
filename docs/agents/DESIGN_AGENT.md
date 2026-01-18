# DESIGN_AGENT.md - 디자인 에이전트 스킬

> **역할**: 레이아웃, 색상, 폰트 등 시각적 요소를 결정합니다.
>
> **레이어**: Layout Layer (콘텐츠 수정 금지)

---

## 1. 역할 정의

### 담당 업무
- 슬라이드별 레이아웃 힌트 결정
- 콘텐츠 밀도(density) 조정
- 배경 스타일 결정
- 강조색 사용 여부 결정
- 이미지/차트 우선 영역 지정
- 테마 오버라이드 (필요시)

### 담당하지 않는 업무
- ❌ 텍스트 콘텐츠 작성/수정 (Content Agent 담당)
- ❌ 슬라이드 순서/구조 변경 (Outline Agent 담당)
- ❌ **절대 좌표 계산** (Layout Engine 담당)
- ❌ 최종 품질 검토 (Review Agent 담당)

---

## 2. 입력 스키마

```typescript
interface DesignAgentInput {
  slideOutline: SlideOutline;  // Outline Agent 출력
  userInput: {
    tone: PresentationTone;
    branding?: BrandingInfo;
  };
  theme: Theme;  // 기본 테마
  slideIndex: number;
}

interface BrandingInfo {
  companyName: string;
  primaryColor?: string;    // hex (6자리)
  secondaryColor?: string;  // hex (6자리)
  logoUrl?: string;
  fontPreference?: string;
}
```

---

## 3. 출력 스키마

```typescript
interface DesignAgentOutput {
  slideIndex: number;
  constraints: SlideConstraints;
  themeOverride?: Partial<Theme>;  // 슬라이드별 테마 오버라이드
}

interface SlideConstraints {
  layoutHint?: LayoutHint;
  density: 'sparse' | 'normal' | 'dense';
  imagePriority?: ImagePriority;
  useAccentColor: boolean;
  backgroundStyle: 'solid' | 'gradient' | 'image';
}

type LayoutHint =
  | 'balanced'      // 균형 잡힌 배치
  | 'left-heavy'    // 왼쪽 강조
  | 'right-heavy'   // 오른쪽 강조
  | 'top-heavy'     // 상단 강조
  | 'bottom-heavy'  // 하단 강조
  | 'centered';     // 중앙 집중

type ImagePriority =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'background';
```

---

## 4. 테마 참조 규칙

### 4.1 색상 참조 (필수)

```typescript
// ✅ 올바른 방법: 테마 참조
color: { theme: 'primary' }
color: { theme: 'primary-dark' }
color: { theme: 'muted' }

// ⚠️ 예외: 브랜딩 색상 사용 시만 hex 허용
color: { hex: userInput.branding.primaryColor }
```

### 4.2 사용 가능한 테마 색상

| 키 | 용도 | 대비 비율 (흰 배경) |
|----|------|-------------------|
| `primary` | 주요 강조 | 3.36:1 (⚠️ 본문 부적합) |
| `primary-dark` | 텍스트 강조 | **5.2:1** (✅ 본문 적합) |
| `primary-light` | 배경 강조 | 2.1:1 (배경용) |
| `secondary` | 보조 요소 | - |
| `muted` | 비활성 영역 | - |
| `accent` | 특별 강조 | - |

### 4.3 색상 대비 규칙

```
⚠️ 중요: 텍스트 색상은 반드시 배경과 4.5:1 이상 대비

흰색 배경(#ffffff)에서:
- primary (#1791e8): 3.36:1 → ❌ 본문 부적합
- primary-dark (#1273ba): 5.2:1 → ✅ 본문 적합
- surfaceForeground (#1d1d1d): 14.5:1 → ✅ 기본값
```

---

## 5. 레이아웃 힌트 선정 가이드

### 5.1 슬라이드 타입별 권장 레이아웃

| 슬라이드 타입 | 권장 레이아웃 | 이유 |
|--------------|--------------|------|
| `title` | `centered` | 중앙 집중으로 임팩트 |
| `agenda` | `balanced` | 균형 잡힌 목록 |
| `content` | `balanced` / `left-heavy` | 일반적인 읽기 흐름 |
| `twoColumn` | (자동) | Layout Engine이 처리 |
| `chart` | `centered` | 차트 중심 |
| `imageHero` | `left-heavy` / `right-heavy` | 이미지 위치에 따라 |
| `quote` | `centered` | 인용문 강조 |
| `summary` | `balanced` | 핵심 요약 |
| `closing` | `centered` | 마무리 임팩트 |

### 5.2 밀도(density)와 레이아웃 조합

```
sparse + centered  → 표지, 인용문
sparse + balanced  → 섹션 제목
normal + balanced  → 일반 콘텐츠
normal + left-heavy → 이미지+텍스트
dense + balanced   → 데이터 중심 슬라이드
```

---

## 6. 콘텐츠 밀도 결정

### 6.1 밀도 기준

| 밀도 | 블록 수 | 불릿 수 | 용도 |
|------|--------|--------|------|
| `sparse` | 0-1 | 0-2 | 표지, 섹션, 인용 |
| `normal` | 1-2 | 3-4 | 일반 콘텐츠 |
| `dense` | 2-3 | 5 | 데이터, 상세 설명 |

### 6.2 Outline Agent 추정치 조정

```typescript
// Outline Agent가 추정한 밀도를 검토/조정
if (outline.estimatedDensity === 'dense' && contentHints.length <= 3) {
  // 실제 콘텐츠가 적으면 normal로 조정
  constraints.density = 'normal';
}
```

---

## 7. 배경 스타일 결정

### 7.1 solid (단색)
```
용도: 대부분의 슬라이드
설정: backgroundStyle: 'solid'
```

### 7.2 gradient (그라데이션)
```
용도: 특별 강조 슬라이드 (표지, 섹션)
주의: 텍스트 가독성 확보 필수
설정: backgroundStyle: 'gradient'
```

### 7.3 image (이미지 배경)
```
용도: 분위기 연출, 히어로 슬라이드
주의: 오버레이 필수, 텍스트 대비 확보
설정: backgroundStyle: 'image'
```

---

## 8. 강조색 사용 규칙

### 8.1 사용 조건
```typescript
useAccentColor: true  // 다음 경우에만
- keyMessage를 시각적으로 강조할 때
- 특정 데이터를 하이라이트할 때
- 슬라이드당 1-2개 요소만
```

### 8.2 사용 금지
```typescript
useAccentColor: false  // 다음 경우
- 전체 텍스트 강조
- 모든 불릿에 적용
- 3개 이상 요소 강조
```

---

## 9. 테마 오버라이드

### 9.1 허용되는 오버라이드

```typescript
themeOverride: {
  colors: {
    primary: userInput.branding.primaryColor,  // 브랜딩
    primaryDark: adjustedDarkColor,            // 자동 계산
  }
}
```

### 9.2 금지되는 오버라이드

```typescript
// ❌ 금지: 폰트 크기 범위 변경
themeOverride: {
  fontSizes: { body: 16 }  // 최소 18pt 미만 불가
}

// ❌ 금지: 그리드 구조 변경
themeOverride: {
  grid: { columns: 6 }  // 12-column 고정
}
```

---

## 10. 출력 예시

```json
{
  "success": true,
  "data": {
    "slideIndex": 2,
    "constraints": {
      "layoutHint": "balanced",
      "density": "normal",
      "imagePriority": null,
      "useAccentColor": true,
      "backgroundStyle": "solid"
    },
    "themeOverride": null
  },
  "metadata": {
    "agentId": "design-agent",
    "version": "1.0.0",
    "slideIndex": 2,
    "executedAt": "2025-01-15T10:01:00Z",
    "duration": 500
  }
}
```

---

## 11. 좌표 계산 규칙 (Layout Engine 전달용)

> **중요**: Design Agent는 좌표를 직접 계산하지 않습니다.
> 아래는 Layout Engine에 전달하는 힌트입니다.

### 11.1 그리드 시스템 참조

```
캔버스: 13.333" x 7.5" (16:9)
마진: 안전 0.5", 권장 0.7"
컬럼: 12-column grid
거터: 0.2"
```

### 11.2 영역 정의 (참조용)

```
제목 영역:   y=0.5", height=0.8"
콘텐츠 영역: y=1.5", height=5.2"
각주 영역:   y=6.9", height=0.4"
```

### 11.3 밀도별 여백 힌트

```
sparse: 여유로운 여백, 중앙 정렬
normal: 표준 여백, 좌측 정렬
dense:  최소 여백, 컴팩트 배치
```

---

## 12. 제약 조건

### 12.1 필수 준수
- [ ] 색상은 테마 참조 사용
- [ ] 텍스트 색상 대비 4.5:1 이상
- [ ] 강조색은 슬라이드당 2개 이하
- [ ] density는 콘텐츠 양에 맞게 조정

### 12.2 금지 사항
- ❌ 절대 좌표(x, y, width, height) 지정
- ❌ 픽셀/포인트 값 직접 지정
- ❌ 콘텐츠 텍스트 수정
- ❌ 슬라이드 추가/삭제
- ❌ 폰트 크기 18pt 미만으로 설정

---

## 13. 병렬 실행 정보

- **의존성**: Outline Agent 완료 후 실행
- **병렬 가능**: Content Agent와 동시 실행 가능
- **독립성**: 슬라이드별로 독립 실행 가능

```
Outline Agent
     ↓
┌────┴────┐
│         │
Content   Design    ← 병렬 실행
Agent     Agent
│         │
└────┬────┘
     ↓
DeckSpec 조립
     ↓
Layout Engine  ← Design Agent 힌트 사용
```

---

## 14. Layout Engine 연동

Design Agent의 `constraints`는 Layout Engine에 다음과 같이 영향을 미칩니다:

| Design 출력 | Layout Engine 동작 |
|------------|-------------------|
| `layoutHint: 'centered'` | 블록을 중앙 정렬 |
| `layoutHint: 'left-heavy'` | 좌측 60%, 우측 40% 배분 |
| `density: 'sparse'` | 여백 확대, 폰트 크기 유지 |
| `density: 'dense'` | 여백 최소화, 필요시 폰트 축소 |
| `imagePriority: 'right'` | 이미지를 우측에 배치 |
