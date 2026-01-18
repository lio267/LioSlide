# 🎯 Claude Code 서브에이전트 PPT 자동 생성 시스템 (완성본)

## 📌 이 문서의 목적

Claude Code 터미널에서 **서브에이전트 구조**를 활용해 **무료로 고퀄리티 PPT**를 자동 생성하는 규칙입니다.
이 파일을 프로젝트 루트에 `CLAUDE.md`로 저장하면 Claude Code가 자동으로 참조합니다.

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎯 ORCHESTRATOR (오케스트레이터)               │
│                      PPT 생성 총괄 관리자                         │
│         - 사용자 요청 분석                                        │
│         - 작업 분할 및 할당                                       │
│         - 진행 상황 모니터링                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
   │  📋 Agent 1     │ │  ✍️ Agent 2     │ │  🎨 Agent 3     │
   │   구조 설계      │ │   콘텐츠 작성    │ │   디자인 결정    │
   │                 │ │                 │ │                 │
   │ - 슬라이드 수    │ │ - 제목 작성     │ │ - 색상 팔레트   │
   │ - 슬라이드 유형  │ │ - 본문 내용     │ │ - 폰트 스타일   │
   │ - 순서 배치     │ │ - 키포인트      │ │ - 레이아웃     │
   └─────────────────┘ └─────────────────┘ └─────────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    🔧 HTML 슬라이드 생성기                     │
   │              각 슬라이드를 HTML 파일로 변환                     │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    📦 PPTX 변환기                             │
   │              html2pptx로 최종 PPT 파일 생성                    │
   └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    ✅ 품질 검증기                              │
   │              시각적 검토 및 오류 수정                          │
   └─────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1: 구조 설계 에이전트

### 역할

사용자 요청을 분석하여 PPT 전체 구조를 설계합니다.

### 입력

- 주제 (topic)
- 목적 (purpose)
- 대상 (audience)
- 슬라이드 수 (slide_count)

### 출력 형식 (JSON)

```json
{
  "presentation": {
    "title": "프레젠테이션 제목",
    "subtitle": "부제목",
    "author": "작성자",
    "date": "날짜",
    "total_slides": 10
  },
  "slides": [
    {
      "index": 1,
      "type": "title",
      "layout": "center",
      "purpose": "표지 - 청중의 주목을 끄는 첫인상"
    },
    {
      "index": 2,
      "type": "agenda",
      "layout": "list",
      "purpose": "목차 - 발표 흐름 안내"
    },
    {
      "index": 3,
      "type": "content",
      "layout": "text-image",
      "purpose": "핵심 내용 1"
    },
    {
      "index": 4,
      "type": "content",
      "layout": "two-column",
      "purpose": "핵심 내용 2"
    },
    {
      "index": 5,
      "type": "comparison",
      "layout": "side-by-side",
      "purpose": "비교 분석"
    },
    {
      "index": 6,
      "type": "data",
      "layout": "chart",
      "purpose": "데이터 시각화"
    },
    {
      "index": 7,
      "type": "content",
      "layout": "cards",
      "purpose": "세부 내용"
    },
    {
      "index": 8,
      "type": "quote",
      "layout": "center",
      "purpose": "핵심 메시지 강조"
    },
    {
      "index": 9,
      "type": "summary",
      "layout": "list",
      "purpose": "요약 및 정리"
    },
    {
      "index": 10,
      "type": "closing",
      "layout": "center",
      "purpose": "마무리 및 Q&A"
    }
  ]
}
```

### 슬라이드 유형 정의

| 유형         | 설명          | 권장 레이아웃                 |
| ------------ | ------------- | ----------------------------- |
| `title`      | 표지 슬라이드 | center                        |
| `agenda`     | 목차          | list                          |
| `content`    | 일반 내용     | text-image, two-column, cards |
| `comparison` | 비교          | side-by-side                  |
| `data`       | 차트/그래프   | chart                         |
| `quote`      | 인용/강조     | center                        |
| `summary`    | 요약          | list                          |
| `closing`    | 마무리        | center                        |

---

## ✍️ Phase 2: 콘텐츠 에이전트

### 역할

각 슬라이드에 들어갈 실제 내용을 작성합니다.

### 작성 규칙

```
[필수 규칙]
✅ 제목: 최대 8단어 (핵심만)
✅ 부제목: 최대 15단어
✅ 본문 포인트: 슬라이드당 3-5개
✅ 각 포인트: 1-2문장 (20단어 이내)
✅ 전문용어 → 쉬운 말로 변환
✅ 숫자/데이터는 구체적으로

[금지 규칙]
❌ 장황한 설명
❌ 문단 형식의 긴 텍스트
❌ 불필요한 수식어
❌ 같은 내용 반복

[타이포그래피 규칙 - 1280x720 기준]
📌 표지 제목: 56-64px, font-weight: 800
📌 슬라이드 제목: 44-48px, font-weight: 700
📌 부제목: 20-24px, font-weight: 600, color: primary
📌 본문 메인: 22-24px, font-weight: 600
📌 본문 상세: 18-20px, font-weight: 400
📌 카드 제목: 26-28px, font-weight: 700
📌 카드 내용: 18-20px, line-height: 1.6
```

### 출력 형식 (JSON)

```json
{
  "slide_1": {
    "type": "title",
    "title": "AI가 바꾸는 미래",
    "subtitle": "2025년 핵심 트렌드와 비즈니스 기회",
    "footer": "2025.01 | 발표자명"
  },
  "slide_2": {
    "type": "agenda",
    "title": "오늘의 주제",
    "items": [
      "AI 기술 현황",
      "주요 트렌드 3가지",
      "실제 적용 사례",
      "미래 전망"
    ]
  },
  "slide_3": {
    "type": "content",
    "title": "AI 시장 폭발적 성장",
    "points": [
      {
        "main": "글로벌 AI 시장 규모 $200B 돌파",
        "detail": "전년 대비 35% 성장"
      },
      {
        "main": "기업 70%가 AI 도입 완료 또는 계획 중",
        "detail": "특히 제조, 금융, 헬스케어 분야"
      },
      {
        "main": "AI 인재 수요 300% 증가",
        "detail": "공급 대비 심각한 부족 상태"
      }
    ]
  },
  "slide_4": {
    "type": "comparison",
    "title": "Before vs After AI",
    "left": {
      "heading": "기존 방식",
      "points": ["수작업 데이터 분석", "주 단위 리포트", "제한된 인사이트"]
    },
    "right": {
      "heading": "AI 도입 후",
      "points": [
        "자동화된 실시간 분석",
        "즉시 리포트 생성",
        "예측 기반 의사결정"
      ]
    }
  }
}
```

---

## 🎨 Phase 3: 디자인 에이전트

### 역할

PPT의 시각적 스타일을 결정합니다.

### 스타일 프리셋 (7개 테마)

#### 1. corporate-blue (비즈니스 블루) ⭐ 기본

```css
:root {
  --color-surface: #ffffff;
  --color-surface-foreground: #1e293b;
  --color-primary: #2563eb;
  --color-primary-foreground: #ffffff;
  --color-muted: #f8fafc;
  --color-muted-foreground: #64748b;
  --color-accent: #f97316;
  --color-border: #cbd5e1;
  --font-family-display: Pretendard, Arial, sans-serif;
  --font-family-content: Pretendard, Arial, sans-serif;
}
```

**특징**: 신뢰감, 비즈니스 적합, 가독성 좋음

#### 2. dark-professional (다크 프로페셔널)

```css
:root {
  --color-surface: #09090b;
  --color-surface-foreground: #fafafa;
  --color-primary: #fafafa;
  --color-primary-foreground: #09090b;
  --color-muted: #18181b;
  --color-muted-foreground: #a1a1aa;
  --color-accent: #d4af37;
  --color-border: #27272a;
  --font-family-display: Pretendard, Arial, sans-serif;
  --font-family-content: Pretendard, Arial, sans-serif;
}
```

**특징**: 세련됨, 프리미엄 느낌, 임팩트 있음

#### 3. minimal-white (미니멀 화이트)

```css
:root {
  --color-surface: #ffffff;
  --color-surface-foreground: #171717;
  --color-primary: #171717;
  --color-primary-foreground: #ffffff;
  --color-muted: #fafafa;
  --color-muted-foreground: #737373;
  --color-accent: #171717;
  --color-border: #e5e5e5;
  --font-family-display: Pretendard, Arial, sans-serif;
  --font-family-content: Pretendard, Arial, sans-serif;
}
```

**특징**: 깔끔, 심플, 여백의 미학

#### 4. creative-yellow (크리에이티브 옐로우)

```css
:root {
  --color-surface: #fffbeb;
  --color-surface-foreground: #1c1917;
  --color-primary: #f59e0b;
  --color-primary-foreground: #ffffff;
  --color-muted: #fef3c7;
  --color-muted-foreground: #57534e;
  --color-accent: #ff6b35;
  --color-border: #fde68a;
  --font-family-display: Pretendard, Arial, sans-serif;
  --font-family-content: Pretendard, Arial, sans-serif;
}
```

**특징**: 활기찬, 창의적, 에너지 넘침

#### 5. soft-gradient (소프트 그라데이션)

```css
:root {
  --color-surface: #faf5ff;
  --color-surface-foreground: #3b0764;
  --color-primary: #7c3aed;
  --color-primary-foreground: #ffffff;
  --color-muted: #f3e8ff;
  --color-muted-foreground: #6b21a8;
  --color-accent: #f472b6;
  --color-border: #ddd6fe;
  --font-family-display: Pretendard, Arial, sans-serif;
  --font-family-content: Pretendard, Arial, sans-serif;
}
```

**특징**: 부드러운, 파스텔, 우아한

#### 6. modern-teal (모던 틸)

```css
:root {
  --color-surface: #f0fdfa;
  --color-surface-foreground: #134e4a;
  --color-primary: #0d9488;
  --color-primary-foreground: #ffffff;
  --color-muted: #ccfbf1;
  --color-muted-foreground: #115e59;
  --color-accent: #f97316;
  --color-border: #99f6e4;
  --font-family-display: Pretendard, Arial, sans-serif;
  --font-family-content: Pretendard, Arial, sans-serif;
}
```

**특징**: 모던, 테크/스타트업, 신선함

#### 7. high-contrast (하이 콘트라스트)

```css
:root {
  --color-surface: #000000;
  --color-surface-foreground: #ffffff;
  --color-primary: #ffcc00;
  --color-primary-foreground: #000000;
  --color-muted: #1a1a1a;
  --color-muted-foreground: #cccccc;
  --color-accent: #ff6600;
  --color-border: #333333;
  --font-family-display: Pretendard, Arial, sans-serif;
  --font-family-content: Pretendard, Arial, sans-serif;
}
```

**특징**: 강렬함, 주목도 높음, 발표장에서 잘 보임

### 출력 형식 (JSON)

```json
{
  "style_preset": "dark-professional",
  "css_variables": {
    "--color-surface": "#0d1117",
    "--color-surface-foreground": "#f0f6fc",
    "--color-primary": "#58a6ff"
  },
  "typography": {
    "title_size": "52px",
    "subtitle_size": "24px",
    "heading_size": "40px",
    "body_main_size": "20px",
    "body_detail_size": "16px",
    "caption_size": "14px",
    "title_weight": "800",
    "heading_weight": "700",
    "body_weight": "500",
    "style_note": "귀여운 느낌: 둥근 모서리(12-16px), 적당한 굵기, 컴팩트한 배치"
  },
  "spacing": {
    "slide_padding": "40px 60px",
    "element_gap": "14px",
    "section_gap": "20px",
    "card_padding": "18px",
    "card_gap": "12px",
    "style_note": "꽉 차는 느낌: 여백 최소화, 빽빽한 배치, 넓은 콘텐츠 영역"
  }
}
```

---

## 🔧 Phase 4: HTML 슬라이드 생성

### 기본 구조

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body class="col bg-surface" style="width:960px;height:540px;">
    <!-- 타이틀 존 (상단 100px) -->
    <div style="width:920px;margin:0 20px;padding-top:20px;" class="fit">
      <h1 style="font-size:36px;">슬라이드 제목</h1>
    </div>

    <!-- 콘텐츠 존 (중앙 380px) -->
    <div class="fill-height" style="padding:20px 40px;">
      <!-- 내용 -->
    </div>

    <!-- 푸터 존 (하단 40px) -->
    <div class="fit" style="padding:10px 40px;">
      <p style="font-size:10px;opacity:0.5;">푸터 텍스트</p>
    </div>
  </body>
</html>
```

### 레이아웃 템플릿

#### 표지 (title)

```html
<body class="col center bg-surface" style="width:960px;height:540px;">
  <div style="text-align:center;padding:40px;">
    <h1
      style="font-size:52px;font-weight:bold;margin-bottom:20px;color:var(--color-surface-foreground);"
    >
      {MAIN_TITLE}
    </h1>
    <p style="font-size:24px;opacity:0.8;margin-bottom:40px;">{SUBTITLE}</p>
    <p style="font-size:14px;opacity:0.5;">{DATE} | {AUTHOR}</p>
  </div>
</body>
```

#### 목차 (agenda)

```html
<body class="col bg-surface" style="width:960px;height:540px;padding:40px;">
  <div style="width:880px;margin:0 20px;" class="fit">
    <h1 style="font-size:40px;margin-bottom:30px;">{TITLE}</h1>
  </div>
  <div class="fill-height row" style="padding:0 40px;gap:40px;">
    <div class="fill-width">
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div class="row" style="gap:15px;align-items:center;">
          <span
            class="bg-primary"
            style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;"
            >1</span
          >
          <span style="font-size:20px;">{ITEM_1}</span>
        </div>
        <div class="row" style="gap:15px;align-items:center;">
          <span
            class="bg-primary"
            style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;"
            >2</span
          >
          <span style="font-size:20px;">{ITEM_2}</span>
        </div>
        <!-- 추가 항목 -->
      </div>
    </div>
  </div>
</body>
```

#### 콘텐츠 - 리스트형 (content-list)

```html
<body class="col bg-surface" style="width:960px;height:540px;padding:40px;">
  <div style="width:880px;margin:0 20px;" class="fit">
    <h1 style="font-size:36px;margin-bottom:10px;">{TITLE}</h1>
  </div>
  <div class="fill-height" style="padding:20px 40px;">
    <ul style="font-size:20px;line-height:2;list-style:none;padding:0;">
      <li style="margin-bottom:15px;padding-left:30px;position:relative;">
        <span style="position:absolute;left:0;color:var(--color-primary);"
          >●</span
        >
        <strong>{POINT_1_MAIN}</strong>
        <span style="opacity:0.7;display:block;font-size:16px;margin-top:5px;"
          >{POINT_1_DETAIL}</span
        >
      </li>
      <!-- 추가 포인트 -->
    </ul>
  </div>
</body>
```

#### 비교형 (comparison)

```html
<body class="col bg-surface" style="width:960px;height:540px;padding:40px;">
  <div style="width:880px;margin:0 20px;" class="fit">
    <h1 style="font-size:36px;margin-bottom:20px;">{TITLE}</h1>
  </div>
  <div class="row fill-height" style="padding:0 20px;gap:20px;">
    <!-- 왼쪽 -->
    <div class="fill-width bg-muted rounded" style="padding:25px;">
      <h3
        style="font-size:22px;font-weight:bold;margin-bottom:20px;color:var(--color-primary);"
      >
        {LEFT_TITLE}
      </h3>
      <ul style="font-size:16px;line-height:1.8;padding-left:20px;">
        <li>{LEFT_POINT_1}</li>
        <li>{LEFT_POINT_2}</li>
        <li>{LEFT_POINT_3}</li>
      </ul>
    </div>
    <!-- 오른쪽 -->
    <div
      class="fill-width bg-primary rounded"
      style="padding:25px;color:white;"
    >
      <h3 style="font-size:22px;font-weight:bold;margin-bottom:20px;">
        {RIGHT_TITLE}
      </h3>
      <ul style="font-size:16px;line-height:1.8;padding-left:20px;">
        <li>{RIGHT_POINT_1}</li>
        <li>{RIGHT_POINT_2}</li>
        <li>{RIGHT_POINT_3}</li>
      </ul>
    </div>
  </div>
</body>
```

#### 카드형 (cards)

```html
<body class="col bg-surface" style="width:960px;height:540px;padding:40px;">
  <div style="width:880px;margin:0 20px;" class="fit">
    <h1 style="font-size:36px;margin-bottom:20px;">{TITLE}</h1>
  </div>
  <div class="row fill-height" style="padding:0 20px;gap:15px;">
    <!-- 카드 1 -->
    <div
      class="fill-width bg-muted rounded"
      style="padding:20px;display:flex;flex-direction:column;"
    >
      <div
        class="bg-primary"
        style="width:50px;height:50px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:15px;"
      >
        <span style="font-size:24px;color:white;">1</span>
      </div>
      <h4 style="font-size:18px;font-weight:bold;margin-bottom:10px;">
        {CARD_1_TITLE}
      </h4>
      <p style="font-size:14px;opacity:0.8;line-height:1.5;">{CARD_1_DESC}</p>
    </div>
    <!-- 카드 2, 3 동일 구조 -->
  </div>
</body>
```

#### 인용/강조 (quote)

**중요: 여러 줄 인용문은 `<br>` 태그 대신 각 줄을 별도의 `<p>` 태그로 분리해야 함 (텍스트 겹침 방지)**

```html
<body class="col center bg-primary" style="width:960px;height:540px;">
  <div style="text-align:center;padding:60px;max-width:800px;">
    <p style="font-size:36px;font-weight:bold;color:white;margin-bottom:16px;">
      {QUOTE_LINE_1}
    </p>
    <p style="font-size:36px;font-weight:bold;color:white;margin-bottom:16px;">
      {QUOTE_LINE_2}
    </p>
    <p style="font-size:36px;font-weight:bold;color:white;margin-bottom:48px;">
      {QUOTE_LINE_3}
    </p>
    <div style="width:80px;height:4px;background:#f97316;margin:0 auto 24px;"></div>
    <p style="font-size:18px;color:white;opacity:0.8;">— {QUOTE_AUTHOR}</p>
  </div>
</body>
```

#### 마무리 (closing)

```html
<body class="col center bg-surface" style="width:960px;height:540px;">
  <div style="text-align:center;padding:40px;">
    <h1 style="font-size:48px;font-weight:bold;margin-bottom:30px;">
      {CLOSING_TITLE}
    </h1>
    <p style="font-size:24px;opacity:0.7;margin-bottom:40px;">
      {CLOSING_MESSAGE}
    </p>
    <div style="font-size:16px;opacity:0.5;">
      <p>{CONTACT_INFO}</p>
    </div>
  </div>
</body>
```

---

## 📦 Phase 5: PPTX 변환

### 변환 스크립트 (generate-ppt.js)

```javascript
const pptxgen = require("pptxgenjs");
const { html2pptx } = require("./html2pptx");
const fs = require("fs");
const path = require("path");

async function generatePresentation(slideFiles, outputName, options = {}) {
  console.log("🚀 PPT 생성 시작...\n");

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";

  // 메타데이터 설정
  if (options.title) pptx.title = options.title;
  if (options.author) pptx.author = options.author;
  if (options.subject) pptx.subject = options.subject;

  // 각 슬라이드 변환
  for (let i = 0; i < slideFiles.length; i++) {
    const file = slideFiles[i];
    try {
      await html2pptx(file, pptx);
      console.log(`✅ [${i + 1}/${slideFiles.length}] ${file} 변환 완료`);
    } catch (error) {
      console.error(
        `❌ [${i + 1}/${slideFiles.length}] ${file} 변환 실패:`,
        error.message
      );
    }
  }

  // 저장
  await pptx.writeFile(outputName);
  console.log(`\n🎉 PPT 생성 완료: ${outputName}`);

  return outputName;
}

// 실행
const slides = fs
  .readdirSync("./slides")
  .filter((f) => f.endsWith(".html"))
  .sort()
  .map((f) => `./slides/${f}`);

generatePresentation(slides, "output.pptx", {
  title: "프레젠테이션 제목",
  author: "작성자",
  subject: "주제",
});
```

### 실행 명령어

```bash
# 1. html2pptx 라이브러리 추출 (최초 1회)
mkdir -p html2pptx && tar -xzf pptx-skill/html2pptx.tgz -C html2pptx

# 2. PPT 생성 실행
NODE_PATH="$(npm root -g)" node generate-ppt.js
```

---

## ✅ Phase 6: 품질 검증

### 검증 방법 (MCP 스크린샷 사용 금지)

```bash
# 1. PPTX → PDF 변환
soffice --headless --convert-to pdf output.pptx

# 2. PDF → 작은 이미지로 변환 (해상도 100)
pdftoppm -jpeg -r 100 output.pdf slide

# 3. 파일 목록 확인
ls -la slide-*.jpg
```

### 주의사항

- ❌ chrome-devtools MCP 스크린샷 사용 금지 (이미지 크기 에러 발생)
- ❌ take_screenshot 사용 금지
- ✅ pdftoppm으로 작은 이미지 생성 후 확인

```

---

## 즉시 해결 명령어

지금 바로 Claude Code에 입력:
```

MCP 스크린샷 기능 사용하지 말고,
soffice와 pdftoppm 명령어로 PDF 변환 후 검증해줘.
이미지 해상도는 100으로 낮춰서 생성해.

### 검증 체크리스트

| 항목   | 확인 사항      | 기준                      |
| ------ | -------------- | ------------------------- |
| 텍스트 | 잘림/겹침 없음 | 모든 텍스트 완전히 보임   |
| 정렬   | 요소 정렬 상태 | 일관된 좌우/상하 정렬     |
| 여백   | 가장자리 여백  | 최소 20px 유지            |
| 대비   | 텍스트 가독성  | 배경과 명확히 구분        |
| 일관성 | 스타일 통일    | 같은 유형은 같은 레이아웃 |
| 밀도   | 정보량         | 슬라이드당 3-5 포인트     |

### 문제 발견 시 수정 우선순위

1. **여백 증가** - padding/margin 늘리기
2. **폰트 크기 감소** - 텍스트가 넘치면
3. **내용 축소** - 포인트 수 줄이기
4. **레이아웃 변경** - 구조 자체를 재설계

---

## 🚀 실행 프롬프트 템플릿

### 기본 프롬프트 (복사해서 사용)

```
PPT를 만들어줘.

[기본 정보]
- 주제: {여기에 주제 입력}
- 목적: {발표/보고/제안/교육}
- 대상: {청중 설명}
- 슬라이드 수: {원하는 장수}
- 스타일: {corporate-blue/dark-professional/minimal-white/creative-yellow/soft-gradient/modern-teal/high-contrast}

[포함할 내용]
1. {핵심 내용 1}
2. {핵심 내용 2}
3. {핵심 내용 3}

[서브에이전트 실행 순서]
Phase 1: 구조 설계 → JSON으로 슬라이드 구조 출력
Phase 2: 콘텐츠 작성 → JSON으로 각 슬라이드 내용 출력
Phase 3: 디자인 결정 → CSS 변수 출력
Phase 4: HTML 생성 → 각 슬라이드 HTML 파일 생성
Phase 5: PPTX 변환 → html2pptx로 변환
Phase 6: 품질 검증 → 이미지로 확인 후 문제시 수정

각 Phase 완료 후 결과를 보여주고 다음 단계로 진행해줘.
최종 파일은 output.pptx로 저장해줘.
```

### 간단 프롬프트 (빠른 시작용)

```
다음 주제로 고퀄리티 PPT 만들어줘.

주제: {주제}
슬라이드: {장수}장
스타일: {스타일}

서브에이전트 방식으로 단계별로 진행하고, 최종 PPTX 파일 생성해줘.
```

### 상세 프롬프트 (맞춤 제작용)

```
PPT 제작을 요청합니다.

## 프로젝트 정보
- 제목: {프레젠테이션 제목}
- 부제목: {부제목}
- 작성자: {이름}
- 발표일: {날짜}

## 목적 및 대상
- 발표 목적: {목적 상세 설명}
- 청중: {대상 설명}
- 발표 시간: {예상 시간}

## 구조 요청
- 총 슬라이드: {장수}장
- 필수 포함 슬라이드:
  - 표지
  - 목차
  - {섹션1 제목} (약 3장)
  - {섹션2 제목} (약 3장)
  - 요약
  - Q&A

## 디자인 요청
- 스타일: {스타일 프리셋}
- 주요 색상: {색상 코드 또는 설명}
- 폰트 느낌: {모던/클래식/친근한}
- 특별 요청: {기타 디자인 요청}

## 콘텐츠 방향
- 핵심 메시지: {전달하고 싶은 핵심}
- 강조할 데이터: {숫자, 통계 등}
- 참고 자료: {있다면}

## 실행 지침
서브에이전트 구조로 다음 순서대로 진행해주세요:
1. 구조 설계 (JSON)
2. 콘텐츠 작성 (JSON)
3. 디자인 결정 (CSS)
4. HTML 슬라이드 생성
5. PPTX 변환
6. 품질 검증 및 수정

각 단계 결과를 확인할 수 있게 보여주세요.
```

---

## 📁 권장 폴더 구조

```
프로젝트/
├── CLAUDE.md              ← 이 파일 (규칙)
├── pptx-skill/            ← PPT 생성 도구
│   ├── SKILL.md
│   ├── html2pptx.md
│   ├── css.md
│   ├── html2pptx.tgz
│   └── ...
├── html2pptx/             ← 추출된 라이브러리
├── slides/                ← 생성된 HTML 슬라이드
│   ├── slide-01-title.html
│   ├── slide-02-agenda.html
│   └── ...
├── output/                ← 최종 결과물
│   ├── output.pptx
│   └── preview/
│       ├── slide-1.jpg
│       └── ...
├── styles/                ← CSS 스타일
│   └── theme.css
└── generate-ppt.js        ← 변환 스크립트
```

---

## ⚠️ 주의사항

### 폰트 제한

웹 안전 폰트만 사용 가능:

- Arial (권장)
- Georgia
- Times New Roman
- Courier New
- Verdana
- Trebuchet MS

### 색상 표기

```
✅ 올바른 표기: FF0000, 2563eb, 0d1117
❌ 잘못된 표기: #FF0000, red, rgb(255,0,0)
```

### 크기 고정

```
슬라이드 크기: 960px × 540px (16:9)
절대 변경 금지!
```

### 이미지 사용

```
❌ 외부 URL 이미지: 작동 안 함
✅ 로컬 파일만 가능: ./images/photo.jpg
```

### HTML 태그 규칙

```
❌ <br> 태그 사용 금지: 텍스트 겹침 현상 발생
✅ 여러 줄은 각각 별도의 <p> 태그로 분리
❌ <div> 안에 텍스트 직접 입력 금지
✅ 모든 텍스트는 <p>, <h1>-<h6> 태그로 감싸기
```

---

## 🔄 에러 처리

### 일반적인 에러와 해결책

| 에러         | 원인               | 해결책                          |
| ------------ | ------------------ | ------------------------------- |
| 텍스트 잘림  | 내용이 너무 많음   | 포인트 수 줄이기 또는 폰트 축소 |
| 요소 겹침    | 레이아웃 계산 오류 | gap/padding 조정                |
| 변환 실패    | HTML 구문 오류     | HTML 유효성 검사                |
| 폰트 깨짐    | 지원 안 되는 폰트  | Arial로 변경                    |
| 색상 안 나옴 | # 포함             | # 제거                          |

### 재시도 규칙

```
1. 첫 번째 시도 실패 → 에러 분석 후 수정
2. 두 번째 시도 실패 → 레이아웃 단순화
3. 세 번째 시도 실패 → 기본 템플릿으로 변경
```

---

## 📞 참조 문서

| 문서            | 경로                      | 용도            |
| --------------- | ------------------------- | --------------- |
| PPT 스킬 메인   | `pptx-skill/SKILL.md`     | 전체 워크플로우 |
| HTML→PPT 가이드 | `pptx-skill/html2pptx.md` | 변환 상세 방법  |
| CSS 프레임워크  | `pptx-skill/css.md`       | 스타일 클래스   |

---

_이 문서를 프로젝트 루트에 CLAUDE.md로 저장하면 Claude Code가 자동으로 참조합니다._
_버전: 2.1 | 최종 수정: 2026.01 | 테마: 7개 통합_
