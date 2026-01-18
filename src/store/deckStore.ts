/**
 * Zustand Store - PPT 자동 생성기 상태 관리
 * 
 * 상태 구조:
 * 1. DeckSpec (단일 진실)
 * 2. 파이프라인 상태
 * 3. UI 상태
 * 4. 테마 설정
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

import type {
  DeckSpec,
  SlideSpec,
  ContentBlock,
  Theme,
  LayoutResult,
} from '../types/slideSpec';
import type {
  UserInput,
  PipelineState,
  PipelineStage,
  PipelineConfig,
  OutlineAgentOutput,
  SpecBuilderAgentOutput,
  LayoutEngineOutput,
  RendererOutput,
  StyleGuardianOutput,
} from '../types/agents';
import type { LintResult } from '../types/lintRules';

// ============================================
// 1. 스토어 타입 정의
// ============================================

interface DeckStore {
  // ==========================================
  // State
  // ==========================================
  
  /** 현재 DeckSpec (단일 진실) */
  deckSpec: DeckSpec | null;
  
  /** 레이아웃 결과 */
  layoutResult: LayoutResult | null;
  
  /** 파이프라인 상태 */
  pipeline: PipelineState;
  
  /** 파이프라인 설정 */
  pipelineConfig: PipelineConfig;
  
  /** 사용자 입력 */
  userInput: UserInput | null;
  
  /** 테마 (기본값 제공) */
  theme: Theme;
  
  /** 린트 결과 */
  lintResult: LintResult | null;
  
  /** UI 상태 */
  ui: {
    selectedSlideIndex: number;
    selectedBlockIndex: number | null;
    previewMode: 'edit' | 'preview' | 'split';
    sidebarOpen: boolean;
    lintPanelOpen: boolean;
    isLoading: boolean;
    loadingMessage: string;
  };
  
  /** 히스토리 (실행 취소용) */
  history: {
    past: DeckSpec[];
    future: DeckSpec[];
  };
  
  // ==========================================
  // DeckSpec Actions
  // ==========================================
  
  /** DeckSpec 설정 */
  setDeckSpec: (spec: DeckSpec) => void;
  
  /** DeckSpec 초기화 */
  resetDeckSpec: () => void;
  
  /** 슬라이드 추가 */
  addSlide: (slide: Omit<SlideSpec, 'id'>, index?: number) => void;
  
  /** 슬라이드 삭제 */
  removeSlide: (index: number) => void;
  
  /** 슬라이드 이동 */
  moveSlide: (fromIndex: number, toIndex: number) => void;
  
  /** 슬라이드 업데이트 */
  updateSlide: (index: number, updates: Partial<SlideSpec>) => void;
  
  /** 블록 추가 */
  addBlock: (slideIndex: number, block: ContentBlock) => void;
  
  /** 블록 삭제 */
  removeBlock: (slideIndex: number, blockIndex: number) => void;
  
  /** 블록 업데이트 */
  updateBlock: (slideIndex: number, blockIndex: number, updates: Partial<ContentBlock>) => void;
  
  // ==========================================
  // Pipeline Actions
  // ==========================================
  
  /** 파이프라인 시작 */
  startPipeline: (input: UserInput) => void;
  
  /** 파이프라인 단계 설정 */
  setPipelineStage: (stage: PipelineStage) => void;
  
  /** 파이프라인 결과 설정 */
  setPipelineResult: <T extends keyof PipelineState['results']>(
    stage: T,
    result: PipelineState['results'][T]
  ) => void;
  
  /** 파이프라인 진행률 업데이트 */
  updateProgress: (progress: number) => void;
  
  /** 파이프라인 리셋 */
  resetPipeline: () => void;
  
  /** 파이프라인 설정 업데이트 */
  updatePipelineConfig: (config: Partial<PipelineConfig>) => void;
  
  // ==========================================
  // Layout Actions
  // ==========================================
  
  /** 레이아웃 결과 설정 */
  setLayoutResult: (result: LayoutResult) => void;
  
  // ==========================================
  // Lint Actions
  // ==========================================
  
  /** 린트 결과 설정 */
  setLintResult: (result: LintResult) => void;
  
  /** 린트 패치 적용 */
  applyLintPatch: (slideIndex: number, blockIndex: number | null, patch: any) => void;
  
  // ==========================================
  // Theme Actions
  // ==========================================
  
  /** 테마 설정 */
  setTheme: (theme: Theme) => void;
  
  /** 테마 부분 업데이트 */
  updateTheme: (updates: Partial<Theme>) => void;
  
  // ==========================================
  // UI Actions
  // ==========================================
  
  /** 슬라이드 선택 */
  selectSlide: (index: number) => void;
  
  /** 블록 선택 */
  selectBlock: (slideIndex: number, blockIndex: number | null) => void;
  
  /** 프리뷰 모드 변경 */
  setPreviewMode: (mode: 'edit' | 'preview' | 'split') => void;
  
  /** 사이드바 토글 */
  toggleSidebar: () => void;
  
  /** 린트 패널 토글 */
  toggleLintPanel: () => void;
  
  /** 로딩 상태 설정 */
  setLoading: (isLoading: boolean, message?: string) => void;
  
  // ==========================================
  // History Actions
  // ==========================================
  
  /** 실행 취소 */
  undo: () => void;
  
  /** 다시 실행 */
  redo: () => void;
  
  /** 히스토리에 저장 */
  saveToHistory: () => void;
}

// ============================================
// 2. 기본값 정의
// ============================================

const defaultTheme: Theme = {
  name: 'default',
  colors: {
    primary: '1791e8',
    primaryLight: '4ba8ed',
    primaryDark: '1273ba',
    secondary: 'f5f5f5',
    surface: 'ffffff',
    surfaceForeground: '1d1d1d',
    muted: 'f5f5f5',
    mutedForeground: '737373',
    accent: 'f5f5f5',
    border: 'c8c8c8',
  },
  fonts: {
    display: 'Arial',
    content: 'Arial',
    mono: 'Courier New',
  },
  fontSizes: {
    title: 44,
    sectionTitle: 34,
    body: 20,
    caption: 12,
    footnote: 10,
  },
  lineHeights: {
    title: 1.1,
    body: 1.3,
  },
  grid: {
    canvas: { width: 13.333, height: 7.5 },
    safeMargin: 0.5,
    readableMargin: 0.7,
    columns: 12,
    gutter: 0.2,
    baselineUnit: 8,
  },
};

const defaultPipelineState: PipelineState = {
  currentStage: 'idle',
  results: {},
  progress: 0,
  lintIterations: 0,
};

const defaultPipelineConfig: PipelineConfig = {
  autoFix: true,
  maxLintIterations: 3,
  stopOnLintError: false,
  outputDir: './output',
  saveSpec: true,
};

const defaultUI = {
  selectedSlideIndex: 0,
  selectedBlockIndex: null,
  previewMode: 'split' as const,
  sidebarOpen: true,
  lintPanelOpen: false,
  isLoading: false,
  loadingMessage: '',
};

// ============================================
// 3. 스토어 생성
// ============================================

export const useDeckStore = create<DeckStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // ==========================================
          // Initial State
          // ==========================================
          
          deckSpec: null,
          layoutResult: null,
          pipeline: defaultPipelineState,
          pipelineConfig: defaultPipelineConfig,
          userInput: null,
          theme: defaultTheme,
          lintResult: null,
          ui: defaultUI,
          history: { past: [], future: [] },
          
          // ==========================================
          // DeckSpec Actions
          // ==========================================
          
          setDeckSpec: (spec) => set((state) => {
            state.saveToHistory();
            state.deckSpec = spec;
          }),
          
          resetDeckSpec: () => set((state) => {
            state.deckSpec = null;
            state.layoutResult = null;
            state.lintResult = null;
          }),
          
          addSlide: (slide, index) => set((state) => {
            if (!state.deckSpec) return;
            state.saveToHistory();
            
            const newSlide: SlideSpec = {
              ...slide,
              id: uuidv4(),
            };
            
            if (index !== undefined) {
              state.deckSpec.slides.splice(index, 0, newSlide);
            } else {
              state.deckSpec.slides.push(newSlide);
            }
          }),
          
          removeSlide: (index) => set((state) => {
            if (!state.deckSpec || state.deckSpec.slides.length <= 1) return;
            state.saveToHistory();
            state.deckSpec.slides.splice(index, 1);
            
            // 선택된 슬라이드 인덱스 조정
            if (state.ui.selectedSlideIndex >= state.deckSpec.slides.length) {
              state.ui.selectedSlideIndex = state.deckSpec.slides.length - 1;
            }
          }),
          
          moveSlide: (fromIndex, toIndex) => set((state) => {
            if (!state.deckSpec) return;
            state.saveToHistory();
            
            const [slide] = state.deckSpec.slides.splice(fromIndex, 1);
            state.deckSpec.slides.splice(toIndex, 0, slide);
            
            // 선택된 슬라이드 인덱스 업데이트
            state.ui.selectedSlideIndex = toIndex;
          }),
          
          updateSlide: (index, updates) => set((state) => {
            if (!state.deckSpec) return;
            state.saveToHistory();
            
            Object.assign(state.deckSpec.slides[index], updates);
          }),
          
          addBlock: (slideIndex, block) => set((state) => {
            if (!state.deckSpec) return;
            state.saveToHistory();
            
            state.deckSpec.slides[slideIndex].blocks.push(block);
          }),
          
          removeBlock: (slideIndex, blockIndex) => set((state) => {
            if (!state.deckSpec) return;
            state.saveToHistory();
            
            state.deckSpec.slides[slideIndex].blocks.splice(blockIndex, 1);
          }),
          
          updateBlock: (slideIndex, blockIndex, updates) => set((state) => {
            if (!state.deckSpec) return;
            state.saveToHistory();
            
            Object.assign(
              state.deckSpec.slides[slideIndex].blocks[blockIndex],
              updates
            );
          }),
          
          // ==========================================
          // Pipeline Actions
          // ==========================================
          
          startPipeline: (input) => set((state) => {
            state.userInput = input;
            state.pipeline = {
              ...defaultPipelineState,
              currentStage: 'outline',
            };
          }),
          
          setPipelineStage: (stage) => set((state) => {
            state.pipeline.currentStage = stage;
          }),
          
          setPipelineResult: (stage, result) => set((state) => {
            state.pipeline.results[stage] = result;
          }),
          
          updateProgress: (progress) => set((state) => {
            state.pipeline.progress = Math.min(100, Math.max(0, progress));
          }),
          
          resetPipeline: () => set((state) => {
            state.pipeline = defaultPipelineState;
            state.userInput = null;
          }),
          
          updatePipelineConfig: (config) => set((state) => {
            Object.assign(state.pipelineConfig, config);
          }),
          
          // ==========================================
          // Layout Actions
          // ==========================================
          
          setLayoutResult: (result) => set((state) => {
            state.layoutResult = result;
          }),
          
          // ==========================================
          // Lint Actions
          // ==========================================
          
          setLintResult: (result) => set((state) => {
            state.lintResult = result;
          }),
          
          applyLintPatch: (slideIndex, blockIndex, patch) => set((state) => {
            if (!state.deckSpec) return;
            state.saveToHistory();
            
            // 패치 적용 로직
            // TODO: JSON Patch 라이브러리로 실제 구현
            console.log('Applying patch:', { slideIndex, blockIndex, patch });
          }),
          
          // ==========================================
          // Theme Actions
          // ==========================================
          
          setTheme: (theme) => set((state) => {
            state.theme = theme;
          }),
          
          updateTheme: (updates) => set((state) => {
            Object.assign(state.theme, updates);
          }),
          
          // ==========================================
          // UI Actions
          // ==========================================
          
          selectSlide: (index) => set((state) => {
            state.ui.selectedSlideIndex = index;
            state.ui.selectedBlockIndex = null;
          }),
          
          selectBlock: (slideIndex, blockIndex) => set((state) => {
            state.ui.selectedSlideIndex = slideIndex;
            state.ui.selectedBlockIndex = blockIndex;
          }),
          
          setPreviewMode: (mode) => set((state) => {
            state.ui.previewMode = mode;
          }),
          
          toggleSidebar: () => set((state) => {
            state.ui.sidebarOpen = !state.ui.sidebarOpen;
          }),
          
          toggleLintPanel: () => set((state) => {
            state.ui.lintPanelOpen = !state.ui.lintPanelOpen;
          }),
          
          setLoading: (isLoading, message = '') => set((state) => {
            state.ui.isLoading = isLoading;
            state.ui.loadingMessage = message;
          }),
          
          // ==========================================
          // History Actions
          // ==========================================
          
          undo: () => set((state) => {
            if (state.history.past.length === 0 || !state.deckSpec) return;
            
            const previous = state.history.past.pop();
            if (previous) {
              state.history.future.push(state.deckSpec);
              state.deckSpec = previous;
            }
          }),
          
          redo: () => set((state) => {
            if (state.history.future.length === 0) return;
            
            const next = state.history.future.pop();
            if (next && state.deckSpec) {
              state.history.past.push(state.deckSpec);
              state.deckSpec = next;
            }
          }),
          
          saveToHistory: () => {
            const currentSpec = get().deckSpec;
            if (currentSpec) {
              set((state) => {
                // 최대 50개까지만 저장
                if (state.history.past.length >= 50) {
                  state.history.past.shift();
                }
                state.history.past.push(JSON.parse(JSON.stringify(currentSpec)));
                state.history.future = [];
              });
            }
          },
        })),
        {
          name: 'ppt-generator-store',
          partialize: (state) => ({
            // 영구 저장할 상태만 선택
            deckSpec: state.deckSpec,
            theme: state.theme,
            pipelineConfig: state.pipelineConfig,
          }),
        }
      )
    ),
    { name: 'PPT Generator Store' }
  )
);

// ============================================
// 4. 선택자 (Selectors)
// ============================================

export const selectCurrentSlide = (state: DeckStore) =>
  state.deckSpec?.slides[state.ui.selectedSlideIndex];

export const selectCurrentBlock = (state: DeckStore) => {
  const slide = selectCurrentSlide(state);
  if (!slide || state.ui.selectedBlockIndex === null) return null;
  return slide.blocks[state.ui.selectedBlockIndex];
};

export const selectSlideCount = (state: DeckStore) =>
  state.deckSpec?.slides.length ?? 0;

export const selectLintErrorCount = (state: DeckStore) =>
  state.lintResult?.errorCount ?? 0;

export const selectPipelineProgress = (state: DeckStore) =>
  state.pipeline.progress;

export const selectIsGenerating = (state: DeckStore) =>
  state.pipeline.currentStage !== 'idle' &&
  state.pipeline.currentStage !== 'complete' &&
  state.pipeline.currentStage !== 'error';
