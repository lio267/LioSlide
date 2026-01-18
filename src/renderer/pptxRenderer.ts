/**
 * PPT Renderer - pptxgenjs를 사용한 실제 PPT 생성
 * 
 * ⚠️ 핵심 원칙: pptxgenjs import는 오직 이 레이어에서만 허용됩니다
 * - 좌표는 Layout Engine 결과만 사용 (여기서 계산 금지)
 * - SlideSpec의 의미적 정보를 시각적으로 변환
 */

import PptxGenJS from 'pptxgenjs';
import type {
  DeckSpec,
  SlideSpec,
  ContentBlock,
  LayoutResult,
  LayoutedSlide,
  LayoutedBlock,
  Theme,
  TextBlock,
  BulletListBlock,
  ChartBlock,
  TableBlock,
  ImageBlock,
} from '../types/slideSpec';

// ============================================
// 1. 렌더러 설정
// ============================================

export interface RendererConfig {
  /** 출력 경로 */
  outputPath: string;
  /** 프레젠테이션 제목 */
  title?: string;
  /** 작성자 */
  author?: string;
  /** 회사명 */
  company?: string;
  /** 슬라이드 크기 (인치) */
  slideSize?: { width: number; height: number };
  /** 화면 비율 */
  aspectRatio?: string;
}

// ============================================
// 2. 색상 유틸리티
// ============================================

function resolveColor(
  colorValue: { hex: string } | { theme: string } | undefined,
  theme: Theme
): string {
  if (!colorValue) return theme.colors.surfaceForeground;
  
  if ('hex' in colorValue) {
    return colorValue.hex;
  }
  
  // 테마 색상 매핑
  const themeColors: Record<string, string> = {
    'primary': theme.colors.primary,
    'primary-light': theme.colors.primaryLight,
    'primary-dark': theme.colors.primaryDark,
    'secondary': theme.colors.secondary,
    'surface': theme.colors.surface,
    'muted': theme.colors.muted,
    'accent': theme.colors.accent,
    'border': theme.colors.border,
  };
  
  return themeColors[colorValue.theme] || theme.colors.surfaceForeground;
}

// ============================================
// 3. 블록 렌더러
// ============================================

class BlockRenderer {
  private pptx: PptxGenJS;
  private slide: PptxGenJS.Slide;
  private theme: Theme;
  
  constructor(pptx: PptxGenJS, slide: PptxGenJS.Slide, theme: Theme) {
    this.pptx = pptx;
    this.slide = slide;
    this.theme = theme;
  }
  
  render(block: ContentBlock, layout: LayoutedBlock): void {
    switch (block.type) {
      case 'text':
        this.renderText(block, layout);
        break;
      case 'bulletList':
        this.renderBulletList(block, layout);
        break;
      case 'chart':
        this.renderChart(block, layout);
        break;
      case 'table':
        this.renderTable(block, layout);
        break;
      case 'image':
        this.renderImage(block, layout);
        break;
      case 'shape':
        this.renderShape(block, layout);
        break;
      case 'placeholder':
        this.renderPlaceholder(block, layout);
        break;
    }
  }
  
  private renderText(block: TextBlock, layout: LayoutedBlock): void {
    const { x, y, width, height } = layout.box;
    const fontSize = layout.computedFontSize || this.theme.fontSizes.body;
    
    this.slide.addText(block.content, {
      x,
      y,
      w: width,
      h: height,
      fontSize,
      fontFace: block.style?.fontFamily || this.theme.fonts.content,
      color: resolveColor(block.style?.color, this.theme),
      bold: block.style?.fontWeight === 'bold',
      italic: block.style?.fontStyle === 'italic',
      align: block.style?.textAlign || 'left',
      valign: 'top',
      lineSpacing: (block.style?.lineHeight || this.theme.lineHeights.body) * fontSize,
    });
  }
  
  private renderBulletList(block: BulletListBlock, layout: LayoutedBlock): void {
    const { x, y, width, height } = layout.box;
    const fontSize = block.style?.fontSize || this.theme.fontSizes.body;
    
    const textItems = block.items.map(item => ({
      text: item.content,
      options: {
        bullet: { type: 'bullet' as const },
        indentLevel: item.level,
      },
    }));
    
    this.slide.addText(textItems, {
      x,
      y,
      w: width,
      h: height,
      fontSize,
      fontFace: block.style?.fontFamily || this.theme.fonts.content,
      color: resolveColor(block.style?.color, this.theme),
      valign: 'top',
      lineSpacing: (block.style?.lineHeight || this.theme.lineHeights.body) * fontSize,
    });
  }
  
  private renderChart(block: ChartBlock, layout: LayoutedBlock): void {
    const { x, y, width, height } = layout.box;

    // 차트 타입 매핑 (pptxgenjs ChartType 사용)
    const chartTypeMap: Record<string, PptxGenJS.CHART_NAME> = {
      bar: this.pptx.ChartType.bar,
      line: this.pptx.ChartType.line,
      pie: this.pptx.ChartType.pie,
      doughnut: this.pptx.ChartType.doughnut,
      area: this.pptx.ChartType.area,
    };

    const chartType = chartTypeMap[block.chartType] || this.pptx.ChartType.bar;
    
    // 데이터 변환
    const chartData = block.data.map(series => ({
      name: series.name,
      labels: series.labels,
      values: series.values,
    }));
    
    this.slide.addChart(chartType, chartData, {
      x,
      y,
      w: width,
      h: height,
      showLegend: block.options?.showLegend ?? true,
      showValue: block.options?.showValues ?? false,
      chartColors: block.options?.colors || [
        this.theme.colors.primary,
        this.theme.colors.primaryLight,
        this.theme.colors.accent,
      ],
      showCatAxisTitle: !!block.options?.xAxisTitle,
      catAxisTitle: block.options?.xAxisTitle,
      showValAxisTitle: !!block.options?.yAxisTitle,
      valAxisTitle: block.options?.yAxisTitle,
    });
  }
  
  private renderTable(block: TableBlock, layout: LayoutedBlock): void {
    const { x, y, width, height } = layout.box;
    
    // 테이블 데이터 구성
    const tableData: PptxGenJS.TableRow[] = [];
    
    // 헤더 행
    if (block.headers) {
      const headerRow = block.headers.map(header => ({
        text: header,
        options: {
          bold: true,
          fill: { color: block.style?.headerBgColor 
            ? resolveColor(block.style.headerBgColor, this.theme)
            : this.theme.colors.primary },
          color: 'FFFFFF',
        },
      }));
      tableData.push(headerRow);
    }
    
    // 데이터 행
    block.rows.forEach((row, rowIndex) => {
      const tableRow = row.map(cell => {
        if (typeof cell === 'string') {
          return { text: cell };
        }
        return {
          text: cell.content,
          options: {
            bold: cell.isHeader,
            colspan: cell.colspan,
            rowspan: cell.rowspan,
          },
        };
      });
      tableData.push(tableRow);
    });
    
    this.slide.addTable(tableData, {
      x,
      y,
      w: width,
      h: height,
      border: { pt: 1, color: resolveColor(block.style?.borderColor, this.theme) },
      fontFace: this.theme.fonts.content,
      fontSize: this.theme.fontSizes.caption,
      align: 'center',
      valign: 'middle',
    });
  }
  
  private renderImage(block: ImageBlock, layout: LayoutedBlock): void {
    const { x, y, width, height } = layout.box;
    
    // base64 또는 URL 처리
    const imageData = block.src.startsWith('data:')
      ? { data: block.src }
      : { path: block.src };
    
    this.slide.addImage({
      ...imageData,
      x,
      y,
      w: width,
      h: height,
      sizing: {
        type: block.fit === 'cover' ? 'cover' : 'contain',
        w: width,
        h: height,
      },
    });
  }
  
  private renderShape(block: any, layout: LayoutedBlock): void {
    const { x, y, width, height } = layout.box;
    
    // pptxgenjs ShapeType 매핑
    const shapeTypeMap: Record<string, PptxGenJS.SHAPE_NAME> = {
      rectangle: this.pptx.ShapeType.rect,
      circle: this.pptx.ShapeType.ellipse,
      line: this.pptx.ShapeType.line,
      arrow: this.pptx.ShapeType.rightArrow,
    };

    this.slide.addShape(shapeTypeMap[block.shapeType] || this.pptx.ShapeType.rect, {
      x,
      y,
      w: width,
      h: height,
      fill: block.fill ? { color: resolveColor(block.fill, this.theme) } : undefined,
      line: block.stroke ? {
        color: resolveColor(block.stroke.color, this.theme),
        pt: block.stroke.width,
      } : undefined,
    });
  }
  
  private renderPlaceholder(block: any, layout: LayoutedBlock): void {
    const { x, y, width, height } = layout.box;

    // 플레이스홀더는 점선 박스로 표시
    this.slide.addShape(this.pptx.ShapeType.rect, {
      x,
      y,
      w: width,
      h: height,
      fill: { color: this.theme.colors.muted },
      line: {
        color: this.theme.colors.border,
        pt: 1,
        dashType: 'dash',
      },
    });
    
    if (block.label) {
      this.slide.addText(block.label, {
        x,
        y: y + height / 2 - 0.2,
        w: width,
        h: 0.4,
        fontSize: 12,
        color: this.theme.colors.mutedForeground,
        align: 'center',
        valign: 'middle',
      });
    }
  }
}

// ============================================
// 4. 슬라이드 렌더러
// ============================================

class SlideRenderer {
  private pptx: PptxGenJS;
  private theme: Theme;
  
  constructor(pptx: PptxGenJS, theme: Theme) {
    this.pptx = pptx;
    this.theme = theme;
  }
  
  render(slideSpec: SlideSpec, layout: LayoutedSlide): void {
    const slide = this.pptx.addSlide();
    
    // 배경색 설정
    if (slideSpec.backgroundColor) {
      slide.background = {
        color: resolveColor(slideSpec.backgroundColor, this.theme),
      };
    }
    
    // 제목 렌더링
    if (slideSpec.title && layout.titleBox) {
      const { x, y, width, height } = layout.titleBox;
      const isMainTitle = slideSpec.type === 'title' || slideSpec.type === 'sectionTitle';
      
      slide.addText(slideSpec.title, {
        x,
        y,
        w: width,
        h: height,
        fontSize: isMainTitle ? this.theme.fontSizes.title : this.theme.fontSizes.sectionTitle,
        fontFace: this.theme.fonts.display,
        color: this.theme.colors.surfaceForeground,
        bold: true,
        align: isMainTitle ? 'center' : 'left',
        valign: 'middle',
      });
    }
    
    // 부제목 렌더링
    if (slideSpec.subtitle && layout.subtitleBox) {
      const { x, y, width, height } = layout.subtitleBox;
      
      slide.addText(slideSpec.subtitle, {
        x,
        y,
        w: width,
        h: height,
        fontSize: this.theme.fontSizes.body,
        fontFace: this.theme.fonts.content,
        color: this.theme.colors.mutedForeground,
        align: slideSpec.type === 'title' ? 'center' : 'left',
        valign: 'top',
      });
    }
    
    // 블록 렌더링
    const blockRenderer = new BlockRenderer(this.pptx, slide, this.theme);
    
    slideSpec.blocks.forEach((block, index) => {
      const blockLayout = layout.blocks.find(b => b.blockIndex === index);
      if (blockLayout) {
        blockRenderer.render(block, blockLayout);
      }
    });
    
    // 발표자 노트
    if (slideSpec.notes) {
      slide.addNotes(slideSpec.notes);
    }
  }
}

// ============================================
// 5. 메인 렌더러 클래스
// ============================================

export class PPTXRenderer {
  private pptx: PptxGenJS;
  private theme: Theme;
  private config: RendererConfig;
  
  constructor(theme: Theme, config: RendererConfig) {
    this.theme = theme;
    this.config = config;
    this.pptx = new PptxGenJS();
    
    this.initializePresentation();
  }
  
  private initializePresentation(): void {
    // 프레젠테이션 메타데이터
    this.pptx.title = this.config.title || 'Presentation';
    this.pptx.author = this.config.author || 'PPT Generator';
    this.pptx.company = this.config.company || '';

    // 레이아웃 설정
    if (this.config.slideSize) {
      // 커스텀 슬라이드 크기 사용
      this.pptx.defineLayout({
        name: 'CUSTOM',
        width: this.config.slideSize.width,
        height: this.config.slideSize.height,
      });
      this.pptx.layout = 'CUSTOM';
    } else {
      // 기본 16:9 레이아웃
      this.pptx.layout = 'LAYOUT_16x9';
    }

    // 기본 테마 색상
    this.pptx.theme = {
      headFontFace: this.theme.fonts.display,
      bodyFontFace: this.theme.fonts.content,
    };
  }
  
  /**
   * 전체 덱 렌더링
   */
  async render(
    deckSpec: DeckSpec,
    layoutResult: LayoutResult
  ): Promise<{ filePath: string; fileSize: number }> {
    const slideRenderer = new SlideRenderer(this.pptx, this.theme);
    
    // 각 슬라이드 렌더링
    deckSpec.slides.forEach((slideSpec, index) => {
      const layout = layoutResult.slides[index];
      slideRenderer.render(slideSpec, layout);
    });
    
    // 파일 저장
    const filePath = this.config.outputPath;
    await this.pptx.writeFile({ fileName: filePath });
    
    // 파일 크기 확인 (Node.js 환경에서만)
    let fileSize = 0;
    try {
      const fs = await import('fs');
      const stats = fs.statSync(filePath);
      fileSize = stats.size;
    } catch {
      // 브라우저 환경에서는 파일 크기 알 수 없음
    }
    
    return { filePath, fileSize };
  }
  
  /**
   * base64로 출력 (브라우저용)
   */
  async toBase64(
    deckSpec: DeckSpec,
    layoutResult: LayoutResult
  ): Promise<string> {
    const slideRenderer = new SlideRenderer(this.pptx, this.theme);
    
    deckSpec.slides.forEach((slideSpec, index) => {
      const layout = layoutResult.slides[index];
      slideRenderer.render(slideSpec, layout);
    });
    
    const data = await this.pptx.write({ outputType: 'base64' });
    return data as string;
  }
  
  /**
   * Blob으로 출력 (다운로드용)
   */
  async toBlob(
    deckSpec: DeckSpec,
    layoutResult: LayoutResult
  ): Promise<Blob> {
    const slideRenderer = new SlideRenderer(this.pptx, this.theme);
    
    deckSpec.slides.forEach((slideSpec, index) => {
      const layout = layoutResult.slides[index];
      slideRenderer.render(slideSpec, layout);
    });
    
    const data = await this.pptx.write({ outputType: 'blob' });
    return data as Blob;
  }
}

// ============================================
// 6. 편의 함수
// ============================================

export async function renderPresentation(
  deckSpec: DeckSpec,
  layoutResult: LayoutResult,
  theme: Theme,
  outputPath: string,
  options?: { slideSize?: { width: number; height: number }; aspectRatio?: string }
): Promise<{ filePath: string; fileSize: number }> {
  const renderer = new PPTXRenderer(theme, {
    outputPath,
    title: deckSpec.metadata.title,
    author: deckSpec.metadata.author,
    company: deckSpec.metadata.company,
    slideSize: options?.slideSize,
    aspectRatio: options?.aspectRatio,
  });

  return renderer.render(deckSpec, layoutResult);
}
