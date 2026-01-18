/**
 * Layout Engine - 슬라이드 레이아웃 좌표 계산
 * 
 * ⚠️ 핵심 원칙: 모든 좌표는 이 엔진에서만 결정됩니다
 * - Outline Agent: 좌표 결정 금지
 * - SpecBuilder: 좌표 결정 금지
 * - Renderer: 이 엔진의 결과만 사용
 */

import type {
  DeckSpec,
  SlideSpec,
  ContentBlock,
  Theme,
  LayoutResult,
  LayoutedSlide,
  LayoutedBlock,
  BoundingBox,
  SlideType,
} from '../../types/slideSpec';

// ============================================
// 1. 레이아웃 상수
// ============================================

export const LAYOUT_CONSTANTS = {
  // 캔버스 (16:9 widescreen)
  CANVAS: {
    WIDTH: 13.333,  // inches
    HEIGHT: 7.5,    // inches
  },
  
  // 영역 정의 (inches)
  ZONES: {
    TITLE: { y: 0.5, height: 0.8 },
    CONTENT: { y: 1.5, height: 5.2 },
    FOOTNOTE: { y: 6.9, height: 0.4 },
  },
  
  // 마진 (inches)
  MARGIN: {
    SAFE: 0.5,
    READABLE: 0.7,
  },
  
  // 그리드
  GRID: {
    COLUMNS: 12,
    GUTTER: 0.2,
  },
} as const;

// ============================================
// 2. 그리드 시스템
// ============================================

export class GridSystem {
  private theme: Theme;
  private columnWidth: number;
  
  constructor(theme: Theme) {
    this.theme = theme;
    this.columnWidth = this.calculateColumnWidth();
  }
  
  private calculateColumnWidth(): number {
    const { canvas, columns, gutter, readableMargin } = this.theme.grid;
    const availableWidth = canvas.width - (readableMargin * 2);
    const totalGutter = gutter * (columns - 1);
    return (availableWidth - totalGutter) / columns;
  }
  
  /** 컬럼 수를 너비로 변환 */
  columnsToWidth(cols: number): number {
    const gutter = this.theme.grid.gutter;
    return (this.columnWidth * cols) + (gutter * (cols - 1));
  }
  
  /** 컬럼 시작 X 좌표 */
  columnStartX(colIndex: number): number {
    const margin = this.theme.grid.readableMargin;
    const gutter = this.theme.grid.gutter;
    return margin + (this.columnWidth + gutter) * colIndex;
  }
  
  /** 콘텐츠 영역 */
  getContentArea(): BoundingBox {
    const margin = this.theme.grid.readableMargin;
    return {
      x: margin,
      y: LAYOUT_CONSTANTS.ZONES.CONTENT.y,
      width: this.theme.grid.canvas.width - (margin * 2),
      height: LAYOUT_CONSTANTS.ZONES.CONTENT.height,
    };
  }
  
  /** 제목 영역 */
  getTitleArea(): BoundingBox {
    const margin = this.theme.grid.readableMargin;
    return {
      x: margin,
      y: LAYOUT_CONSTANTS.ZONES.TITLE.y,
      width: this.theme.grid.canvas.width - (margin * 2),
      height: LAYOUT_CONSTANTS.ZONES.TITLE.height,
    };
  }
}

// ============================================
// 3. 슬라이드 타입별 레이아웃 전략
// ============================================

interface LayoutStrategy {
  layout(
    slide: SlideSpec,
    grid: GridSystem,
    theme: Theme
  ): LayoutedSlide;
}

/** 타이틀 슬라이드 레이아웃 */
class TitleSlideLayout implements LayoutStrategy {
  layout(slide: SlideSpec, grid: GridSystem, theme: Theme): LayoutedSlide {
    const canvas = theme.grid.canvas;
    const margin = theme.grid.readableMargin;
    
    return {
      slideId: slide.id,
      titleBox: {
        x: margin,
        y: canvas.height * 0.35,
        width: canvas.width - (margin * 2),
        height: 1.2,
      },
      subtitleBox: slide.subtitle ? {
        x: margin,
        y: canvas.height * 0.55,
        width: canvas.width - (margin * 2),
        height: 0.6,
      } : undefined,
      blocks: [],
    };
  }
}

/** 일반 콘텐츠 슬라이드 레이아웃 */
class ContentSlideLayout implements LayoutStrategy {
  layout(slide: SlideSpec, grid: GridSystem, theme: Theme): LayoutedSlide {
    const titleArea = grid.getTitleArea();
    const contentArea = grid.getContentArea();
    const blocks: LayoutedBlock[] = [];
    
    let currentY = contentArea.y;
    const blockGap = 0.3; // inches between blocks
    
    slide.blocks.forEach((block, index) => {
      const height = this.estimateBlockHeight(block, contentArea.width, theme);
      
      blocks.push({
        blockIndex: index,
        box: {
          x: contentArea.x,
          y: currentY,
          width: contentArea.width,
          height,
        },
        computedFontSize: this.getBlockFontSize(block, theme),
        hasOverflow: currentY + height > contentArea.y + contentArea.height,
      });
      
      currentY += height + blockGap;
    });
    
    return {
      slideId: slide.id,
      titleBox: {
        ...titleArea,
      },
      blocks,
    };
  }
  
  private estimateBlockHeight(
    block: ContentBlock,
    maxWidth: number,
    theme: Theme
  ): number {
    switch (block.type) {
      case 'text':
        return this.estimateTextHeight(block.content, maxWidth, theme);
      case 'bulletList':
        return block.items.length * 0.4; // ~0.4in per bullet
      case 'chart':
        return 3.5; // default chart height
      case 'table':
        return (block.rows.length + 1) * 0.35;
      case 'image':
        return 3.0;
      default:
        return 1.0;
    }
  }
  
  private estimateTextHeight(
    content: string,
    maxWidth: number,
    theme: Theme
  ): number {
    // 대략적 계산: 72pt = 1inch, 평균 문자폭 기준
    const fontSize = theme.fontSizes.body;
    const lineHeight = theme.lineHeights.body;
    const charsPerInch = 72 / (fontSize * 0.6); // 대략적 문자폭
    const charsPerLine = maxWidth * charsPerInch;
    const lines = Math.ceil(content.length / charsPerLine);
    return lines * (fontSize / 72) * lineHeight;
  }
  
  private getBlockFontSize(block: ContentBlock, theme: Theme): number {
    // table 블록은 다른 style 타입을 가짐
    if (block.type === 'table') {
      return theme.fontSizes.body;
    }
    if ('style' in block && block.style && 'fontSize' in block.style && block.style.fontSize) {
      return block.style.fontSize;
    }
    return theme.fontSizes.body;
  }
}

/** 2단 레이아웃 */
class TwoColumnLayout implements LayoutStrategy {
  layout(slide: SlideSpec, grid: GridSystem, theme: Theme): LayoutedSlide {
    const titleArea = grid.getTitleArea();
    const contentArea = grid.getContentArea();
    const blocks: LayoutedBlock[] = [];
    
    const columnWidth = (contentArea.width - theme.grid.gutter) / 2;
    const leftX = contentArea.x;
    const rightX = contentArea.x + columnWidth + theme.grid.gutter;
    
    // 블록을 좌우로 분배
    const midPoint = Math.ceil(slide.blocks.length / 2);
    
    slide.blocks.forEach((block, index) => {
      const isLeft = index < midPoint;
      const columnBlocks = isLeft 
        ? slide.blocks.slice(0, midPoint)
        : slide.blocks.slice(midPoint);
      const localIndex = isLeft ? index : index - midPoint;
      
      const yOffset = localIndex * 1.2; // 블록당 간격
      
      blocks.push({
        blockIndex: index,
        box: {
          x: isLeft ? leftX : rightX,
          y: contentArea.y + yOffset,
          width: columnWidth,
          height: 1.0,
        },
        hasOverflow: contentArea.y + yOffset + 1.0 > contentArea.y + contentArea.height,
      });
    });
    
    return {
      slideId: slide.id,
      titleBox: titleArea,
      blocks,
    };
  }
}

/** 차트 중심 레이아웃 */
class ChartSlideLayout implements LayoutStrategy {
  layout(slide: SlideSpec, grid: GridSystem, theme: Theme): LayoutedSlide {
    const titleArea = grid.getTitleArea();
    const contentArea = grid.getContentArea();
    const blocks: LayoutedBlock[] = [];
    
    // 차트 블록 찾기
    const chartIndex = slide.blocks.findIndex(b => b.type === 'chart');
    
    slide.blocks.forEach((block, index) => {
      if (block.type === 'chart') {
        // 차트는 중앙에 크게
        blocks.push({
          blockIndex: index,
          box: {
            x: contentArea.x + 0.5,
            y: contentArea.y,
            width: contentArea.width - 1,
            height: contentArea.height - 0.5,
          },
          hasOverflow: false,
        });
      } else {
        // 다른 블록은 하단에 작게
        blocks.push({
          blockIndex: index,
          box: {
            x: contentArea.x,
            y: contentArea.y + contentArea.height - 0.8,
            width: contentArea.width,
            height: 0.6,
          },
          hasOverflow: false,
        });
      }
    });
    
    return {
      slideId: slide.id,
      titleBox: titleArea,
      blocks,
    };
  }
}

/** 이미지 히어로 레이아웃 */
class ImageHeroLayout implements LayoutStrategy {
  layout(slide: SlideSpec, grid: GridSystem, theme: Theme): LayoutedSlide {
    const titleArea = grid.getTitleArea();
    const contentArea = grid.getContentArea();
    const blocks: LayoutedBlock[] = [];
    
    const imagePriority = slide.constraints?.imagePriority || 'right';
    const imageWidth = contentArea.width * 0.55;
    const textWidth = contentArea.width * 0.4;
    
    slide.blocks.forEach((block, index) => {
      if (block.type === 'image') {
        blocks.push({
          blockIndex: index,
          box: {
            x: imagePriority === 'left' 
              ? contentArea.x 
              : contentArea.x + textWidth + theme.grid.gutter,
            y: contentArea.y,
            width: imageWidth,
            height: contentArea.height,
          },
          hasOverflow: false,
        });
      } else {
        blocks.push({
          blockIndex: index,
          box: {
            x: imagePriority === 'left'
              ? contentArea.x + imageWidth + theme.grid.gutter
              : contentArea.x,
            y: contentArea.y,
            width: textWidth,
            height: contentArea.height,
          },
          hasOverflow: false,
        });
      }
    });
    
    return {
      slideId: slide.id,
      titleBox: titleArea,
      blocks,
    };
  }
}

// ============================================
// 4. 레이아웃 전략 팩토리
// ============================================

const layoutStrategies: Record<SlideType, LayoutStrategy> = {
  title: new TitleSlideLayout(),
  sectionTitle: new TitleSlideLayout(),
  agenda: new ContentSlideLayout(),
  content: new ContentSlideLayout(),
  twoColumn: new TwoColumnLayout(),
  threeColumn: new TwoColumnLayout(), // TODO: 3단 구현
  comparison: new TwoColumnLayout(),
  chart: new ChartSlideLayout(),
  imageHero: new ImageHeroLayout(),
  imageGallery: new ImageHeroLayout(), // TODO: 갤러리 구현
  quote: new ContentSlideLayout(),
  timeline: new ContentSlideLayout(), // TODO: 타임라인 구현
  process: new ContentSlideLayout(), // TODO: 프로세스 구현
  summary: new ContentSlideLayout(),
  qna: new TitleSlideLayout(),
  closing: new TitleSlideLayout(),
};

// ============================================
// 5. Layout Engine 메인 클래스
// ============================================

export class LayoutEngine {
  private theme: Theme;
  private grid: GridSystem;
  
  constructor(theme: Theme) {
    this.theme = theme;
    this.grid = new GridSystem(theme);
  }
  
  /**
   * 전체 덱 레이아웃 계산
   */
  calculateLayout(deckSpec: DeckSpec): LayoutResult {
    const slides = deckSpec.slides.map(slide => this.layoutSlide(slide));
    
    return {
      slides,
      generatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * 단일 슬라이드 레이아웃 계산
   */
  layoutSlide(slide: SlideSpec): LayoutedSlide {
    const strategy = layoutStrategies[slide.type] || layoutStrategies.content;
    return strategy.layout(slide, this.grid, this.theme);
  }
  
  /**
   * 오버플로우 슬라이드 감지
   */
  detectOverflows(layoutResult: LayoutResult): number[] {
    return layoutResult.slides
      .filter(slide => slide.blocks.some(b => b.hasOverflow))
      .map(slide => layoutResult.slides.indexOf(slide));
  }
  
  /**
   * 슬라이드 분할 제안
   */
  suggestSplit(
    slide: SlideSpec,
    layoutedSlide: LayoutedSlide
  ): { shouldSplit: boolean; splitAt?: number } {
    const overflowingBlocks = layoutedSlide.blocks.filter(b => b.hasOverflow);
    
    if (overflowingBlocks.length === 0) {
      return { shouldSplit: false };
    }
    
    // 첫 번째 오버플로우 블록 앞에서 분할 제안
    const firstOverflow = overflowingBlocks[0];
    return {
      shouldSplit: true,
      splitAt: firstOverflow.blockIndex,
    };
  }
}

// ============================================
// 6. 편의 함수
// ============================================

export function createLayoutEngine(theme: Theme): LayoutEngine {
  return new LayoutEngine(theme);
}

export function calculateDeckLayout(
  deckSpec: DeckSpec,
  theme: Theme
): LayoutResult {
  const engine = new LayoutEngine(theme);
  return engine.calculateLayout(deckSpec);
}
