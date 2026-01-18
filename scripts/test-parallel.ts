/**
 * 병렬 파이프라인 테스트 스크립트
 *
 * 비교 항목:
 * 1. 병렬 모드 (parallel: true)
 * 2. 순차 모드 (parallel: false)
 *
 * 측정: 실행 시간, 결과 비교
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  runParallelPipeline,
  ParallelPipelineOptions,
  ProgressEvent,
} from '../src/orchestrator/parallelOrchestrator';
import { PipelineResult } from '../src/pipeline';
import type { UserInput } from '../src/types/agents';

// ============================================
// 1. 테스트 입력 정의
// ============================================

const TEST_INPUT: UserInput = {
  topic: '스타트업 투자 유치 전략',
  tone: 'professional',
  audience: '벤처캐피탈 투자자',
  slideCount: 8,
  sourceContent: `
    스타트업 투자 유치는 성공적인 비즈니스 성장의 핵심입니다.

    시장 기회:
    - 글로벌 VC 투자 규모 3,000억 달러
    - AI/딥테크 분야 투자 급증
    - 동남아시아 스타트업 생태계 급성장

    투자 유치 전략:
    1. 탁월한 팀 구성 - 투자자들이 가장 중요하게 보는 요소
    2. 명확한 문제 정의와 해결책
    3. 검증된 비즈니스 모델
    4. 확장 가능한 시장 규모 (TAM/SAM/SOM)

    피칭 핵심:
    - 3분 안에 핵심 가치 전달
    - 트랙션과 성장 지표 강조
    - 경쟁사 대비 차별점 명확화

    투자 단계별 특징:
    - Pre-Seed: 아이디어 검증, 50만~200만 달러
    - Seed: MVP 개발, 200만~500만 달러
    - Series A: 제품-시장 적합성, 500만~1,500만 달러
    - Series B: 스케일업, 1,500만~5,000만 달러

    한국 VC 시장 동향:
    - 국내 VC 투자 역대 최고 기록
    - 딥테크, AI 스타트업 선호
    - ESG 투자 확대
  `,
  additionalInstructions: '구체적인 수치와 단계별 전략을 포함해주세요',
  branding: {
    companyName: 'Startup Korea',
  },
};

// ============================================
// 2. 유틸리티 함수
// ============================================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function createProgressLogger(mode: string): (event: ProgressEvent) => void {
  return (event: ProgressEvent) => {
    const bar = '█'.repeat(Math.floor(event.progress / 5)) +
                '░'.repeat(20 - Math.floor(event.progress / 5));
    console.log(
      `  [${mode}] ${bar} ${event.progress.toString().padStart(3)}% | ${event.message}`
    );
  };
}

function printSeparator(title: string): void {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function printResult(label: string, result: PipelineResult): void {
  console.log(`\n📊 ${label} 결과:`);
  console.log(`   - 성공: ${result.success ? '✅' : '❌'}`);
  console.log(`   - 소요 시간: ${formatDuration(result.duration)}`);
  console.log(`   - 린트 통과: ${result.lintPassed ? '✅' : '❌'}`);
  console.log(`   - 린트 반복: ${result.lintIterations}회`);
  if (result.outputPath) {
    console.log(`   - 출력 파일: ${result.outputPath}`);
  }
  if (result.deckSpec) {
    console.log(`   - 슬라이드 수: ${result.deckSpec.slides.length}개`);
  }
  if (result.error) {
    console.log(`   - 에러: ${result.error}`);
  }
}

function compareResults(
  parallelResult: PipelineResult,
  sequentialResult: PipelineResult
): void {
  printSeparator('비교 분석');

  // 시간 비교
  const timeDiff = sequentialResult.duration - parallelResult.duration;
  const speedup = sequentialResult.duration / Math.max(1, parallelResult.duration);

  console.log('⏱️  실행 시간 비교:');
  console.log(`   - 병렬 모드: ${formatDuration(parallelResult.duration)}`);
  console.log(`   - 순차 모드: ${formatDuration(sequentialResult.duration)}`);
  console.log(`   - 차이: ${formatDuration(Math.abs(timeDiff))} ${timeDiff > 0 ? '빠름' : '느림'}`);
  console.log(`   - 속도 향상: ${speedup.toFixed(2)}x`);

  // 결과 비교
  console.log('\n📋 결과 비교:');

  if (parallelResult.deckSpec && sequentialResult.deckSpec) {
    const pSlides = parallelResult.deckSpec.slides;
    const sSlides = sequentialResult.deckSpec.slides;

    console.log(`   - 병렬 슬라이드 수: ${pSlides.length}`);
    console.log(`   - 순차 슬라이드 수: ${sSlides.length}`);

    // 슬라이드별 차이 분석
    console.log('\n📑 슬라이드별 비교:');
    const maxSlides = Math.max(pSlides.length, sSlides.length);

    for (let i = 0; i < maxSlides; i++) {
      const pSlide = pSlides[i];
      const sSlide = sSlides[i];

      if (!pSlide || !sSlide) {
        console.log(`   [${i + 1}] ⚠️ 슬라이드 없음 (${!pSlide ? '병렬' : '순차'})`);
        continue;
      }

      const titleMatch = pSlide.title === sSlide.title;
      const typeMatch = pSlide.type === sSlide.type;
      const blocksCountMatch = pSlide.blocks.length === sSlide.blocks.length;

      const status = titleMatch && typeMatch && blocksCountMatch ? '✅' : '⚠️';
      console.log(
        `   [${i + 1}] ${status} ${pSlide.type.padEnd(12)} | ` +
        `제목: ${titleMatch ? '일치' : '다름'} | ` +
        `블록: ${pSlide.blocks.length} vs ${sSlide.blocks.length}`
      );

      // 차이점 상세 출력
      if (!titleMatch) {
        console.log(`       - 병렬 제목: "${pSlide.title}"`);
        console.log(`       - 순차 제목: "${sSlide.title}"`);
      }
    }

    // 콘텐츠 밀도 비교
    console.log('\n📊 콘텐츠 밀도 비교:');
    const pDensities = pSlides.map(s => s.constraints?.density || 'normal');
    const sDensities = sSlides.map(s => s.constraints?.density || 'normal');

    const densityCounts = (arr: string[]) => ({
      sparse: arr.filter(d => d === 'sparse').length,
      normal: arr.filter(d => d === 'normal').length,
      dense: arr.filter(d => d === 'dense').length,
    });

    const pCounts = densityCounts(pDensities);
    const sCounts = densityCounts(sDensities);

    console.log(`   - 병렬: sparse=${pCounts.sparse}, normal=${pCounts.normal}, dense=${pCounts.dense}`);
    console.log(`   - 순차: sparse=${sCounts.sparse}, normal=${sCounts.normal}, dense=${sCounts.dense}`);
  }

  // 린트 비교
  console.log('\n🔍 린트 결과 비교:');
  console.log(`   - 병렬 린트 통과: ${parallelResult.lintPassed ? '✅' : '❌'} (${parallelResult.lintIterations}회)`);
  console.log(`   - 순차 린트 통과: ${sequentialResult.lintPassed ? '✅' : '❌'} (${sequentialResult.lintIterations}회)`);

  // 결론
  printSeparator('결론');

  if (parallelResult.success && sequentialResult.success) {
    console.log('✅ 두 모드 모두 성공적으로 완료되었습니다.\n');

    if (speedup > 1.2) {
      console.log(`🚀 병렬 모드가 ${speedup.toFixed(2)}배 빠릅니다!`);
      console.log('   → Content Agent와 Design Agent의 병렬 실행이 효과적입니다.');
    } else if (speedup < 0.8) {
      console.log(`⚠️ 순차 모드가 더 빠릅니다 (${(1/speedup).toFixed(2)}배).`);
      console.log('   → 병렬 오버헤드가 이득보다 클 수 있습니다.');
    } else {
      console.log('⚖️ 두 모드의 성능이 비슷합니다.');
      console.log('   → 슬라이드 수가 적어 병렬화 이점이 제한적입니다.');
    }
  } else {
    if (!parallelResult.success) {
      console.log(`❌ 병렬 모드 실패: ${parallelResult.error}`);
    }
    if (!sequentialResult.success) {
      console.log(`❌ 순차 모드 실패: ${sequentialResult.error}`);
    }
  }
}

// ============================================
// 3. 메인 테스트 함수
// ============================================

async function runTest(): Promise<void> {
  console.log('\n');
  printSeparator('병렬 파이프라인 테스트');

  console.log('📝 테스트 입력:');
  console.log(`   - 주제: ${TEST_INPUT.topic}`);
  console.log(`   - 청중: ${TEST_INPUT.audience}`);
  console.log(`   - 톤: ${TEST_INPUT.tone}`);
  console.log(`   - 슬라이드 수: ${TEST_INPUT.slideCount}장`);

  // 출력 디렉토리 확인
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ==========================================
  // 병렬 모드 테스트
  // ==========================================
  printSeparator('1. 병렬 모드 실행');

  const parallelOptions: ParallelPipelineOptions = {
    parallel: true,
    debug: false,
    config: {
      outputDir: outputDir,
      autoFix: true,
      maxLintIterations: 3,
      stopOnLintError: false,
      saveSpec: true,
    },
    onProgress: createProgressLogger('병렬'),
  };

  console.log('🔀 병렬 모드로 실행 중...\n');
  const parallelStart = Date.now();
  const parallelResult = await runParallelPipeline(
    { ...TEST_INPUT, topic: `${TEST_INPUT.topic} (병렬)` },
    parallelOptions
  );
  const parallelDuration = Date.now() - parallelStart;

  // 실제 측정 시간 반영
  parallelResult.duration = parallelDuration;

  printResult('병렬 모드', parallelResult);

  // ==========================================
  // 순차 모드 테스트
  // ==========================================
  printSeparator('2. 순차 모드 실행');

  const sequentialOptions: ParallelPipelineOptions = {
    parallel: false,
    debug: false,
    config: {
      outputDir: outputDir,
      autoFix: true,
      maxLintIterations: 3,
      stopOnLintError: false,
      saveSpec: true,
    },
    onProgress: createProgressLogger('순차'),
  };

  console.log('📝 순차 모드로 실행 중...\n');
  const sequentialStart = Date.now();
  const sequentialResult = await runParallelPipeline(
    { ...TEST_INPUT, topic: `${TEST_INPUT.topic} (순차)` },
    sequentialOptions
  );
  const sequentialDuration = Date.now() - sequentialStart;

  // 실제 측정 시간 반영
  sequentialResult.duration = sequentialDuration;

  printResult('순차 모드', sequentialResult);

  // ==========================================
  // 결과 비교
  // ==========================================
  compareResults(parallelResult, sequentialResult);

  // 파일 목록 출력
  printSeparator('생성된 파일');

  const files = fs.readdirSync(outputDir).filter(f =>
    f.includes('스타트업_투자_유치_전략')
  );

  if (files.length > 0) {
    files.forEach(file => {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   📄 ${file} (${sizeKB} KB)`);
    });
  } else {
    console.log('   ⚠️ 생성된 파일이 없습니다.');
  }

  console.log('\n✅ 테스트 완료!\n');
}

// ============================================
// 4. 실행
// ============================================

runTest().catch((error) => {
  console.error('\n❌ 테스트 실패:', error);
  process.exit(1);
});
