# CONTENT_AGENT.md - 콘텐츠 에이전트 스킬

> **역할**: 각 슬라이드의 실제 텍스트 콘텐츠를 작성합니다.
>
> **레이어**: Spec Layer (좌표/크기 결정 금지)

---

## 1. 역할 정의

### 담당 업무
- 슬라이드별 상세 텍스트 작성
- 불릿 포인트 콘텐츠 작성
- 발표자 노트 작성
- 톤/스타일에 맞는 문체 적용

### 담당하지 않는 업무
- ❌ 슬라이드 순서/구조 변경 (Outline Agent 담당)
- ❌ 레이아웃/색상/폰트 결정 (Design Agent 담당)
- ❌ 좌표/크기 계산 (Layout Engine 담당)
- ❌ 차트 데이터 시각화 (별도 처리)

---

## 2. 입력 스키마

```typescript
interface ContentAgentInput {
  slideOutline: SlideOutline;  // Outline Agent 출력
  userInput: {
    tone: PresentationTone;
    audience: string;
    sourceContent?: string;
    additionalInstructions?: string;
  };
  slideIndex: number;  // 0-based
}

interface SlideOutline {
  order: number;
  type: SlideType;
  title: string;
  keyMessage: string;
  contentHints: string[];
  estimatedDensity: 'sparse' | 'normal' | 'dense';
}
```

---

## 3. 출력 스키마

```typescript
interface ContentAgentOutput {
  slideIndex: number;
  blocks: ContentBlock[];
  notes?: string;  // 발표자 노트
}

type ContentBlock =
  | TextBlock
  | BulletListBlock;

interface TextBlock {
  type: 'text';
  content: string;
  importance: 1 | 2 | 3 | 4 | 5;  // 레이아웃 우선순위
  groupId?: string;  // 함께 유지할 블록 그룹
}

interface BulletListBlock {
  type: 'bulletList';
  items: BulletItem[];
  importance: 1 | 2 | 3 | 4 | 5;
  groupId?: string;
}

interface BulletItem {
  content: string;
  level: 0 | 1 | 2 | 3;  // 들여쓰기 레벨
}
```

---

## 4. 톤별 문체 가이드

### 4.1 Professional (전문적)
```
특징: 명확, 객관적, 데이터 중심
문장: 간결한 서술형
어휘: 업계 용어 사용 가능
예시: "AI 도입으로 업무 효율성이 30% 향상되었습니다."
```

### 4.2 Casual (캐주얼)
```
특징: 친근, 대화체, 쉬운 표현
문장: 짧은 문장, 질문형 활용
어휘: 일상 용어 위주
예시: "AI가 뭘 할 수 있을까요? 생각보다 많습니다!"
```

### 4.3 Academic (학술적)
```
특징: 정확, 근거 제시, 논리적
문장: 복문 가능, 인용 포함
어휘: 학술 용어, 출처 명시
예시: "Smith(2024)에 따르면, 생성형 AI의 생산성 향상 효과는..."
```

### 4.4 Creative (창의적)
```
특징: 감성적, 스토리텔링, 은유 활용
문장: 다양한 길이, 리듬감
어휘: 비유적 표현, 감각적 단어
예시: "AI는 새로운 시대의 문을 열고 있습니다."
```

### 4.5 Minimal (미니멀)
```
특징: 극도로 간결, 키워드 중심
문장: 명사형 종결, 단어 위주
어휘: 핵심 단어만
예시: "AI 도입 → 효율 30% ↑"
```

### 4.6 Energetic (활기찬)
```
특징: 열정적, 행동 유도, 감탄사
문장: 짧고 강렬, 명령형
어휘: 동적 동사, 강조 표현
예시: "지금 바로 시작하세요! 변화는 이미 시작됐습니다!"
```

### 4.7 Luxury (고급스러운)
```
특징: 우아, 절제, 품격
문장: 여유 있는 호흡, 간접 표현
어휘: 고급 어휘, 은은한 표현
예시: "탁월한 성과를 향한 여정이 시작됩니다."
```

---

## 5. 글자 수 제한

### 5.1 필수 제한

| 요소 | 최소 | 권장 | 최대 | 초과 시 처리 |
|------|------|------|------|-------------|
| 제목 | 2자 | 10-20자 | 40자 | 자동 축약 |
| 불릿 항목 | - | 20-40자 | 60자 | 줄 분리 |
| 불릿 개수 | 1개 | 3개 | **5개** | 슬라이드 분할 |
| 발표자 노트 | - | 50-100자 | 300자 | 자동 축약 |

### 5.2 계산 방법

```typescript
// 한글 기준 (영문은 0.5 가중치)
function countChars(text: string): number {
  let count = 0;
  for (const char of text) {
    count += /[\u3131-\uD79D]/.test(char) ? 1 : 0.5;
  }
  return Math.ceil(count);
}
```

---

## 6. 슬라이드 타입별 콘텐츠 패턴

### 6.1 title (표지)
```typescript
{
  blocks: [
    { type: 'text', content: /* 부제목 또는 태그라인 */, importance: 3 }
  ],
  notes: "환영 인사 및 발표 개요"
}
```

### 6.2 agenda (목차)
```typescript
{
  blocks: [
    {
      type: 'bulletList',
      items: [
        { content: "1. 섹션명", level: 0 },
        { content: "2. 섹션명", level: 0 },
        // ...
      ],
      importance: 4
    }
  ],
  notes: "각 섹션 간략 소개"
}
```

### 6.3 content (일반)
```typescript
{
  blocks: [
    { type: 'text', content: /* keyMessage 강조 */, importance: 5 },
    {
      type: 'bulletList',
      items: [
        { content: /* contentHint 확장 */, level: 0 },
        // ...
      ],
      importance: 3
    }
  ],
  notes: "상세 설명 및 예시"
}
```

### 6.4 twoColumn (2단)
```typescript
{
  blocks: [
    // 좌측 컬럼
    { type: 'text', content: "좌측 제목", importance: 4, groupId: 'left' },
    { type: 'bulletList', items: [...], importance: 3, groupId: 'left' },
    // 우측 컬럼
    { type: 'text', content: "우측 제목", importance: 4, groupId: 'right' },
    { type: 'bulletList', items: [...], importance: 3, groupId: 'right' },
  ],
  notes: "좌우 비교 설명"
}
```

### 6.5 summary (요약)
```typescript
{
  blocks: [
    {
      type: 'bulletList',
      items: [
        { content: "핵심 포인트 1", level: 0 },
        { content: "핵심 포인트 2", level: 0 },
        { content: "핵심 포인트 3", level: 0 },
      ],
      importance: 5
    }
  ],
  notes: "전체 발표 요약 및 핵심 메시지 재강조"
}
```

### 6.6 closing (마무리)
```typescript
{
  blocks: [
    { type: 'text', content: /* CTA 또는 감사 메시지 */, importance: 5 }
  ],
  notes: "마무리 인사, 연락처 안내"
}
```

---

## 7. 품질 체크리스트

작성한 콘텐츠가 다음을 만족하는지 확인:

- [ ] 톤/스타일이 일관적인가?
- [ ] 글자 수 제한 내인가?
- [ ] 불릿 5개 이하인가?
- [ ] keyMessage가 명확히 전달되는가?
- [ ] 청중 수준에 적합한 어휘인가?
- [ ] 발표자 노트가 발표에 도움이 되는가?

---

## 8. 출력 예시

```json
{
  "success": true,
  "data": {
    "slideIndex": 2,
    "blocks": [
      {
        "type": "text",
        "content": "AI는 더 이상 선택이 아닌 필수입니다",
        "importance": 5
      },
      {
        "type": "bulletList",
        "items": [
          { "content": "글로벌 AI 시장 규모 5,000억 달러 돌파", "level": 0 },
          { "content": "연평균 37% 성장률로 급성장 중", "level": 0 },
          { "content": "Fortune 500 기업 90%가 AI 도입 완료", "level": 0 }
        ],
        "importance": 3
      }
    ],
    "notes": "시장 데이터 출처: Gartner 2024. 청중에게 AI 도입이 선택이 아닌 생존의 문제임을 강조합니다."
  },
  "metadata": {
    "agentId": "content-agent",
    "version": "1.0.0",
    "slideIndex": 2,
    "executedAt": "2025-01-15T10:01:00Z",
    "duration": 800
  }
}
```

---

## 9. 제약 조건

### 9.1 필수 준수
- [ ] Outline Agent의 `contentHints`를 반드시 반영
- [ ] `keyMessage`를 슬라이드에 명시적으로 포함
- [ ] 불릿은 최대 5개
- [ ] 각 불릿은 1.5줄 이내

### 9.2 금지 사항
- ❌ 슬라이드 타입 변경
- ❌ 슬라이드 순서 변경
- ❌ 좌표/크기/색상 지정
- ❌ 폰트 크기/스타일 직접 지정
- ❌ 새로운 슬라이드 추가

---

## 10. 오버플로우 대응

콘텐츠가 너무 길 경우 자동 압축 적용:

### 10.1 압축 우선순위
```
1. 군더더기 제거 ("~의 경우" → 직접 서술)
2. 동의어 치환 (짧은 단어로)
3. 불릿 항목 통합
4. 불릿 수 감소 (5개 → 3개)
```

### 10.2 압축 예시
```
원본: "인공지능 기술의 발전으로 인하여 업무 효율성이 크게 향상되었습니다"
압축: "AI로 업무 효율 30% 향상"
```

---

## 11. 병렬 실행 정보

- **의존성**: Outline Agent 완료 후 실행
- **병렬 가능**: 슬라이드별로 독립 실행 가능
- **다음 단계**: Design Agent와 병렬 실행 가능

```
Outline Agent
     ↓
┌────┴────┐
│         │
Content   Design    ← 병렬 실행 가능
Agent     Agent
│         │
└────┬────┘
     ↓
DeckSpec 조립
```
