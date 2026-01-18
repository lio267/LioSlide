# MCP 도구 통합 가이드

> 이 문서는 PPT 자동 생성기에서 MCP 도구들을 효과적으로 활용하는 방법을 설명합니다.

## 🎯 개요

MCP(Model Context Protocol) 도구들은 파이프라인의 각 단계에서 특정 역할을 수행합니다.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Sequence        │     │ Context7        │     │ Chrome          │
│ Thinking        │     │                 │     │ DevTools        │
│                 │     │                 │     │                 │
│ • 아웃라인 생성  │     │ • API 문서 참조  │     │ • 레이아웃 검사  │
│ • 흐름 설계     │     │ • 제약 확인      │     │ • 오버플로우 탐지│
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PPT 생성 파이프라인                          │
│  Outline → SpecBuilder → Layout → Render → StyleGuardian       │
└─────────────────────────────────────────────────────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│ GitHub          │                             │ 출력            │
│                 │                             │                 │
│ • 템플릿 저장   │                             │ • .pptx         │
│ • 버전 관리    │                             │ • slidespec.json│
└─────────────────┘                             └─────────────────┘
```

---

## 1. Sequence Thinking (씨퀀스띵킹)

### 역할
- **주 용도**: Outline Agent에서 슬라이드 목차 및 흐름 생성
- **핵심 가치**: "슬라이드별 한 문장 메시지"를 먼저 뽑아 품질 급상승

### 사용 시점
```typescript
// src/agents/outlineAgent.ts
import { useSequenceThinking } from '@mcp/sequence-thinking';

async function generateOutline(input: UserInput): Promise<OutlineAgentOutput> {
  const thinking = useSequenceThinking();
  
  // Step 1: 핵심 메시지 추출
  const keyMessages = await thinking.analyze({
    input: input.sourceContent,
    task: 'extract_key_points',
    constraints: {
      maxPoints: input.slideCount,
      style: input.tone,
    }
  });
  
  // Step 2: 흐름 최적화
  const optimizedFlow = await thinking.sequence({
    items: keyMessages,
    criteria: ['logical_flow', 'audience_engagement', 'time_allocation'],
  });
  
  // Step 3: 슬라이드 타입 결정
  const outline = optimizedFlow.map((msg, i) => ({
    order: i,
    type: determineSlideType(msg),
    title: msg.title,
    keyMessage: msg.summary, // 한 문장!
    contentHints: msg.supportingPoints,
    estimatedDensity: msg.contentDensity,
  }));
  
  return {
    outline,
    totalSlides: outline.length,
    sections: groupIntoSections(outline),
    thinkingLog: thinking.getLog(),
  };
}
```

### 프롬프트 패턴
```typescript
const OUTLINE_PROMPT = `
당신은 프레젠테이션 구조 전문가입니다.

입력: {sourceContent}
대상: {audience}
톤: {tone}
슬라이드 수: {slideCount}

다음 형식으로 각 슬라이드의 핵심 메시지를 추출하세요:

슬라이드 1: [한 문장 핵심 메시지]
- 지원 포인트 1
- 지원 포인트 2

규칙:
1. 각 슬라이드는 하나의 명확한 메시지만 전달
2. 메시지는 청중이 기억해야 할 것
3. 흐름이 논리적으로 연결되어야 함
`;
```

---

## 2. Context7 (컨텍스트7)

### 역할
- **주 용도**: pptxgenjs API 문서 및 제약 사항 참조
- **핵심 가치**: "가능/불가능"을 문서 기반으로 확정하여 환각 방지

### 사용 시점
```typescript
// src/renderer/pptxRenderer.ts
import { useContext7 } from '@mcp/context7';

async function validateRenderCapability(
  block: ContentBlock
): Promise<{ supported: boolean; constraints?: string[] }> {
  const ctx = useContext7();
  
  // pptxgenjs 문서에서 해당 기능 확인
  const capability = await ctx.query({
    library: 'pptxgenjs',
    feature: block.type,
    version: '3.x',
  });
  
  if (!capability.supported) {
    return {
      supported: false,
      constraints: capability.alternatives,
    };
  }
  
  return {
    supported: true,
    constraints: capability.limitations,
  };
}
```

### 캐시 전략
```typescript
// 자주 조회하는 제약 사항 캐시
const API_CONSTRAINTS_CACHE = {
  fonts: ['Arial', 'Helvetica', 'Times New Roman', ...], // web-safe만
  chartTypes: ['bar', 'line', 'pie', 'doughnut', 'area'],
  colorFormat: 'hex without #',
  maxSlides: 500,
  maxTextLength: 10000,
};

// Context7로 캐시 갱신
async function refreshConstraintsCache() {
  const ctx = useContext7();
  
  const latest = await ctx.getDocumentation({
    library: 'pptxgenjs',
    sections: ['fonts', 'charts', 'limitations'],
  });
  
  Object.assign(API_CONSTRAINTS_CACHE, latest);
}
```

### 문서 참조 예시
```typescript
// 차트 제약 확인
const chartConstraints = await ctx.query({
  library: 'pptxgenjs',
  feature: 'charts',
  question: 'What are the limitations of pie charts?',
});

// 결과: { maxDataPoints: 50, requiresSingleSeries: true, ... }
```

---

## 3. GitHub MCP

### 역할
- **주 용도**: 템플릿(테마) 저장 및 버전 관리
- **핵심 가치**: 사내 스타일 템플릿을 중앙 저장소에서 관리

### 저장소 구조
```
ppt-templates/
├── themes/
│   ├── corporate/
│   │   ├── blue.json
│   │   ├── green.json
│   │   └── dark.json
│   ├── creative/
│   │   ├── bold.json
│   │   └── minimal.json
│   └── custom/
│       └── {company-name}.json
├── layouts/
│   ├── title-slides/
│   ├── content-slides/
│   └── chart-slides/
└── examples/
    └── sample-decks/
```

### 사용 시점
```typescript
// src/utils/themeLoader.ts
import { useGitHub } from '@mcp/github';

async function loadTheme(themeName: string): Promise<Theme> {
  const gh = useGitHub();
  
  // 레포에서 테마 JSON 로드
  const themeFile = await gh.getFile({
    repo: 'company/ppt-templates',
    path: `themes/${themeName}.json`,
    ref: 'main', // 또는 특정 버전 태그
  });
  
  const theme = JSON.parse(themeFile.content);
  
  // zod로 검증
  return ThemeSchema.parse(theme);
}

async function saveCustomTheme(theme: Theme): Promise<void> {
  const gh = useGitHub();
  
  await gh.createOrUpdateFile({
    repo: 'company/ppt-templates',
    path: `themes/custom/${theme.name}.json`,
    content: JSON.stringify(theme, null, 2),
    message: `Add/Update theme: ${theme.name}`,
    branch: 'main',
  });
}
```

### 버전 관리
```typescript
// 특정 버전의 테마 로드
const theme = await loadTheme('corporate-blue', { version: 'v2.1.0' });

// 테마 변경 이력 조회
const history = await gh.getCommitHistory({
  repo: 'company/ppt-templates',
  path: 'themes/corporate-blue.json',
  limit: 10,
});
```

---

## 4. Chrome DevTools MCP

### 역할
- **주 용도**: HTML 프리뷰 캔버스에서 레이아웃 디버깅
- **핵심 가치**: 박스 좌표/오버플로우를 시각적으로 확인 후 PPTX에 동일 적용

### 워크플로우
```
1. SlideSpec → HTML 프리뷰 생성
2. Chrome DevTools로 레이아웃 검사
3. 오버플로우/정렬 문제 탐지
4. 수정 후 PPTX 렌더링
```

### 사용 시점
```typescript
// src/engine/layout/debugger.ts
import { useChromeDevTools } from '@mcp/chrome-devtools';

async function debugLayout(
  layoutResult: LayoutResult,
  htmlPreviewPath: string
): Promise<LayoutDebugReport> {
  const devtools = useChromeDevTools();
  
  // HTML 프리뷰 열기
  await devtools.open(htmlPreviewPath);
  
  // 모든 슬라이드 박스 검사
  const inspections = await Promise.all(
    layoutResult.slides.map(async (slide, i) => {
      // 슬라이드로 이동
      await devtools.navigateTo(`#slide-${i}`);
      
      // 박스 검사
      const boxes = await devtools.inspectElements({
        selector: '.content-block',
        properties: ['boundingBox', 'overflow', 'computedStyle'],
      });
      
      return {
        slideIndex: i,
        boxes,
        overflows: boxes.filter(b => b.overflow !== 'visible'),
        alignmentIssues: checkAlignment(boxes),
      };
    })
  );
  
  return {
    slides: inspections,
    hasIssues: inspections.some(s => s.overflows.length > 0),
  };
}
```

### 오버플로우 탐지
```typescript
async function detectOverflow(slideIndex: number): Promise<OverflowInfo[]> {
  const devtools = useChromeDevTools();
  
  // 오버플로우된 요소 찾기
  const overflowed = await devtools.evaluateScript(`
    Array.from(document.querySelectorAll('#slide-${slideIndex} .content-block'))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement.getBoundingClientRect();
        return (
          rect.right > parent.right ||
          rect.bottom > parent.bottom
        );
      })
      .map(el => ({
        id: el.id,
        overflow: {
          right: Math.max(0, el.getBoundingClientRect().right - el.parentElement.getBoundingClientRect().right),
          bottom: Math.max(0, el.getBoundingClientRect().bottom - el.parentElement.getBoundingClientRect().bottom),
        }
      }))
  `);
  
  return overflowed;
}
```

### 시각적 디버깅
```typescript
// 레이아웃 그리드 오버레이
await devtools.injectStyles(`
  .content-block {
    outline: 1px solid rgba(255, 0, 0, 0.3);
  }
  .slide-grid {
    background: 
      linear-gradient(90deg, rgba(0,0,255,0.1) 1px, transparent 1px),
      linear-gradient(rgba(0,0,255,0.1) 1px, transparent 1px);
    background-size: calc(100% / 12) 8pt;
  }
`);

// 마진 영역 표시
await devtools.injectStyles(`
  .safe-margin {
    border: 2px dashed rgba(255, 0, 0, 0.5);
  }
  .readable-margin {
    border: 1px dashed rgba(0, 255, 0, 0.5);
  }
`);
```

---

## 🔄 MCP 통합 파이프라인 예시

```typescript
// src/pipeline/generatePresentation.ts
import { useSequenceThinking } from '@mcp/sequence-thinking';
import { useContext7 } from '@mcp/context7';
import { useGitHub } from '@mcp/github';
import { useChromeDevTools } from '@mcp/chrome-devtools';

async function generatePresentation(input: UserInput): Promise<string> {
  const thinking = useSequenceThinking();
  const ctx7 = useContext7();
  const gh = useGitHub();
  const devtools = useChromeDevTools();
  
  // 1. 테마 로드 (GitHub)
  const theme = await gh.getFile({
    repo: 'company/ppt-templates',
    path: `themes/${input.branding?.template || 'default'}.json`,
  });
  
  // 2. 아웃라인 생성 (Sequence Thinking)
  const outline = await thinking.analyze({
    content: input.sourceContent,
    format: 'presentation_outline',
  });
  
  // 3. API 제약 확인 (Context7)
  const constraints = await ctx7.query({
    library: 'pptxgenjs',
    features: outline.requiredFeatures,
  });
  
  // 4. 스펙 빌드
  const spec = buildSpec(outline, theme, constraints);
  
  // 5. 레이아웃 계산
  const layout = calculateLayout(spec, theme);
  
  // 6. HTML 프리뷰 생성 및 디버깅 (Chrome DevTools)
  const previewPath = await generateHTMLPreview(spec, layout);
  const debugReport = await devtools.inspect(previewPath);
  
  if (debugReport.hasIssues) {
    // 이슈 수정 후 재계산
    const fixedSpec = await fixLayoutIssues(spec, debugReport);
    return generatePresentation({ ...input, spec: fixedSpec });
  }
  
  // 7. 최종 렌더링
  const outputPath = await render(spec, layout);
  
  // 8. 스펙 저장 (재현 가능)
  await saveSpec(spec, `${outputPath}.spec.json`);
  
  return outputPath;
}
```

---

## 📊 MCP 사용 통계 대시보드

```typescript
// MCP 도구 사용 모니터링
interface MCPUsageStats {
  sequenceThinking: {
    calls: number;
    avgDuration: number;
    successRate: number;
  };
  context7: {
    queries: number;
    cacheHits: number;
    cacheMisses: number;
  };
  github: {
    reads: number;
    writes: number;
    lastSync: string;
  };
  chromeDevTools: {
    inspections: number;
    issuesFound: number;
    issuesFixed: number;
  };
}
```

---

## ⚠️ 주의사항

1. **Sequence Thinking**: 토큰 사용량 모니터링 필요
2. **Context7**: 캐시 만료 시간 설정 (API 버전 변경 대비)
3. **GitHub**: 레이트 리밋 고려하여 배치 처리
4. **Chrome DevTools**: 헤드리스 모드에서 일부 기능 제한
