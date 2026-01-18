# SHARED_RULES.md - 병렬 에이전트 공통 규칙

> **이 문서는 모든 에이전트가 반드시 따라야 할 규칙입니다.**
> 규칙 위반 시 파이프라인이 실패하거나 출력물 품질이 저하됩니다.

---

## 1. 3-Layer 아키텍처 원칙

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Spec Layer    │ → │  Layout Layer   │ → │  Render Layer   │
│  (의미/구조)     │   │   (좌표/크기)    │   │   (pptxgenjs)   │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### 레이어별 책임

| 레이어 | 담당 에이전트 | 결정 권한 | 금지 사항 |
|--------|--------------|----------|-----------|
| **Spec** | Outline, Content | 콘텐츠, 슬라이드 타입, 의미적 구조 | 좌표, 크기, 픽셀 값 결정 |
| **Layout** | Design | 좌표, 크기, 여백, 폰트 크기 | 콘텐츠 수정, 슬라이드 추가/삭제 |
| **Render** | (시스템) | pptxgenjs API 호출 | 레이아웃 재계산, 콘텐츠 변경 |

### 절대 금지 사항

```
❌ Spec Layer에서 좌표/크기 지정
❌ Layout Layer에서 텍스트 내용 수정
❌ Render Layer에서 레이아웃 재계산
❌ 다른 에이전트의 출력 구조 임의 변경
```

---

## 2. SlideSpec 스키마 (Single Source of Truth)

모든 에이전트는 이 스키마를 준수해야 합니다.

### 2.1 슬라이드 타입 (16종)

```typescript
type SlideType =
  | 'title'           // 표지 (첫 슬라이드)
  | 'sectionTitle'    // 섹션 구분
  | 'agenda'          // 목차
  | 'content'         // 일반 콘텐츠
  | 'twoColumn'       // 2단 레이아웃
  | 'threeColumn'     // 3단 레이아웃
  | 'comparison'      // 비교 (좌우 대조)
  | 'chart'           // 차트 중심
  | 'imageHero'       // 이미지 강조
  | 'imageGallery'    // 이미지 갤러리
  | 'quote'           // 인용
  | 'timeline'        // 타임라인
  | 'process'         // 프로세스/흐름
  | 'summary'         // 요약
  | 'qna'             // Q&A
  | 'closing';        // 마무리 (마지막 슬라이드)
```

### 2.2 콘텐츠 블록 타입

```typescript
type ContentBlock =
  | TextBlock        // 텍스트
  | BulletListBlock  // 불릿 리스트
  | ImageBlock       // 이미지
  | ChartBlock       // 차트
  | TableBlock       // 테이블
  | ShapeBlock       // 도형
  | PlaceholderBlock // 플레이스홀더
```

### 2.3 필수 출력 구조

모든 에이전트 출력은 다음 구조를 따라야 합니다:

```typescript
interface AgentOutput {
  success: boolean;      // 성공 여부
  data?: T;              // 결과 데이터 (타입별 상이)
  error?: string;        // 에러 메시지 (실패 시)
  logs: AgentLog[];      // 실행 로그
  duration: number;      // 실행 시간 (ms)
}
```

---

## 3. 콘텐츠 제약 조건

### 3.1 텍스트 제한

| 요소 | 최소 | 권장 | 최대 |
|------|------|------|------|
| 제목 | 2자 | 10-20자 | 40자 |
| 부제목 | - | 20-40자 | 60자 |
| 불릿 항목 | - | 1줄 | 1.5줄 |
| 불릿 개수 | 1개 | 3개 | 5개 |
| 발표자 노트 | - | 50-100자 | 300자 |

### 3.2 폰트 크기 (pt)

| 요소 | 최소 | 기본 | 최대 |
|------|------|------|------|
| 제목 | 40 | 44 | 48 |
| 섹션 제목 | 32 | 34 | 36 |
| 본문 | 18 | 20 | 22 |
| 캡션 | 12 | 12 | 14 |
| 발표용 최소 | **10** | - | - |

### 3.3 색상 대비

- **필수**: 텍스트와 배경의 대비 비율 **4.5:1 이상** (WCAG AA)
- 강조색은 슬라이드당 **2개 이하** 사용

---

## 4. 테마 색상 참조

에이전트는 직접 hex 값 대신 테마 참조를 사용해야 합니다:

```typescript
// ✅ 올바른 사용
color: { theme: 'primary' }
color: { theme: 'primary-dark' }

// ❌ 피해야 할 사용 (특별한 경우만)
color: { hex: '1791e8' }
```

### 사용 가능한 테마 색상

| 키 | 용도 | 기본값 |
|----|------|--------|
| `primary` | 주요 강조 | #1791e8 |
| `primary-light` | 연한 강조 | #4ba8ed |
| `primary-dark` | 진한 강조 (대비 필요 시) | #1273ba |
| `secondary` | 보조 색상 | #f5f5f5 |
| `surface` | 배경 | #ffffff |
| `muted` | 비활성 영역 | #f5f5f5 |
| `accent` | 특별 강조 | #f5f5f5 |
| `border` | 테두리 | #c8c8c8 |

---

## 5. 에이전트 간 통신 규약

### 5.1 데이터 전달 흐름

```
UserInput
    ↓
┌───────────────┐
│ Outline Agent │ → SlideOutline[]
└───────────────┘
    ↓
┌───────────────┐
│ Content Agent │ → ContentBlock[] (슬라이드별)
└───────────────┘
    ↓
┌───────────────┐
│ Design Agent  │ → SlideConstraints, Theme overrides
└───────────────┘
    ↓
┌───────────────┐
│ DeckSpec 조립 │ → 완성된 DeckSpec
└───────────────┘
    ↓
┌───────────────┐
│ Review Agent  │ → 검증/수정 패치
└───────────────┘
```

### 5.2 병렬 실행 가능 여부

| 조합 | 병렬 가능 | 이유 |
|------|----------|------|
| Outline → Content | ❌ | Content는 Outline 결과 필요 |
| Content ↔ Design | ✅ | 독립적 (같은 슬라이드 병렬 처리) |
| Design → Review | ❌ | Review는 전체 DeckSpec 필요 |

---

## 6. 충돌 해결 우선순위

동일 속성에 대해 여러 에이전트가 값을 제안할 경우:

```
1. Review Agent (최종 검토권)
2. Design Agent (디자인 결정권)
3. Content Agent (콘텐츠 결정권)
4. Outline Agent (구조 결정권)
5. 사용자 입력 (기본값)
```

### 특수 케이스

- **오버플로우 발생 시**: Design Agent가 Content Agent에게 콘텐츠 압축 요청 가능
- **브랜드 색상 지정 시**: 사용자 브랜딩 정보가 테마보다 우선

---

## 7. 오류 처리 규약

### 7.1 에러 코드

| 코드 | 의미 | 대응 |
|------|------|------|
| `INVALID_INPUT` | 입력 스키마 불일치 | 입력 검증 후 재시도 |
| `LAYER_VIOLATION` | 레이어 침범 | 즉시 중단, 로그 기록 |
| `OVERFLOW_ERROR` | 콘텐츠 오버플로우 | 자동 수정 시도 |
| `CONTRAST_ERROR` | 색상 대비 부족 | 자동 색상 조정 |
| `SCHEMA_ERROR` | 출력 스키마 불일치 | 즉시 중단 |

### 7.2 자동 복구 우선순위 (오버플로우)

```
1. 문장 압축 (동의어/군더더기 제거)
2. 불릿 수 줄이기
3. 2단 레이아웃 전환
4. 슬라이드 분할
5. 폰트 축소 (최후 수단, 최소 10pt까지만)
```

---

## 8. 출력 포맷 표준

### 8.1 JSON 출력 규칙

```json
{
  "success": true,
  "data": {
    // 에이전트별 데이터
  },
  "metadata": {
    "agentId": "outline-agent",
    "version": "1.0.0",
    "executedAt": "2025-01-15T10:00:00Z",
    "duration": 1234
  }
}
```

### 8.2 ID 생성 규칙

- 슬라이드 ID: UUID v4 (`uuid.v4()`)
- 블록 그룹 ID: `group-{slideIndex}-{blockIndex}`

### 8.3 타임스탬프 형식

- ISO 8601: `YYYY-MM-DDTHH:mm:ssZ`

---

## 9. 검증 체크리스트

모든 에이전트 출력은 다음을 만족해야 합니다:

- [ ] Zod 스키마 검증 통과
- [ ] 레이어 침범 없음
- [ ] 필수 필드 모두 존재
- [ ] ID 중복 없음
- [ ] 텍스트 제한 준수
- [ ] 색상 대비 4.5:1 이상

---

## 10. 버전 호환성

| 스키마 버전 | 지원 에이전트 버전 |
|------------|-------------------|
| 1.0.0 | 모든 에이전트 |

스키마 변경 시 모든 에이전트 문서를 동시에 업데이트해야 합니다.
