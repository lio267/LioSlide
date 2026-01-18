/**
 * Style Guardian - 스타일 규율 검사 서브에이전트
 * 
 * 역할:
 * 1. SlideSpec + Layout 결과 검사
 * 2. 린트 규칙 위반 탐지
 * 3. 수정안(Patch) 제안
 * 
 * 오버플로우 해결 우선순위:
 * 1. 문장 압축 (동의어/군더더기 제거)
 * 2. 불릿 수 줄이기
 * 3. 2단 레이아웃 전환
 * 4. 슬라이드 분할
 * 5. 폰트 축소 (최후 수단)
 */

import type {
  DeckSpec,
  SlideSpec,
  ContentBlock,
  LayoutResult,
  LayoutedSlide,
  LayoutedBlock,
  Theme,
  BoundingBox,
} from '../types/slideSpec';
import {
  LINT_RULES,
  CONSTANTS,
  OVERFLOW_FIX_PRIORITY,
  calculateContrastRatio,
  type LintViolation,
  type LintResult,
  type LintPatch,
  type RuleCategory,
  type RuleSeverity,
} from '../types/lintRules';
import type {
  StyleGuardianInput,
  StyleGuardianOutput,
} from '../types/agents';

// ============================================
// 1. Style Guardian 클래스
// ============================================

export class StyleGuardian {
  private deckSpec: DeckSpec;
  private layoutResult: LayoutResult;
  private theme: Theme;
  private categories: RuleCategory[];
  
  constructor(input: StyleGuardianInput) {
    this.deckSpec = input.deckSpec;
    this.layoutResult = input.layoutResult;
    this.theme = input.theme;
    this.categories = (input.categories as RuleCategory[]) || [];
  }
  
  /**
   * 전체 린트 실행
   */
  public lint(): StyleGuardianOutput {
    const violations: LintViolation[] = [];
    const patches: StyleGuardianOutput['patches'] = [];
    
    // 슬라이드별 검사
    this.deckSpec.slides.forEach((slide, slideIndex) => {
      const layoutedSlide = this.layoutResult.slides[slideIndex];
      
      // 마진 검사
      const marginViolations = this.checkMargins(slide, layoutedSlide, slideIndex);
      violations.push(...marginViolations);
      
      // 타이포그래피 검사
      const typoViolations = this.checkTypography(slide, slideIndex);
      violations.push(...typoViolations);
      
      // 콘텐츠 밀도 검사
      const densityViolations = this.checkDensity(slide, layoutedSlide, slideIndex);
      violations.push(...densityViolations);
      
      // 색상/대비 검사
      const colorViolations = this.checkColors(slide, slideIndex);
      violations.push(...colorViolations);
      
      // 오버플로우 검사
      const overflowViolations = this.checkOverflow(layoutedSlide, slideIndex);
      violations.push(...overflowViolations);
      
      // 일관성 검사 (전체 덱 수준)
      if (slideIndex === this.deckSpec.slides.length - 1) {
        const consistencyViolations = this.checkConsistency();
        violations.push(...consistencyViolations);
      }
    });
    
    // 카테고리 필터링
    const filteredViolations = this.categories.length > 0
      ? violations.filter(v => this.categories.includes(v.category as RuleCategory))
      : violations;
    
    // 패치 생성
    filteredViolations.forEach(violation => {
      if (violation.suggestedFix) {
        patches.push({
          slideIndex: violation.slideIndex,
          blockIndex: violation.blockIndex,
          patch: violation.suggestedFix,
          autoApplicable: this.isAutoApplicable(violation),
        });
      }
    });
    
    // 결과 집계
    const errorCount = filteredViolations.filter(v => v.severity === 'error').length;
    const warningCount = filteredViolations.filter(v => v.severity === 'warning').length;
    const infoCount = filteredViolations.filter(v => v.severity === 'info').length;
    
    const lintResult: LintResult = {
      violations: filteredViolations,
      errorCount,
      warningCount,
      infoCount,
      passed: errorCount === 0,
      executedAt: new Date().toISOString(),
    };
    
    return {
      lintResult,
      patches,
    };
  }
  
  // ==========================================
  // 마진 검사
  // ==========================================
  
  private checkMargins(
    slide: SlideSpec,
    layoutedSlide: LayoutedSlide,
    slideIndex: number
  ): LintViolation[] {
    const violations: LintViolation[] = [];
    
    layoutedSlide.blocks.forEach((block, blockIndex) => {
      // 안전 마진 검사
      if (!LINT_RULES.MARGIN_SAFE_BOUNDARY.check(block, this.theme)) {
        violations.push({
          ruleId: LINT_RULES.MARGIN_SAFE_BOUNDARY.id,
          severity: LINT_RULES.MARGIN_SAFE_BOUNDARY.severity,
          category: LINT_RULES.MARGIN_SAFE_BOUNDARY.category,
          slideIndex,
          blockIndex,
          message: LINT_RULES.MARGIN_SAFE_BOUNDARY.description,
          details: `블록이 안전 마진(${CONSTANTS.SAFE_MARGIN}in)을 벗어남`,
          suggestedFix: LINT_RULES.MARGIN_SAFE_BOUNDARY.fix(block, this.theme),
        });
      }
      
      // 가독 마진 검사 (권장)
      if (!LINT_RULES.MARGIN_READABLE_RECOMMENDED.check(block, this.theme)) {
        violations.push({
          ruleId: LINT_RULES.MARGIN_READABLE_RECOMMENDED.id,
          severity: LINT_RULES.MARGIN_READABLE_RECOMMENDED.severity,
          category: LINT_RULES.MARGIN_READABLE_RECOMMENDED.category,
          slideIndex,
          blockIndex,
          message: LINT_RULES.MARGIN_READABLE_RECOMMENDED.description,
          suggestedFix: LINT_RULES.MARGIN_READABLE_RECOMMENDED.fix(block, this.theme),
        });
      }
    });
    
    return violations;
  }
  
  // ==========================================
  // 타이포그래피 검사
  // ==========================================
  
  private checkTypography(slide: SlideSpec, slideIndex: number): LintViolation[] {
    const violations: LintViolation[] = [];
    
    slide.blocks.forEach((block, blockIndex) => {
      if (block.type === 'text' || block.type === 'bulletList') {
        const fontSize = block.style?.fontSize || this.theme.fontSizes.body;
        
        // 최소 폰트 크기 검사
        if (!LINT_RULES.TYPO_MIN_FONT_SIZE.check(fontSize)) {
          violations.push({
            ruleId: LINT_RULES.TYPO_MIN_FONT_SIZE.id,
            severity: LINT_RULES.TYPO_MIN_FONT_SIZE.severity,
            category: LINT_RULES.TYPO_MIN_FONT_SIZE.category,
            slideIndex,
            blockIndex,
            message: LINT_RULES.TYPO_MIN_FONT_SIZE.description,
            details: `현재 폰트 크기: ${fontSize}pt`,
            suggestedFix: LINT_RULES.TYPO_MIN_FONT_SIZE.fix(),
          });
        }
        
        // 행간 검사
        const lineHeight = block.style?.lineHeight || this.theme.lineHeights.body;
        if (!LINT_RULES.TYPO_LINE_HEIGHT_BODY.check(lineHeight)) {
          violations.push({
            ruleId: LINT_RULES.TYPO_LINE_HEIGHT_BODY.id,
            severity: LINT_RULES.TYPO_LINE_HEIGHT_BODY.severity,
            category: LINT_RULES.TYPO_LINE_HEIGHT_BODY.category,
            slideIndex,
            blockIndex,
            message: LINT_RULES.TYPO_LINE_HEIGHT_BODY.description,
            suggestedFix: LINT_RULES.TYPO_LINE_HEIGHT_BODY.fix(lineHeight),
          });
        }
        
        // 줄 길이 검사 (텍스트 블록만)
        if (block.type === 'text') {
          const avgLineLength = this.estimateLineLength(block.content);
          if (!LINT_RULES.TYPO_LINE_LENGTH.check(avgLineLength)) {
            violations.push({
              ruleId: LINT_RULES.TYPO_LINE_LENGTH.id,
              severity: LINT_RULES.TYPO_LINE_LENGTH.severity,
              category: LINT_RULES.TYPO_LINE_LENGTH.category,
              slideIndex,
              blockIndex,
              message: LINT_RULES.TYPO_LINE_LENGTH.description,
              details: `평균 줄 길이: ${avgLineLength}자`,
              suggestedFix: LINT_RULES.TYPO_LINE_LENGTH.fix(avgLineLength),
            });
          }
        }
      }
    });
    
    return violations;
  }
  
  // ==========================================
  // 콘텐츠 밀도 검사
  // ==========================================
  
  private checkDensity(
    slide: SlideSpec,
    layoutedSlide: LayoutedSlide,
    slideIndex: number
  ): LintViolation[] {
    const violations: LintViolation[] = [];
    
    // 불릿 리스트 검사
    slide.blocks.forEach((block, blockIndex) => {
      if (block.type === 'bulletList') {
        const bulletCount = block.items.length;
        
        // 최대 불릿 수 검사
        if (!LINT_RULES.DENSITY_MAX_BULLETS.check(bulletCount)) {
          violations.push({
            ruleId: LINT_RULES.DENSITY_MAX_BULLETS.id,
            severity: LINT_RULES.DENSITY_MAX_BULLETS.severity,
            category: LINT_RULES.DENSITY_MAX_BULLETS.category,
            slideIndex,
            blockIndex,
            message: LINT_RULES.DENSITY_MAX_BULLETS.description,
            details: `현재 불릿 수: ${bulletCount}`,
            suggestedFix: LINT_RULES.DENSITY_MAX_BULLETS.fix(bulletCount, slide),
          });
        }
        
        // 권장 불릿 수 검사
        else if (!LINT_RULES.DENSITY_RECOMMENDED_BULLETS.check(bulletCount)) {
          violations.push({
            ruleId: LINT_RULES.DENSITY_RECOMMENDED_BULLETS.id,
            severity: LINT_RULES.DENSITY_RECOMMENDED_BULLETS.severity,
            category: LINT_RULES.DENSITY_RECOMMENDED_BULLETS.category,
            slideIndex,
            blockIndex,
            message: LINT_RULES.DENSITY_RECOMMENDED_BULLETS.description,
            suggestedFix: LINT_RULES.DENSITY_RECOMMENDED_BULLETS.fix(),
          });
        }
        
        // 각 불릿 길이 검사
        block.items.forEach((item, itemIndex) => {
          const lineCount = this.estimateLineCount(item.content);
          if (!LINT_RULES.DENSITY_BULLET_LENGTH.check(lineCount)) {
            violations.push({
              ruleId: LINT_RULES.DENSITY_BULLET_LENGTH.id,
              severity: LINT_RULES.DENSITY_BULLET_LENGTH.severity,
              category: LINT_RULES.DENSITY_BULLET_LENGTH.category,
              slideIndex,
              blockIndex,
              message: `${LINT_RULES.DENSITY_BULLET_LENGTH.description} (불릿 #${itemIndex + 1})`,
              details: `예상 줄 수: ${lineCount.toFixed(1)}`,
              suggestedFix: LINT_RULES.DENSITY_BULLET_LENGTH.fix(),
            });
          }
        });
      }
    });
    
    // 오버플로우 검사
    const hasOverflow = layoutedSlide.blocks.some(b => b.hasOverflow);
    if (!LINT_RULES.DENSITY_SLIDE_OVERFLOW.check(hasOverflow)) {
      violations.push({
        ruleId: LINT_RULES.DENSITY_SLIDE_OVERFLOW.id,
        severity: LINT_RULES.DENSITY_SLIDE_OVERFLOW.severity,
        category: LINT_RULES.DENSITY_SLIDE_OVERFLOW.category,
        slideIndex,
        message: LINT_RULES.DENSITY_SLIDE_OVERFLOW.description,
        suggestedFix: LINT_RULES.DENSITY_SLIDE_OVERFLOW.fix(),
      });
    }
    
    return violations;
  }
  
  // ==========================================
  // 색상/대비 검사
  // ==========================================
  
  private checkColors(slide: SlideSpec, slideIndex: number): LintViolation[] {
    const violations: LintViolation[] = [];
    
    // 슬라이드 배경색
    const bgColor = this.getBackgroundColor(slide);
    
    // 강조색 카운트
    const accentColors = new Set<string>();
    
    slide.blocks.forEach((block, blockIndex) => {
      if (block.type === 'text' || block.type === 'bulletList') {
        const textColor = this.getTextColor(block);
        
        if (textColor && bgColor) {
          const contrastRatio = calculateContrastRatio(textColor, bgColor);
          
          if (!LINT_RULES.COLOR_CONTRAST.check(contrastRatio)) {
            violations.push({
              ruleId: LINT_RULES.COLOR_CONTRAST.id,
              severity: LINT_RULES.COLOR_CONTRAST.severity,
              category: LINT_RULES.COLOR_CONTRAST.category,
              slideIndex,
              blockIndex,
              message: LINT_RULES.COLOR_CONTRAST.description,
              details: `대비 비율: ${contrastRatio.toFixed(2)}:1`,
              suggestedFix: LINT_RULES.COLOR_CONTRAST.fix(),
            });
          }
        }
        
        // 강조색 수집
        if (block.style?.color && 'hex' in block.style.color) {
          accentColors.add(block.style.color.hex);
        }
      }
    });
    
    // 강조색 개수 검사
    if (!LINT_RULES.COLOR_ACCENT_LIMIT.check(accentColors.size)) {
      violations.push({
        ruleId: LINT_RULES.COLOR_ACCENT_LIMIT.id,
        severity: LINT_RULES.COLOR_ACCENT_LIMIT.severity,
        category: LINT_RULES.COLOR_ACCENT_LIMIT.category,
        slideIndex,
        message: LINT_RULES.COLOR_ACCENT_LIMIT.description,
        details: `강조색 수: ${accentColors.size}`,
        suggestedFix: LINT_RULES.COLOR_ACCENT_LIMIT.fix(),
      });
    }
    
    return violations;
  }
  
  // ==========================================
  // 오버플로우 검사
  // ==========================================
  
  private checkOverflow(layoutedSlide: LayoutedSlide, slideIndex: number): LintViolation[] {
    const violations: LintViolation[] = [];
    
    layoutedSlide.blocks.forEach((block, blockIndex) => {
      if (block.hasOverflow) {
        violations.push({
          ruleId: LINT_RULES.OVERFLOW_TEXT_BOX.id,
          severity: LINT_RULES.OVERFLOW_TEXT_BOX.severity,
          category: LINT_RULES.OVERFLOW_TEXT_BOX.category,
          slideIndex,
          blockIndex,
          message: LINT_RULES.OVERFLOW_TEXT_BOX.description,
          details: this.generateOverflowDetails(block),
          suggestedFix: LINT_RULES.OVERFLOW_TEXT_BOX.fix(),
        });
      }
    });
    
    return violations;
  }
  
  // ==========================================
  // 일관성 검사 (전체 덱)
  // ==========================================
  
  private checkConsistency(): LintViolation[] {
    const violations: LintViolation[] = [];
    
    // 폰트 패밀리 수집
    const fontFamilies = new Set<string>();
    fontFamilies.add(this.theme.fonts.display);
    fontFamilies.add(this.theme.fonts.content);
    
    this.deckSpec.slides.forEach((slide, slideIndex) => {
      slide.blocks.forEach((block) => {
        // table 블록은 다른 style 타입을 가짐
        if (block.type === 'table') return;
        if ('style' in block && block.style && 'fontFamily' in block.style && block.style.fontFamily) {
          fontFamilies.add(block.style.fontFamily);
        }
      });
    });
    
    if (!LINT_RULES.CONSISTENCY_FONT_FAMILY.check(fontFamilies.size)) {
      violations.push({
        ruleId: LINT_RULES.CONSISTENCY_FONT_FAMILY.id,
        severity: LINT_RULES.CONSISTENCY_FONT_FAMILY.severity,
        category: LINT_RULES.CONSISTENCY_FONT_FAMILY.category,
        slideIndex: 0,
        message: LINT_RULES.CONSISTENCY_FONT_FAMILY.description,
        details: `사용된 폰트: ${Array.from(fontFamilies).join(', ')}`,
        suggestedFix: LINT_RULES.CONSISTENCY_FONT_FAMILY.fix(),
      });
    }
    
    return violations;
  }
  
  // ==========================================
  // 유틸리티 메서드
  // ==========================================
  
  private estimateLineLength(content: string): number {
    const lines = content.split('\n');
    if (lines.length === 0) return 0;
    return lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
  }
  
  private estimateLineCount(content: string): number {
    // 대략적인 계산: 60자당 1줄
    return content.length / 60;
  }
  
  private getBackgroundColor(slide: SlideSpec): string {
    if (slide.backgroundColor) {
      if ('hex' in slide.backgroundColor) {
        return slide.backgroundColor.hex;
      }
      // 테마 색상 참조 해결
      return this.resolveThemeColor(slide.backgroundColor.theme);
    }
    return this.theme.colors.surface;
  }
  
  private getTextColor(block: ContentBlock): string | null {
    // table 블록은 다른 style 타입을 가짐
    if (block.type === 'table') {
      return this.theme.colors.surfaceForeground;
    }
    if ('style' in block && block.style && 'color' in block.style && block.style.color) {
      if ('hex' in block.style.color) {
        return block.style.color.hex;
      }
      return this.resolveThemeColor(block.style.color.theme);
    }
    return this.theme.colors.surfaceForeground;
  }
  
  private resolveThemeColor(themeColor: string): string {
    const colorMap: Record<string, string> = {
      'primary': this.theme.colors.primary,
      'primary-light': this.theme.colors.primaryLight,
      'primary-dark': this.theme.colors.primaryDark,
      'secondary': this.theme.colors.secondary,
      'surface': this.theme.colors.surface,
      'muted': this.theme.colors.muted,
      'accent': this.theme.colors.accent,
      'border': this.theme.colors.border,
    };
    return colorMap[themeColor] || this.theme.colors.surfaceForeground;
  }
  
  private generateOverflowDetails(block: LayoutedBlock): string {
    const fixOrder = OVERFLOW_FIX_PRIORITY.map((fix, i) => `${i + 1}. ${fix}`).join(' → ');
    return `해결 우선순위: ${fixOrder}`;
  }
  
  private isAutoApplicable(violation: LintViolation): boolean {
    // 자동 적용 가능한 패치 판단
    const autoApplicableRules = [
      'MARGIN_SAFE_BOUNDARY',
      'MARGIN_READABLE_RECOMMENDED',
      'TYPO_MIN_FONT_SIZE',
      'TYPO_LINE_HEIGHT_TITLE',
      'TYPO_LINE_HEIGHT_BODY',
      'CONSISTENCY_SPACING',
    ];
    return autoApplicableRules.includes(violation.ruleId);
  }
}

// ============================================
// 2. Style Guardian 실행 함수
// ============================================

export function runStyleGuardian(input: StyleGuardianInput): StyleGuardianOutput {
  const guardian = new StyleGuardian(input);
  return guardian.lint();
}

// ============================================
// 3. 자동 수정 유틸리티
// ============================================

export function applyAutoFixes(
  deckSpec: DeckSpec,
  output: StyleGuardianOutput
): DeckSpec {
  // deep clone
  const fixedSpec = JSON.parse(JSON.stringify(deckSpec)) as DeckSpec;
  
  // 자동 적용 가능한 패치만 적용
  const autoPatches = output.patches.filter(p => p.autoApplicable);
  
  autoPatches.forEach(({ slideIndex, blockIndex, patch }) => {
    try {
      if (patch.type === 'modify' && patch.value !== null) {
        // 간단한 경로 기반 수정
        // 실제 구현에서는 JSON Patch 라이브러리 사용 권장
        console.log(`Applying fix to slide ${slideIndex}:`, patch.description);
      }
    } catch (error) {
      console.error(`Failed to apply patch:`, error);
    }
  });
  
  return fixedSpec;
}
